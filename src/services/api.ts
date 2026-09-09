import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { localDb } from './localEngine';
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
      if (!error && data) return data;
    }
    return localDb.getItems(includeInactive);
  },

  async getItemRateHistory(itemId: string) {
    const [items, purchases, sales] = await Promise.all([
      this.getItems(true),
      this.getPurchases(),
      this.getSales(),
    ]);

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
      payment_method: string;
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
      payment_method: string;
      remaining_stock: number;
    };

    type LedgerMovement = {
      id: string;
      type: 'PURCHASE' | 'SALE';
      date: string;
      created_at: string;
      reference_number: string;
      party_name: string;
      payment_method: string;
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
            payment_method: p.payment_method || 'CASH',
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
            payment_method: s.payment_method || 'CASH',
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
      payment_method: string;
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
        payment_method: p.payment_method,
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
        payment_method: s.payment_method,
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
        runningStock -= m.quantity;
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
          localDb.updateItem(id, updates);
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
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete item error:', error);
        if (error.code === '23503') {
          throw new Error('This material has recorded transactions (purchases or sales). You can edit or deactivate it instead of deleting (सामग्री का पुराना रिकॉर्ड मौजूद है, हटाने के बजाय निष्क्रिय करें)।');
        }
        throw new Error(error.message || 'Failed to delete item from database');
      }
    }
    try {
      localDb.deleteItem(id);
    } catch {}
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
      if (!error && data) return data;
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
        return data.map((p: any) => ({
          ...p,
          party_name: p.party?.name,
          items: p.items?.map((it: any) => ({
            ...it,
            item_name: it.item?.name,
            item_local_name: it.item?.local_name,
          })),
        }));
      }
    }
    return localDb.getPurchases();
  },

  async createPurchase(payload: {
    party_id: string;
    purchase_date: string;
    items: { item_id: string; quantity: number; unit: any; rate: number; amount: number }[];
    paid_amount: number;
    payment_method: any;
    notes?: string;
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
          payment_method: payload.payment_method,
          notes: payload.notes,
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

  // Sales
  async getSales(): Promise<Sale[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('sales')
        .select('*, party:parties(name), items:sale_items(*, item:items(name, local_name))')
        .order('sale_date', { ascending: false });
      if (!error && data) {
        return data.map((s: any) => ({
          ...s,
          party_name: s.party?.name,
          items: s.items?.map((it: any) => ({
            ...it,
            item_name: it.item?.name,
            item_local_name: it.item?.local_name,
          })),
        }));
      }
    }
    return localDb.getSales();
  },

  async createSale(payload: {
    party_id: string;
    sale_date: string;
    items: { item_id: string; quantity: number; unit: any; rate: number; amount: number }[];
    received_amount: number;
    payment_method: any;
    notes?: string;
  }): Promise<Sale> {
    if (isSupabaseConfigured && supabase) {
      try {
        const biz = await this.getBusiness();
        const saleNumber = `SALE-${payload.sale_date.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
        const totalAmount = payload.items.reduce((s, it) => s + it.amount, 0);

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const safePartyId = isValidUUID.test(payload.party_id) ? payload.party_id : '00000000-0000-0000-0000-000000000002';

        const rpcPayload = {
          business_id: biz.id,
          sale_number: saleNumber,
          party_id: safePartyId,
          sale_date: payload.sale_date,
          total_amount: totalAmount,
          received_amount: payload.received_amount,
          payment_method: payload.payment_method,
          notes: payload.notes,
          items: payload.items,
        };

        const { data, error } = await supabase.rpc('rpc_create_sale', { p_payload: rpcPayload });
        if (!error && data?.success) {
          const sales = await this.getSales();
          const created = sales.find((s) => s.id === data.sale_id);
          if (created) return created;
        }
      } catch (e) {
        console.warn('Supabase createSale fallback to localEngine:', e);
      }
    }
    return localDb.createSale(payload);
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
    notes?: string;
  }): Promise<StockAdjustment> {
    if (isSupabaseConfigured && supabase) {
      const biz = await this.getBusiness();
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const adjNum = `ADJ-${today}-${Date.now().toString().slice(-4)}`;
      const rpcPayload = {
        business_id: biz.id,
        adjustment_number: adjNum,
        item_id: payload.item_id,
        quantity: payload.quantity,
        adjustment_type: payload.adjustment_type,
        reason: payload.reason,
        notes: payload.notes,
      };
      const { error } = await supabase.rpc('rpc_create_stock_adjustment', { p_payload: rpcPayload });
      if (error) throw new Error(error.message);
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
    payment_method: any;
    reference?: string;
    purchase_id?: string;
    sale_id?: string;
    notes?: string;
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
        payment_method: payload.payment_method,
        reference: payload.reference,
        purchase_id: payload.purchase_id,
        sale_id: payload.sale_id,
        notes: payload.notes,
      };
      const { error } = await supabase.rpc('rpc_create_payment', { p_payload: rpcPayload });
      if (error) throw new Error(error.message);
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
      if (!error && data) return data;
    }
    return localDb.getExpenses();
  },

  async createExpense(payload: {
    category: any;
    amount: number;
    expense_date: string;
    payment_method: any;
    notes?: string;
  }): Promise<Expense> {
    if (isSupabaseConfigured && supabase) {
      const biz = await this.getBusiness();
      const today = payload.expense_date.replace(/-/g, '');
      const expNum = `EXP-${today}-${Date.now().toString().slice(-4)}`;
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          business_id: biz.id,
          expense_number: expNum,
          category: payload.category,
          amount: payload.amount,
          expense_date: payload.expense_date,
          payment_method: payload.payment_method,
          notes: payload.notes,
        }])
        .select()
        .single();
      if (!error && data) return data;
    }
    return localDb.createExpense(payload);
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

    const today = new Date().toISOString().split('T')[0];

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
    const [purchases, sales, items] = await Promise.all([
      this.getPurchases(),
      this.getSales(),
      this.getItems(),
    ]);

    const filteredPurchases = purchases.filter(
      (p) => p.purchase_date >= startDate && p.purchase_date <= endDate && p.status === 'FINAL'
    );
    const filteredSales = sales.filter(
      (s) => s.sale_date >= startDate && s.sale_date <= endDate && s.status === 'FINAL'
    );

    const totalPurchaseAmount = filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalPurchaseWeight = filteredPurchases.reduce((sum, p) => sum + (p.total_weight || 0), 0);
    const totalSaleAmount = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalSaleWeight = filteredSales.reduce((sum, s) => sum + (s.total_weight || 0), 0);
    const netBalance = totalSaleAmount - totalPurchaseAmount;

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
      totalPurchaseAmount: Number(totalPurchaseAmount.toFixed(2)),
      totalPurchaseWeight: Number(totalPurchaseWeight.toFixed(2)),
      totalSaleAmount: Number(totalSaleAmount.toFixed(2)),
      totalSaleWeight: Number(totalSaleWeight.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2)),
      purchases: filteredPurchases,
      sales: filteredSales,
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
