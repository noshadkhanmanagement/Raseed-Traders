import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { localDb, INITIAL_SCRAP_ITEMS, isDefaultScrapItem } from './localEngine';
export { isDefaultScrapItem } from './localEngine';
import {
  Business,
  ScrapItem,
  ScrapUnit,
  Party,
  PartyType,
  Purchase,
  Sale,
  StockAdjustment,
  Payment,
  Expense,
  InventoryLedgerEntry,
  DashboardKPIs,
} from '../types';
import { getLocalDateString } from '../utils/formatters';

export const api = {
  // Business
  async getBusiness(): Promise<Business> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('businesses').select('*').limit(1).single();
      if (!error && data) return data;
    }
    return localDb.getBusiness();
  },

  async updateSettings(settings: Partial<Business['settings']>): Promise<Business> {
    if (isSupabaseConfigured && supabase) {
      const biz = await this.getBusiness();
      const newSettings = { ...biz.settings, ...settings };
      const { data, error } = await supabase
        .from('businesses')
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq('id', biz.id)
        .select()
        .single();
      if (!error && data) return data;
    }
    return localDb.updateSettings(settings);
  },

  async updateBusiness(updates: Partial<Business>): Promise<Business> {
    if (isSupabaseConfigured && supabase) {
      const biz = await this.getBusiness();
      const { data, error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', biz.id)
        .select()
        .single();
      if (!error && data) return data;
    }
    return localDb.updateBusiness(updates);
  },

  // Items
  async getItems(includeInactive = false): Promise<ScrapItem[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('items').select('*').order('name');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (!error && data) {
        // Auto-heal: If any standard items are missing (e.g. 2 TYRE accidentally deleted), restore in background!
        const existingNames = new Set(data.map((i) => (i.name || '').toUpperCase().trim()));
        const missing = INITIAL_SCRAP_ITEMS.filter((def) => !existingNames.has(def.name.toUpperCase().trim()));
        if (missing.length > 0) {
          this.restoreDefaultItems().catch((err) => console.warn('Auto-restore default items warning:', err));
        }
        return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
    }
    return localDb.getItems(includeInactive);
  },

  async getItemRateHistory(itemId: string) {
    const [items, purchases, sales, biz] = await Promise.all([
      this.getItems(true),
      this.getPurchases(),
      this.getSales(),
      this.getBusiness(),
    ]);

    const zeroFloor = biz?.settings?.negative_stock_zero_floor ?? false;

    const item = items.find((it) => it.id === itemId);

    type PurchaseBatch = {
      purchase_id: string;
      purchase_number: string;
      purchase_date: string;
      created_at: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      party_name: string;
    };

    type SaleBatch = {
      sale_id: string;
      sale_number: string;
      sale_date: string;
      created_at: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      party_name: string;
      remaining_stock: number;
    };

    type LedgerMovement = {
      id: string;
      type: 'PURCHASE' | 'SALE';
      date: string;
      created_at: string;
      reference_number: string;
      party_name: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      remaining_stock: number;
    };

    const purchaseBatches: PurchaseBatch[] = [];
    purchases.forEach((p) => {
      p.items?.forEach((it) => {
        if (it.item_id === itemId) {
          purchaseBatches.push({
            purchase_id: p.id,
            purchase_number: p.purchase_number,
            purchase_date: p.purchase_date,
            created_at: p.created_at || p.purchase_date,
            rate: Number(it.rate || 0),
            quantity: Number(it.quantity || 0),
            amount: Number(it.amount || 0),
            unit: it.unit || item?.default_unit || 'KG',
            party_name: p.party_name || 'Walk-in Cash Party (नकदी पार्टी)',
          });
        }
      });
    });

    const rawSaleBatches: Array<Omit<SaleBatch, 'remaining_stock'>> = [];
    sales.forEach((s) => {
      s.items?.forEach((it) => {
        if (it.item_id === itemId) {
          rawSaleBatches.push({
            sale_id: s.id,
            sale_number: s.sale_number,
            sale_date: s.sale_date,
            created_at: s.created_at || s.sale_date,
            rate: Number(it.rate || 0),
            quantity: Number(it.quantity || 0),
            amount: Number(it.amount || 0),
            unit: it.unit || item?.default_unit || 'KG',
            party_name: s.party_name || 'Buyer (क्रेता)',
          });
        }
      });
    });

    // Create combined chronological stream (oldest to newest) to compute running remaining stock
    type RawMovement = {
      id: string;
      type: 'PURCHASE' | 'SALE';
      date: string;
      created_at: string;
      reference_number: string;
      party_name: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
    };

    const rawMovements: RawMovement[] = [
      ...purchaseBatches.map((p) => ({
        id: p.purchase_id + '-' + p.purchase_number,
        type: 'PURCHASE' as const,
        date: p.purchase_date,
        created_at: p.created_at,
        reference_number: p.purchase_number,
        party_name: p.party_name,
        rate: p.rate,
        quantity: p.quantity,
        amount: p.amount,
        unit: p.unit,
      })),
      ...rawSaleBatches.map((s) => ({
        id: s.sale_id + '-' + s.sale_number,
        type: 'SALE' as const,
        date: s.sale_date,
        created_at: s.created_at,
        reference_number: s.sale_number,
        party_name: s.party_name,
        rate: s.rate,
        quantity: s.quantity,
        amount: s.amount,
        unit: s.unit,
      })),
    ];

    // Sort ascending for running balance calculation
    rawMovements.sort(
      (a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at)
    );

    let runningStock = 0;
    const saleRemainingMap = new Map<string, number>();

    const chronologicalMovements: LedgerMovement[] = rawMovements.map((m) => {
      if (m.type === 'PURCHASE') {
        runningStock += m.quantity;
      } else {
        runningStock = zeroFloor ? Math.max(0, runningStock - m.quantity) : (runningStock - m.quantity);
        saleRemainingMap.set(m.id, Number(runningStock.toFixed(3)));
      }
      return {
        ...m,
        remaining_stock: Number(runningStock.toFixed(3)),
      };
    });

    const saleBatches: SaleBatch[] = rawSaleBatches.map((s) => ({
      ...s,
      remaining_stock: saleRemainingMap.get(s.sale_id + '-' + s.sale_number) ?? 0,
    }));

    // Sort purchases & sales descending (newest first) for user-friendly display
    purchaseBatches.sort(
      (a, b) => b.purchase_date.localeCompare(a.purchase_date) || b.created_at.localeCompare(a.created_at)
    );
    saleBatches.sort(
      (a, b) => b.sale_date.localeCompare(a.sale_date) || b.created_at.localeCompare(a.created_at)
    );
    const movements = [...chronologicalMovements].reverse(); // Newest first

    // Purchases stats
    const purchaseRates = purchaseBatches.map((b) => b.rate).filter((r) => r > 0);
    const latestPurchaseRate = purchaseBatches.length > 0 ? purchaseBatches[0].rate : null;
    const highestPurchaseRate = purchaseRates.length > 0 ? Math.max(...purchaseRates) : null;
    const lowestPurchaseRate = purchaseRates.length > 0 ? Math.min(...purchaseRates) : null;
    const totalQuantityPurchased = purchaseBatches.reduce((sum, b) => sum + b.quantity, 0);
    const totalAmountPurchased = purchaseBatches.reduce((sum, b) => sum + b.amount, 0);
    const averagePurchaseRate =
      totalQuantityPurchased > 0
        ? totalAmountPurchased / totalQuantityPurchased
        : Number(item?.average_cost || 0);

    // Group purchases by distinct rate
    const purchaseRateGroupMap: Record<number, { rate: number; totalQty: number; totalAmount: number; count: number }> = {};
    purchaseBatches.forEach((b) => {
      if (!purchaseRateGroupMap[b.rate]) {
        purchaseRateGroupMap[b.rate] = { rate: b.rate, totalQty: 0, totalAmount: 0, count: 0 };
      }
      purchaseRateGroupMap[b.rate].totalQty += b.quantity;
      purchaseRateGroupMap[b.rate].totalAmount += b.amount;
      purchaseRateGroupMap[b.rate].count += 1;
    });
    const distinctPurchaseRates = Object.values(purchaseRateGroupMap).sort((a, b) => b.rate - a.rate);

    // Sales stats
    const saleRates = saleBatches.map((s) => s.rate).filter((r) => r > 0);
    const latestSaleRate = saleBatches.length > 0 ? saleBatches[0].rate : null;
    const highestSaleRate = saleRates.length > 0 ? Math.max(...saleRates) : null;
    const lowestSaleRate = saleRates.length > 0 ? Math.min(...saleRates) : null;
    const totalQuantitySold = saleBatches.reduce((sum, s) => sum + s.quantity, 0);
    const totalAmountSold = saleBatches.reduce((sum, s) => sum + s.amount, 0);
    const averageSaleRate = totalQuantitySold > 0 ? totalAmountSold / totalQuantitySold : 0;

    // Group sales by distinct rate
    const saleRateGroupMap: Record<number, { rate: number; totalQty: number; totalAmount: number; count: number }> = {};
    saleBatches.forEach((s) => {
      if (!saleRateGroupMap[s.rate]) {
        saleRateGroupMap[s.rate] = { rate: s.rate, totalQty: 0, totalAmount: 0, count: 0 };
      }
      saleRateGroupMap[s.rate].totalQty += s.quantity;
      saleRateGroupMap[s.rate].totalAmount += s.amount;
      saleRateGroupMap[s.rate].count += 1;
    });
    const distinctSaleRates = Object.values(saleRateGroupMap).sort((a, b) => b.rate - a.rate);

    return {
      item,
      batches: purchaseBatches, // backward compatibility
      purchases: purchaseBatches,
      sales: saleBatches,
      movements,
      stats: {
        currentStock: Number(item?.current_stock || 0),
        latestPurchaseRate,
        highestPurchaseRate,
        lowestPurchaseRate,
        averageCost: Number(averagePurchaseRate.toFixed(2)),
        averagePurchaseRate: Number(averagePurchaseRate.toFixed(2)),
        totalQuantityPurchased: Number(totalQuantityPurchased.toFixed(3)),
        totalAmountPurchased: Number(totalAmountPurchased.toFixed(2)),
        distinctRates: distinctPurchaseRates,
        distinctPurchaseRates,
        latestSaleRate,
        highestSaleRate,
        lowestSaleRate,
        averageSaleRate: Number(averageSaleRate.toFixed(2)),
        totalQuantitySold: Number(totalQuantitySold.toFixed(3)),
        totalAmountSold: Number(totalAmountSold.toFixed(2)),
        distinctSaleRates,
      },
    };
  },

  async createItem(item: Partial<ScrapItem> & { name: string; local_name: string; default_unit: ScrapUnit }): Promise<ScrapItem> {
    if (isSupabaseConfigured && supabase) {
      const biz = await this.getBusiness();
      const purchaseRate = Number(item.default_purchase_rate || 0);
      const initialStock = Number(item.current_stock || 0);
      const { data, error } = await supabase
        .from('items')
        .insert([{
          ...item,
          business_id: biz.id,
          default_purchase_rate: purchaseRate,
          default_sale_rate: Number(item.default_sale_rate || 0),
          current_stock: initialStock,
          average_cost: purchaseRate,
          is_active: item.is_active ?? true,
        }])
        .select()
        .single();
      if (!error && data) return data;
    }
    return localDb.createItem(item);
  },

  async updateItem(id: string, updates: Partial<ScrapItem>): Promise<ScrapItem> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        try {
          const localItem = localDb.getItemById(id) || localDb.getItems(true).find(i => (i.name || '').toUpperCase().trim() === (data.name || '').toUpperCase().trim());
          if (localItem) {
            localDb.updateItem(localItem.id, updates);
          } else {
            localDb.updateItem(id, updates);
          }
        } catch {}
        return data;
      }
      if (error) {
        console.error('Supabase update item error:', error);
        throw new Error(error.message || 'Failed to update item in database');
      }
    }
    return localDb.updateItem(id, updates);
  },

  async deleteItem(id: string): Promise<void> {
    const localItem = localDb.getItemById(id);
    if (localItem && isDefaultScrapItem(localItem.name)) {
      await this.resetItemStock(id);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Step 1: Cascade delete child records
        await Promise.allSettled([
          supabase.from('stock_cost_history').delete().eq('item_id', id),
          supabase.from('inventory_ledger').delete().eq('item_id', id),
          supabase.from('stock_adjustments').delete().eq('item_id', id),
          supabase.from('purchase_items').delete().eq('item_id', id),
          supabase.from('sale_items').delete().eq('item_id', id),
        ]);

        // Step 2: Delete item itself
        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete item error:', error);
          throw new Error(error.message || 'Failed to delete item from database');
        }
      } catch (err: any) {
        console.warn('Supabase cascade deleteItem warning, continuing with localDb:', err);
      }
    }
    try {
      localDb.deleteItem(id);
    } catch (localErr) {
      console.error('Local deleteItem error:', localErr);
    }
  },

  async resetItemStock(id: string): Promise<ScrapItem> {
    if (isSupabaseConfigured && supabase) {
      try {
        let itemName = '';
        let targetId = id;
        const { data: itemData } = await supabase.from('items').select('*').eq('id', id).maybeSingle();
        if (itemData) {
          itemName = itemData.name;
          targetId = itemData.id;
        }

        // 1. Delete item-specific ledger, cost history, adjustments
        await Promise.allSettled([
          supabase.from('stock_cost_history').delete().eq('item_id', targetId),
          supabase.from('inventory_ledger').delete().eq('item_id', targetId),
          supabase.from('stock_adjustments').delete().eq('item_id', targetId),
        ]);

        // 2. Clean up Purchases containing this item
        const { data: purchaseItems } = await supabase
          .from('purchase_items')
          .select('id, purchase_id, item_id, amount')
          .eq('item_id', targetId);

        if (purchaseItems && purchaseItems.length > 0) {
          const purchaseIds = Array.from(new Set(purchaseItems.map((pi: any) => pi.purchase_id)));
          for (const pId of purchaseIds) {
            const { data: allItemsOfP } = await supabase
              .from('purchase_items')
              .select('id, item_id, amount')
              .eq('purchase_id', pId);

            const remainingItems = (allItemsOfP || []).filter((pi: any) => pi.item_id !== targetId);
            if (remainingItems.length === 0) {
              await Promise.allSettled([
                supabase.from('inventory_ledger').delete().eq('reference_id', pId),
                supabase.from('payments').delete().eq('purchase_id', pId),
                supabase.from('purchase_items').delete().eq('purchase_id', pId),
              ]);
              await supabase.from('purchases').delete().eq('id', pId);
            } else {
              await supabase.from('purchase_items').delete().eq('purchase_id', pId).eq('item_id', targetId);
              const newTotal = remainingItems.reduce((sum: number, it: any) => sum + Number(it.amount || 0), 0);
              await supabase.from('purchases').update({
                total_amount: newTotal,
                subtotal: newTotal,
                paid_amount: newTotal,
                due_amount: 0,
              }).eq('id', pId);
            }
          }
        }

        // 3. Clean up Sales containing this item
        const { data: saleItems } = await supabase
          .from('sale_items')
          .select('id, sale_id, item_id, amount')
          .eq('item_id', targetId);

        if (saleItems && saleItems.length > 0) {
          const saleIds = Array.from(new Set(saleItems.map((si: any) => si.sale_id)));
          for (const sId of saleIds) {
            const { data: allItemsOfS } = await supabase
              .from('sale_items')
              .select('id, item_id, amount')
              .eq('sale_id', sId);

            const remainingItems = (allItemsOfS || []).filter((si: any) => si.item_id !== targetId);
            if (remainingItems.length === 0) {
              await Promise.allSettled([
                supabase.from('inventory_ledger').delete().eq('reference_id', sId),
                supabase.from('payments').delete().eq('sale_id', sId),
                supabase.from('sale_items').delete().eq('sale_id', sId),
              ]);
              await supabase.from('sales').delete().eq('id', sId);
            } else {
              await supabase.from('sale_items').delete().eq('sale_id', sId).eq('item_id', targetId);
              const newTotal = remainingItems.reduce((sum: number, it: any) => sum + Number(it.amount || 0), 0);
              await supabase.from('sales').update({
                total_amount: newTotal,
                subtotal: newTotal,
                received_amount: newTotal,
                due_amount: 0,
              }).eq('id', sId);
            }
          }
        }

        // 4. Update the item itself in Supabase
        const { data, error } = await supabase
          .from('items')
          .update({
            current_stock: 0,
            average_cost: 0,
            default_purchase_rate: 0,
            default_sale_rate: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId)
          .select()
          .single();

        // 5. Sync to localDb
        try {
          const localItem = localDb.getItemById(targetId) || (itemName ? localDb.getItems(true).find(i => (i.name || '').toUpperCase().trim() === itemName.toUpperCase().trim()) : undefined);
          if (localItem) {
            localDb.resetItemStock(localItem.id);
          } else {
            localDb.resetItemStock(targetId);
          }
        } catch (e) {
          console.error('Error syncing reset to localDb:', e);
        }

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase resetItemStock warning, continuing with localDb:', err);
      }
    }
    return localDb.resetItemStock(id);
  },

  async restoreDefaultItems(): Promise<ScrapItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existing } = await supabase.from('items').select('*');
        const existingMap = new Map((existing || []).map((it) => [(it.name || '').toUpperCase().trim(), it]));
        const biz = await this.getBusiness();

        for (const def of INITIAL_SCRAP_ITEMS) {
          const norm = def.name.toUpperCase().trim();
          if (!existingMap.has(norm)) {
            await supabase.from('items').insert([{
              business_id: biz.id,
              name: def.name,
              local_name: def.local_name,
              default_unit: def.default_unit,
              default_purchase_rate: 0,
              default_sale_rate: 0,
              current_stock: 0,
              average_cost: 0,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);
          }
        }
      } catch (err) {
        console.warn('Supabase restoreDefaultItems warning:', err);
      }
    }
    return localDb.restoreDefaultItems();
  },

  async toggleItemActive(id: string): Promise<ScrapItem> {
    if (isSupabaseConfigured && supabase) {
      const { data: item } = await supabase.from('items').select('is_active').eq('id', id).single();
      if (item) {
        return this.updateItem(id, { is_active: !item.is_active });
      }
    }
    return localDb.toggleItemActive(id);
  },

  // Parties
  async getParties(includeInactive = false): Promise<Party[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('parties').select('*').order('name');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (!error && data) return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return localDb.getParties(includeInactive);
  },

  async createParty(party: Partial<Party> & { name: string; party_type: PartyType; opening_balance: number }): Promise<Party> {
    if (isSupabaseConfigured && supabase) {
      const biz = await this.getBusiness();
      const initialBalance = party.opening_balance > 0
        ? (party.opening_balance_type === 'RECEIVABLE' ? party.opening_balance : -party.opening_balance)
        : 0;
      const { data, error } = await supabase
        .from('parties')
        .insert([{ ...party, business_id: biz.id, current_balance: initialBalance, is_active: party.is_active ?? true }])
        .select()
        .single();
      if (!error && data) return data;
    }
    return localDb.createParty(party);
  },

  async updateParty(id: string, updates: Partial<Party>): Promise<Party> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('parties')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    return localDb.updateParty(id, updates);
  },

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, party:parties(name), items:purchase_items(*, item:items(name, local_name))')
        .order('purchase_date', { ascending: false });
      if (!error && data) {
        return data
          .map((p: any) => ({
            ...p,
            party_name: p.party?.name,
            items: (p.items || []).map((it: any) => ({
              ...it,
              item_name: it.item?.name,
              item_local_name: it.item?.local_name,
            })),
          }))
          .filter((p: any) => p.items && p.items.length > 0);
      }
    }
    return localDb.getPurchases();
  },

  async createPurchase(payload: {
    party_id: string;
    party_name?: string;
    purchase_date: string;
    items: { item_id: string; quantity: number; unit: any; rate: number; amount: number }[];
    paid_amount: number;
  }): Promise<Purchase> {
    if (isSupabaseConfigured && supabase) {
      try {
        const biz = await this.getBusiness();
        const purchaseNumber = `PUR-${payload.purchase_date.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
        const totalAmount = payload.items.reduce((s, it) => s + it.amount, 0);

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const safePartyId = isValidUUID.test(payload.party_id) ? payload.party_id : '00000000-0000-0000-0000-000000000002';

        const rpcPayload = {
          business_id: biz.id,
          purchase_number: purchaseNumber,
          party_id: safePartyId,
          purchase_date: payload.purchase_date,
          total_amount: totalAmount,
          paid_amount: payload.paid_amount,
          items: payload.items,
        };

        const { data, error } = await supabase.rpc('rpc_create_purchase', { p_payload: rpcPayload });
        if (!error && data?.success) {
          const purchases = await this.getPurchases();
          const created = purchases.find((p) => p.id === data.purchase_id);
          if (created) return created;
        }
      } catch (e) {
        console.warn('Supabase createPurchase fallback to localEngine:', e);
      }
    }
    return localDb.createPurchase(payload);
  },

  async deletePurchase(purchaseId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: pItems } = await supabase.from('purchase_items').select('*').eq('purchase_id', purchaseId);
        const affectedItemIds = (pItems || []).map((it) => it.item_id);

        await Promise.allSettled([
          supabase.from('inventory_ledger').delete().eq('reference_id', purchaseId),
          supabase.from('payments').delete().eq('purchase_id', purchaseId),
          supabase.from('purchase_items').delete().eq('purchase_id', purchaseId),
        ]);
        await supabase.from('purchases').delete().eq('id', purchaseId);

        // Recalculate true current_stock from remaining ledger entries
        const biz = await this.getBusiness();
        const zeroFloor = biz?.settings?.negative_stock_zero_floor ?? false;

        for (const itemId of affectedItemIds) {
          const { data: remainingLedger } = await supabase
            .from('inventory_ledger')
            .select('quantity_change')
            .eq('item_id', itemId);

          const trueStock = (remainingLedger || []).reduce(
            (sum: number, l: any) => sum + Number(l.quantity_change || 0),
            0
          );
          const finalStock = zeroFloor ? Math.max(0, trueStock) : trueStock;
          await supabase
            .from('items')
            .update({ current_stock: finalStock, updated_at: new Date().toISOString() })
            .eq('id', itemId);
        }
      } catch (e) {
        console.warn('Supabase deletePurchase warning, continuing with localDb:', e);
      }
    }
    localDb.deletePurchase(purchaseId);
  },

  async updatePurchaseTransaction(
    purchaseId: string,
    updates: {
      party_name?: string;
      items: { item_id: string; quantity: number; rate: number; amount: number }[];
      paid_amount?: number;
    }
  ): Promise<Purchase> {
    if (isSupabaseConfigured && supabase) {
      try {
        for (const it of updates.items) {
          const { data: existingIt } = await supabase.from('purchase_items').select('quantity').eq('purchase_id', purchaseId).eq('item_id', it.item_id).single();
          const oldQty = existingIt ? Number(existingIt.quantity) : 0;
          const diff = Number(it.quantity) - oldQty;
          const { data: curItem } = await supabase.from('items').select('current_stock').eq('id', it.item_id).single();
          if (curItem) {
            await supabase.from('items').update({ current_stock: Math.max(0, Number(curItem.current_stock || 0) + diff), default_purchase_rate: it.rate }).eq('id', it.item_id);
          }
          await supabase.from('purchase_items').update({ quantity: it.quantity, rate: it.rate, amount: it.amount }).eq('purchase_id', purchaseId).eq('item_id', it.item_id);
        }
        const totalAmount = updates.items.reduce((s, it) => s + it.amount, 0);
        const purchaseUpdates: any = {
          total_amount: totalAmount,
          subtotal: totalAmount,
          paid_amount: totalAmount,
          due_amount: 0,
        };
        await supabase.from('purchases').update(purchaseUpdates).eq('id', purchaseId);
      } catch (e) {
        console.warn('Supabase updatePurchaseTransaction fallback:', e);
      }
    }
    return localDb.updatePurchaseTransaction(purchaseId, updates);
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('sales')
        .select('*, party:parties(name), items:sale_items(*, item:items(name, local_name))')
        .order('sale_date', { ascending: false });
      if (!error && data) {
        return data
          .map((s: any) => ({
            ...s,
            party_name: s.party?.name,
            items: (s.items || []).map((it: any) => ({
              ...it,
              item_name: it.item?.name,
              item_local_name: it.item?.local_name,
            })),
          }))
          .filter((s: any) => s.items && s.items.length > 0);
      }
    }
    return localDb.getSales();
  },

  async createSale(payload: {
    party_id: string;
    party_name?: string;
    sale_date: string;
    items: { item_id: string; quantity: number; unit: any; rate: number; amount: number }[];
    received_amount: number;
  }): Promise<Sale> {
    if (isSupabaseConfigured && supabase) {
      try {
        const biz = await this.getBusiness();
        const allowNegative = biz?.settings?.allow_negative_stock ?? false;
        const zeroFloor = biz?.settings?.negative_stock_zero_floor ?? false;
        const canOversell = allowNegative || zeroFloor;

        const saleNumber = `SALE-${payload.sale_date.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
        const totalAmount = payload.items.reduce((s, it) => s + it.amount, 0);

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const safePartyId = isValidUUID.test(payload.party_id) ? payload.party_id : '00000000-0000-0000-0000-000000000002';

        // 1. Stock check if neither negative mode is enabled
        if (!canOversell) {
          for (const it of payload.items) {
            const { data: curItem } = await supabase.from('items').select('*').eq('id', it.item_id).single();
            if (curItem && (curItem.current_stock || 0) < it.quantity) {
              throw new Error(
                `Insufficient stock for ${curItem.name}. Available: ${curItem.current_stock} ${curItem.default_unit}. Requested: ${it.quantity} ${curItem.default_unit}.`
              );
            }
          }
        }

        // 2. If allowNegative (without zeroFloor), try Postgres RPC first
        if (allowNegative && !zeroFloor) {
          const rpcPayload = {
            business_id: biz.id,
            sale_number: saleNumber,
            party_id: safePartyId,
            sale_date: payload.sale_date,
            total_amount: totalAmount,
            received_amount: payload.received_amount,
            items: payload.items,
          };

          const { data, error } = await supabase.rpc('rpc_create_sale', { p_payload: rpcPayload });
          if (!error && data?.success) {
            const sales = await this.getSales();
            const created = sales.find((s) => s.id === data.sale_id);
            if (created) return created;
          }
        }

        // 3. Direct Supabase insert (handles zero-floor clamping and standard sales)
        const saleId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-' + Date.now().toString().slice(-12);
        const nowIso = new Date().toISOString();

        const { data: newSale, error: saleErr } = await supabase.from('sales').insert([{
          id: saleId,
          business_id: biz.id,
          sale_number: saleNumber,
          party_id: safePartyId,
          sale_date: payload.sale_date,
          subtotal: totalAmount,
          total_amount: totalAmount,
          received_amount: payload.received_amount,
          due_amount: 0,
          total_cost: 0,
          total_profit: 0,
          status: 'FINAL',
          created_at: nowIso,
          updated_at: nowIso,
        }]).select().single();

        if (!saleErr && newSale) {
          for (const it of payload.items) {
            const saleItemId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0001-' + Date.now().toString().slice(-12);
            await supabase.from('sale_items').insert([{
              id: saleItemId,
              sale_id: saleId,
              item_id: it.item_id,
              quantity: it.quantity,
              unit: it.unit,
              rate: it.rate,
              amount: it.amount,
            }]);

            // Update item stock with zeroFloor clamping
            let targetStock = 0;
            const { data: curItem } = await supabase.from('items').select('current_stock').eq('id', it.item_id).single();
            if (curItem) {
              const currStock = Number(curItem.current_stock || 0);
              targetStock = zeroFloor
                ? Math.max(0, currStock - it.quantity)
                : (currStock - it.quantity);
              await supabase.from('items').update({
                current_stock: targetStock,
                default_sale_rate: it.rate,
                updated_at: nowIso,
              }).eq('id', it.item_id);
            }

            // Ledger entry
            await supabase.from('inventory_ledger').insert([{
              business_id: biz.id,
              item_id: it.item_id,
              transaction_type: 'SALE',
              reference_id: saleId,
              reference_number: saleNumber,
              quantity_change: -it.quantity,
              running_quantity: targetStock,
              party_id: safePartyId,
              unit: it.unit,
              rate: it.rate,
              created_at: nowIso,
            }]);
          }

          // Payment entry
          if (payload.received_amount > 0) {
            const payNum = `PAY-${payload.sale_date.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
            await supabase.from('payments').insert([{
              business_id: biz.id,
              party_id: safePartyId,
              payment_number: payNum,
              sale_id: saleId,
              amount: payload.received_amount,
              payment_type: 'PAYMENT_FROM_CUSTOMER',
              payment_method: 'CASH',
              payment_date: payload.sale_date,
              created_at: nowIso,
            }]);
          }

          const sales = await this.getSales();
          const created = sales.find((s) => s.id === saleId);
          if (created) return created;
        }
      } catch (e) {
        console.warn('Supabase createSale fallback to localEngine:', e);
      }
    }
    return localDb.createSale(payload);
  },

  async deleteSale(saleId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sItems } = await supabase.from('sale_items').select('*').eq('sale_id', saleId);
        const affectedItemIds = (sItems || []).map((it) => it.item_id);

        await Promise.allSettled([
          supabase.from('inventory_ledger').delete().eq('reference_id', saleId),
          supabase.from('payments').delete().eq('sale_id', saleId),
          supabase.from('sale_items').delete().eq('sale_id', saleId),
        ]);
        await supabase.from('sales').delete().eq('id', saleId);

        // Recalculate true current_stock from remaining ledger entries
        const biz = await this.getBusiness();
        const zeroFloor = biz?.settings?.negative_stock_zero_floor ?? false;

        for (const itemId of affectedItemIds) {
          const { data: remainingLedger } = await supabase
            .from('inventory_ledger')
            .select('quantity_change')
            .eq('item_id', itemId);

          const trueStock = (remainingLedger || []).reduce(
            (sum: number, l: any) => sum + Number(l.quantity_change || 0),
            0
          );
          const finalStock = zeroFloor ? Math.max(0, trueStock) : trueStock;
          await supabase
            .from('items')
            .update({ current_stock: finalStock, updated_at: new Date().toISOString() })
            .eq('id', itemId);
        }
      } catch (e) {
        console.warn('Supabase deleteSale warning, continuing with localDb:', e);
      }
    }
    localDb.deleteSale(saleId);
  },

  async updateSaleTransaction(
    saleId: string,
    updates: {
      party_name?: string;
      items: { item_id: string; quantity: number; rate: number; amount: number }[];
      received_amount?: number;
    }
  ): Promise<Sale> {
    if (isSupabaseConfigured && supabase) {
      try {
        const biz = await this.getBusiness();
        const zeroFloor = biz?.settings?.negative_stock_zero_floor ?? false;
        const allowNeg = biz?.settings?.allow_negative_stock ?? false;

        for (const it of updates.items) {
          const { data: existingIt } = await supabase.from('sale_items').select('quantity').eq('sale_id', saleId).eq('item_id', it.item_id).single();
          const oldQty = existingIt ? Number(existingIt.quantity) : 0;
          const diff = Number(it.quantity) - oldQty;
          const { data: curItem } = await supabase.from('items').select('current_stock').eq('id', it.item_id).single();
          if (curItem) {
            const targetStock = (zeroFloor || !allowNeg)
              ? Math.max(0, Number(curItem.current_stock || 0) - diff)
              : Number(curItem.current_stock || 0) - diff;
            await supabase.from('items').update({ current_stock: targetStock, default_sale_rate: it.rate }).eq('id', it.item_id);
          }
          await supabase.from('sale_items').update({ quantity: it.quantity, rate: it.rate, amount: it.amount }).eq('sale_id', saleId).eq('item_id', it.item_id);
        }
        const totalAmount = updates.items.reduce((s, it) => s + it.amount, 0);
        const saleUpdates: any = {
          total_amount: totalAmount,
          subtotal: totalAmount,
          received_amount: totalAmount,
          due_amount: 0,
        };
        await supabase.from('sales').update(saleUpdates).eq('id', saleId);
      } catch (e) {
        console.warn('Supabase updateSaleTransaction fallback:', e);
      }
    }
    return localDb.updateSaleTransaction(saleId, updates);
  },

  // Stock Adjustments
  async getStockAdjustments(): Promise<StockAdjustment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select('*, item:items(name)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((a: any) => ({ ...a, item_name: a.item?.name }));
      }
    }
    return localDb.getStockAdjustments();
  },

  async createStockAdjustment(payload: {
    item_id: string;
    quantity: number;
    adjustment_type: any;
    reason: string;
  }): Promise<StockAdjustment> {
    if (isSupabaseConfigured && supabase) {
      const biz = await this.getBusiness();
      const today = getLocalDateString().replace(/-/g, '');
      const adjNum = `ADJ-${today}-${Date.now().toString().slice(-4)}`;
      const rpcPayload = {
        business_id: biz.id,
        adjustment_number: adjNum,
        item_id: payload.item_id,
        quantity: payload.quantity,
        adjustment_type: payload.adjustment_type,
        reason: payload.reason,
      };
      const { error } = await supabase.rpc('rpc_create_stock_adjustment', { p_payload: rpcPayload });
      if (error) throw new Error(error.message);
      // Supabase succeeded — sync local and return
      try { localDb.createStockAdjustment(payload); } catch {}
      const adjustments = await this.getStockAdjustments();
      return adjustments[0] || localDb.createStockAdjustment(payload);
    }
    return localDb.createStockAdjustment(payload);
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*, party:parties(name)')
        .order('payment_date', { ascending: false });
      if (!error && data) {
        return data.map((p: any) => ({ ...p, party_name: p.party?.name }));
      }
    }
    return localDb.getPayments();
  },

  async createPayment(payload: {
    party_id: string;
    payment_type: any;
    amount: number;
    payment_date: string;
    reference?: string;
    purchase_id?: string;
    sale_id?: string;
  }): Promise<Payment> {
    if (isSupabaseConfigured && supabase) {
      const biz = await this.getBusiness();
      const today = payload.payment_date.replace(/-/g, '');
      const payNum = `PAY-${today}-${Date.now().toString().slice(-4)}`;
      const rpcPayload = {
        business_id: biz.id,
        payment_number: payNum,
        party_id: payload.party_id,
        payment_type: payload.payment_type,
        amount: payload.amount,
        payment_date: payload.payment_date,
        reference: payload.reference,
        purchase_id: payload.purchase_id,
        sale_id: payload.sale_id,
      };
      const { error } = await supabase.rpc('rpc_create_payment', { p_payload: rpcPayload });
      if (error) throw new Error(error.message);
      // Supabase succeeded — sync local and return
      try { localDb.createPayment(payload); } catch {}
      const payments = await this.getPayments();
      return payments[0] || localDb.createPayment(payload);
    }
    return localDb.createPayment(payload);
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (!error && data) {
        return data.map((e: any) => {
          let recipient_name = '';
          let reason = '';
          let extraNotes = e.notes || '';
          if (e.notes) {
            try {
              const parsed = JSON.parse(e.notes);
              if (parsed && typeof parsed === 'object') {
                recipient_name = parsed.recipient_name || '';
                reason = parsed.reason || '';
                extraNotes = parsed.notes || '';
              }
            } catch {
              if (e.notes.includes(' · ')) {
                const parts = e.notes.split(' · ');
                recipient_name = parts[0] || '';
                reason = parts[1] || '';
              } else {
                reason = e.notes;
              }
            }
          }
          return {
            ...e,
            recipient_name: recipient_name || 'Walk-in / Cash',
            reason: reason || e.category || 'Other Expense',
            notes: extraNotes,
          };
        });
      }
    }
    return localDb.getExpenses();
  },

  async createExpense(payload: {
    recipient_name: string;
    reason: string;
    amount: number;
    expense_date: string;
    category?: any;
    payment_method?: string;
    notes?: string;
  }): Promise<Expense> {
    if (isSupabaseConfigured && supabase) {
      try {
        const biz = await this.getBusiness();
        const today = payload.expense_date.replace(/-/g, '');
        const expNum = `EXP-${today}-${Date.now().toString().slice(-4)}`;
        const notesPayload = JSON.stringify({
          recipient_name: payload.recipient_name.trim(),
          reason: payload.reason.trim(),
          notes: payload.notes?.trim() || '',
        });
        const { data, error } = await supabase
          .from('expenses')
          .insert([{
            business_id: biz.id,
            expense_number: expNum,
            category: payload.category || 'OTHER',
            amount: payload.amount,
            expense_date: payload.expense_date,
            payment_method: payload.payment_method || 'CASH',
            notes: notesPayload,
          }])
          .select()
          .single();
        if (!error && data) {
          try {
            localDb.createExpense({ ...payload, id: data.id, expense_number: data.expense_number });
          } catch (e) {
            console.error('Error syncing expense to localDb:', e);
          }
          return {
            ...data,
            recipient_name: payload.recipient_name.trim(),
            reason: payload.reason.trim(),
          };
        }
      } catch (err) {
        console.warn('Supabase createExpense error, fallback to localDb:', err);
      }
    }
    return localDb.createExpense(payload);
  },

  async deleteExpense(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteExpense error, fallback to localDb:', err);
      }
    }
    localDb.deleteExpense(id);
  },

  async updateExpense(
    id: string,
    payload: {
      recipient_name: string;
      reason: string;
      amount: number;
      expense_date: string;
      notes?: string;
    }
  ): Promise<Expense> {
    if (isSupabaseConfigured && supabase) {
      try {
        const notesPayload = JSON.stringify({
          recipient_name: payload.recipient_name.trim(),
          reason: payload.reason.trim(),
          notes: payload.notes?.trim() || '',
        });
        const { data, error } = await supabase
          .from('expenses')
          .update({
            amount: payload.amount,
            expense_date: payload.expense_date,
            notes: notesPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          try {
            localDb.updateExpense(id, payload);
          } catch (e) {
            console.error('Error syncing update expense to localDb:', e);
          }
          return {
            ...data,
            recipient_name: payload.recipient_name.trim(),
            reason: payload.reason.trim(),
          };
        }
      } catch (err) {
        console.warn('Supabase updateExpense error, fallback to localDb:', err);
      }
    }
    return localDb.updateExpense(id, payload);
  },

  // Ledger
  async getInventoryLedger(itemId?: string): Promise<InventoryLedgerEntry[]> {
    return localDb.getInventoryLedger(itemId);
  },

  // Party Details & Ledger
  async getPartyLedger(partyId: string) {
    return localDb.getPartyLedger(partyId);
  },

  // KPIs
  async getDashboardKPIs(startDate: string, endDate: string): Promise<DashboardKPIs> {
    const [purchases, sales, items, parties, expenses] = await Promise.all([
      this.getPurchases(),
      this.getSales(),
      this.getItems(),
      this.getParties(),
      this.getExpenses(),
    ]);

    const today = getLocalDateString();

    const todayPurchases = purchases.filter((p) => p.purchase_date === today && p.status === 'FINAL');
    const todaySales = sales.filter((s) => s.sale_date === today && s.status === 'FINAL');

    const todayPurchaseTotal = todayPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
    const todayProfitTotal = todaySales.reduce((sum, s) => sum + (s.total_profit || 0), 0);

    const periodPurchases = purchases.filter((p) => p.purchase_date >= startDate && p.purchase_date <= endDate && p.status === 'FINAL');
    const periodSales = sales.filter((s) => s.sale_date >= startDate && s.sale_date <= endDate && s.status === 'FINAL');
    const periodExpenses = expenses.filter((e) => e.expense_date >= startDate && e.expense_date <= endDate);

    const periodPurchaseTotal = periodPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const periodSalesTotal = periodSales.reduce((sum, s) => sum + s.total_amount, 0);
    const periodProfitTotal = periodSales.reduce((sum, s) => sum + (s.total_profit || 0), 0);
    const periodExpensesTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const currentStockValue = items
      .filter((it) => it.is_active)
      .reduce((sum, it) => sum + Math.max(0, it.current_stock) * (it.average_cost || 0), 0);

    let pendingReceivables = 0;
    let pendingPayables = 0;

    parties
      .filter((p) => p.is_active)
      .forEach((p) => {
        if (p.current_balance > 0) {
          pendingReceivables += p.current_balance;
        } else if (p.current_balance < 0) {
          pendingPayables += Math.abs(p.current_balance);
        }
      });

    return {
      today_purchase: todayPurchaseTotal,
      today_sales: todaySalesTotal,
      today_profit: todayProfitTotal,
      period_purchase: periodPurchaseTotal,
      period_sales: periodSalesTotal,
      period_profit: periodProfitTotal,
      period_expenses: periodExpensesTotal,
      current_stock_value: Number(currentStockValue.toFixed(2)),
      pending_receivables: Number(pendingReceivables.toFixed(2)),
      pending_payables: Number(pendingPayables.toFixed(2)),
    };
  },

  // Search
  search(query: string) {
    return localDb.search(query);
  },

  // Analytics
  async getDateRangeAnalytics(startDate: string, endDate: string) {
    const [purchases, sales, items, expenses] = await Promise.all([
      this.getPurchases(),
      this.getSales(),
      this.getItems(),
      this.getExpenses(),
    ]);

    const filteredPurchases = purchases.filter(
      (p) => p.purchase_date >= startDate && p.purchase_date <= endDate && p.status === 'FINAL'
    );
    const filteredSales = sales.filter(
      (s) => s.sale_date >= startDate && s.sale_date <= endDate && s.status === 'FINAL'
    );
    const filteredExpenses = expenses.filter(
      (e) => e.expense_date >= startDate && e.expense_date <= endDate
    );

    const totalPurchaseAmount = filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalPurchaseWeight = filteredPurchases.reduce((sum, p) => sum + (p.total_weight || 0), 0);
    const totalSaleAmount = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalSaleWeight = filteredSales.reduce((sum, s) => sum + (s.total_weight || 0), 0);
    const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const tradeBalance = totalSaleAmount - totalPurchaseAmount;
    const netBalance = tradeBalance - totalExpenseAmount;

    const itemMap: Record<
      string,
      {
        itemId: string;
        itemName: string;
        localName: string;
        buyQty: number;
        buyAmount: number;
        sellQty: number;
        sellAmount: number;
        unit: string;
      }
    > = {};

    filteredPurchases.forEach((p) => {
      p.items?.forEach((it) => {
        if (!itemMap[it.item_id]) {
          const master = items.find((m) => m.id === it.item_id);
          itemMap[it.item_id] = {
            itemId: it.item_id,
            itemName: it.item_name || master?.name || 'Item',
            localName: master?.local_name || '',
            buyQty: 0,
            buyAmount: 0,
            sellQty: 0,
            sellAmount: 0,
            unit: it.unit || 'KG',
          };
        }
        itemMap[it.item_id].buyQty += it.quantity;
        itemMap[it.item_id].buyAmount += it.amount;
      });
    });

    filteredSales.forEach((s) => {
      s.items?.forEach((it) => {
        if (!itemMap[it.item_id]) {
          const master = items.find((m) => m.id === it.item_id);
          itemMap[it.item_id] = {
            itemId: it.item_id,
            itemName: it.item_name || master?.name || 'Item',
            localName: master?.local_name || '',
            buyQty: 0,
            buyAmount: 0,
            sellQty: 0,
            sellAmount: 0,
            unit: it.unit || 'KG',
          };
        }
        itemMap[it.item_id].sellQty += it.quantity;
        itemMap[it.item_id].sellAmount += it.amount;
      });
    });

    return {
      startDate,
      endDate,
      totalPurchasesCount: filteredPurchases.length,
      totalSalesCount: filteredSales.length,
      totalExpensesCount: filteredExpenses.length,
      totalPurchaseAmount: Number(totalPurchaseAmount.toFixed(2)),
      totalPurchaseWeight: Number(totalPurchaseWeight.toFixed(2)),
      totalSaleAmount: Number(totalSaleAmount.toFixed(2)),
      totalSaleWeight: Number(totalSaleWeight.toFixed(2)),
      totalExpenseAmount: Number(totalExpenseAmount.toFixed(2)),
      tradeBalance: Number(tradeBalance.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2)),
      purchases: filteredPurchases,
      sales: filteredSales,
      expenses: filteredExpenses,
      itemBreakdown: Object.values(itemMap),
    };
  },

  async getMonthlyAnalytics(year?: number) {
    const currentYear = year || new Date().getFullYear();
    const [purchases, sales] = await Promise.all([
      this.getPurchases(),
      this.getSales(),
    ]);

    const months = [
      { num: '01', name: 'January', hindi: 'जनवरी' },
      { num: '02', name: 'February', hindi: 'फ़रवरी' },
      { num: '03', name: 'March', hindi: 'मार्च' },
      { num: '04', name: 'April', hindi: 'अप्रैल' },
      { num: '05', name: 'May', hindi: 'मई' },
      { num: '06', name: 'June', hindi: 'जून' },
      { num: '07', name: 'July', hindi: 'जुलाई' },
      { num: '08', name: 'August', hindi: 'अगस्त' },
      { num: '09', name: 'September', hindi: 'सितंबर' },
      { num: '10', name: 'October', hindi: 'अक्टूबर' },
      { num: '11', name: 'November', hindi: 'नवंबर' },
      { num: '12', name: 'December', hindi: 'दिसंबर' },
    ];

    return months.map((m) => {
      const prefix = `${currentYear}-${m.num}`;
      const monthPurchases = purchases.filter(
        (p) => p.purchase_date.startsWith(prefix) && p.status === 'FINAL'
      );
      const monthSales = sales.filter(
        (s) => s.sale_date.startsWith(prefix) && s.status === 'FINAL'
      );

      const purchaseAmount = monthPurchases.reduce((acc, p) => acc + p.total_amount, 0);
      const purchaseWeight = monthPurchases.reduce((acc, p) => acc + (p.total_weight || 0), 0);
      const saleAmount = monthSales.reduce((acc, s) => acc + s.total_amount, 0);
      const saleWeight = monthSales.reduce((acc, s) => acc + (s.total_weight || 0), 0);

      return {
        monthKey: prefix,
        monthName: m.name,
        monthHindi: m.hindi,
        purchaseAmount: Number(purchaseAmount.toFixed(2)),
        purchaseWeight: Number(purchaseWeight.toFixed(2)),
        purchaseCount: monthPurchases.length,
        saleAmount: Number(saleAmount.toFixed(2)),
        saleWeight: Number(saleWeight.toFixed(2)),
        saleCount: monthSales.length,
        netDifference: Number((saleAmount - purchaseAmount).toFixed(2)),
      };
    });
  },

  // Backup & Reset
  exportBackup() {
    return localDb.getDataSnapshot();
  },

  importBackup(data: any) {
    localDb.importData(data);
  },

  async resetData(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Step 1: Delete all child transaction items and ledgers in parallel
        await Promise.all([
          supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('purchase_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('stock_cost_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('inventory_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('stock_adjustments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        ]);

        // Step 2: Delete parent sales & purchases, and reset items & parties in parallel
        await Promise.all([
          supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('items').update({
            current_stock: 0,
            average_cost: 0,
            default_purchase_rate: 0,
            default_sale_rate: 0,
            updated_at: new Date().toISOString(),
          }).neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('parties').update({
            current_balance: 0,
            updated_at: new Date().toISOString(),
          }).neq('id', '00000000-0000-0000-0000-000000000000'),
        ]);
      } catch (err) {
        console.error('Supabase resetData error:', err);
        throw err;
      }
    }
    localDb.resetToFreshData();
  },
};
