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
      if (!error && data) return data;
    }
    return localDb.updateItem(id, updates);
  },

  async deleteItem(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete item error:', error);
      }
    }
    localDb.deleteItem(id);
  },

  async toggleItemActive(id: string): Promise<ScrapItem> {
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
    return localDb.getDashboardKPIs(startDate, endDate);
  },

  // Search
  search(query: string) {
    return localDb.search(query);
  },

  // Analytics
  async getDateRangeAnalytics(startDate: string, endDate: string) {
    return localDb.getDateRangeAnalytics(startDate, endDate);
  },

  async getMonthlyAnalytics(year?: number) {
    return localDb.getMonthlyAnalytics(year);
  },

  // Backup & Reset
  exportBackup() {
    return localDb.getDataSnapshot();
  },

  importBackup(data: any) {
    localDb.importData(data);
  },

  resetData() {
    return localDb.resetToFreshData();
  },
};
