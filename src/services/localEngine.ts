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
  StockCostHistory,
  DashboardKPIs,
} from '../types';
import { getLocalDateString } from '../utils/formatters';

const STORAGE_KEY = 'scrap_management_storage_db';

// Clear legacy keys from previous iterations
try {
  const legacyKeys = [
    'scrap_management_system_live_v1',
    'scrap_manager_clean_v5',
    'scrap_manager_clean_v4',
    'scrap_manager_clean_v3',
    'scrap_manager_clean_v2',
    'scrap_manager_clean_v1',
    'noshad_scrap_manager_data_v1',
    'noshad_data_v2',
    'noshad_data_v1',
  ];
  legacyKeys.forEach((k) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(k);
    }
  });
} catch {
  // ignore in non-browser environments
}

export const INITIAL_SCRAP_ITEMS: Omit<ScrapItem, 'id' | 'business_id' | 'created_at' | 'updated_at'>[] = [
  { name: '2 TYRE', local_name: '2 टायर', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'ARMATURE', local_name: 'आर्मेचर', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'BATTERY', local_name: 'बैटरी', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'BEER BOTTLE', local_name: 'बीयर बोतल', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'DABBA', local_name: 'डब्बा', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'FOAM', local_name: 'फ़ोम', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'GERMAN', local_name: 'जर्मन', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'KAACH BOTTLE', local_name: 'काँच बोतल', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'KALA FOAM', local_name: 'काला फ़ोम', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'KALI PLASTIC', local_name: 'काली प्लास्टिक', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'KHADDA', local_name: 'खड्डा', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'LOHA', local_name: 'लोहा', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PADPAD', local_name: 'पड़पड़', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PALIYA', local_name: 'पलिया', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PAUA BOTTLE', local_name: 'पौआ बोतल', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PEETAL', local_name: 'पीतल', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PLASTIC', local_name: 'प्लास्टिक', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PLATE', local_name: 'प्लेट', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'RADDI', local_name: 'रद्दी', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'REGULATOR', local_name: 'रेगुलेटर', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'STEEL', local_name: 'स्टील', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'TAMBA', local_name: 'ताँबा', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'TEEN', local_name: 'टीन', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'TUBE', local_name: 'ट्यूब', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'TYRE', local_name: 'टायर', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
];

export const isDefaultScrapItem = (name?: string): boolean => {
  if (!name) return false;
  const norm = name.toUpperCase().trim();
  return INITIAL_SCRAP_ITEMS.some((def) => def.name.toUpperCase().trim() === norm);
};

export interface AppDatabaseSchema {
  business: Business;
  items: ScrapItem[];
  parties: Party[];
  purchases: Purchase[];
  sales: Sale[];
  stock_adjustments: StockAdjustment[];
  payments: Payment[];
  expenses: Expense[];
  inventory_ledger: InventoryLedgerEntry[];
  stock_cost_history: StockCostHistory[];
}

const DEFAULT_BUSINESS_ID = 'biz-001';

export const getInitialData = (): AppDatabaseSchema => {
  const now = new Date().toISOString();

  const business: Business = {
    id: DEFAULT_BUSINESS_ID,
    name: 'Raseed Traders',
    phone: '+91 744 061 9649',
    address: 'Behind Masjid, Bus Stand, Lakhnadon 480886',
    settings: {
      allow_negative_stock: false,
      default_unit: 'KG',
      stock_warning_threshold: 50,
      currency: '₹',
    },
    created_at: now,
    updated_at: now,
  };

  const items: ScrapItem[] = INITIAL_SCRAP_ITEMS.map((item, idx) => ({
    ...item,
    id: `item-${String(idx + 1).padStart(3, '0')}`,
    business_id: DEFAULT_BUSINESS_ID,
    created_at: now,
    updated_at: now,
  }));

  return {
    business,
    items,
    parties: [],
    purchases: [],
    sales: [],
    stock_adjustments: [],
    payments: [],
    expenses: [],
    inventory_ledger: [],
    stock_cost_history: [],
  };
};

class LocalEngine {
  private data: AppDatabaseSchema;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): AppDatabaseSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all required collections exist
        if (parsed && parsed.items && parsed.business) {
          parsed.business.name = 'Raseed Traders';
          parsed.business.phone = '+91 744 061 9649';
          parsed.business.address = 'Behind Masjid, Bus Stand, Lakhnadon 480886';

          // Strictly enforce ONLY the 25 allowed items, without extra unwanted items
          const allowedNames = new Set(INITIAL_SCRAP_ITEMS.map((i) => i.name.toUpperCase().trim()));
          parsed.items = parsed.items.filter((it: ScrapItem) => allowedNames.has((it.name || '').toUpperCase().trim()));

          // Auto-heal/restore any missing items from the 25 (e.g. if 2 TYRE was accidentally deleted)
          INITIAL_SCRAP_ITEMS.forEach((def, idx) => {
            const found = parsed.items.find((it: ScrapItem) => (it.name || '').toUpperCase().trim() === def.name.toUpperCase().trim());
            if (!found) {
              parsed.items.push({
                ...def,
                id: `item-${String(idx + 1).padStart(3, '0')}`,
                business_id: DEFAULT_BUSINESS_ID,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            } else {
              found.local_name = def.local_name;
              found.default_unit = def.default_unit;
            }
          });

          // Strictly enforce zero default rate everywhere in DB (only set at buy/sell time)
          parsed.items.forEach((it: ScrapItem) => {
            it.default_purchase_rate = 0;
            it.default_sale_rate = 0;
          });

          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read local database, using fresh state', e);
    }
    const initial = getInitialData();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(data: AppDatabaseSchema = this.data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  public getDataSnapshot(): AppDatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public resetToFreshData(): AppDatabaseSchema {
    this.data = getInitialData();
    this.saveToStorage();
    return this.getDataSnapshot();
  }

  public importData(importedData: AppDatabaseSchema): void {
    if (!importedData.items || !importedData.business) {
      throw new Error('Invalid backup file format.');
    }
    this.data = importedData;
    this.saveToStorage();
  }

  // Next transaction sequence numbering helper
  private generateDocNumber(prefix: string, dateStr: string, existingList: { created_at?: string }[]): string {
    const compactDate = dateStr.replace(/-/g, '');
    const todaysDocs = existingList.filter((doc) => {
      const docDate = (doc.created_at || '').split('T')[0]?.replace(/-/g, '');
      return docDate === compactDate;
    });
    const seq = String(todaysDocs.length + 1).padStart(3, '0');
    return `${prefix}-${compactDate}-${seq}`;
  }

  // --- BUSINESS & SETTINGS ---
  public getBusiness(): Business {
    return this.data.business;
  }

  public updateBusiness(updates: Partial<Business>): Business {
    this.data.business = {
      ...this.data.business,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.data.business;
  }

  public updateSettings(settings: Partial<Business['settings']>): Business {
    this.data.business.settings = {
      ...this.data.business.settings,
      ...settings,
    };
    this.data.business.updated_at = new Date().toISOString();
    this.saveToStorage();
    return this.data.business;
  }

  // --- ITEMS MASTER ---
  public getItems(includeInactive = false): ScrapItem[] {
    return this.data.items
      .filter((item) => includeInactive || item.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public getItemById(id: string): ScrapItem | undefined {
    return (
      this.data.items.find((item) => item.id === id) ||
      this.data.items.find((item) => item.id.toLowerCase() === id.toLowerCase()) ||
      this.data.items.find((item) => item.name.toUpperCase().trim() === id.toUpperCase().trim())
    );
  }

  public createItem(itemData: Partial<ScrapItem> & { name: string; local_name: string; default_unit: ScrapUnit }): ScrapItem {
    const now = new Date().toISOString();
    const purchaseRate = Number(itemData.default_purchase_rate || 0);
    const saleRate = Number(itemData.default_sale_rate || 0);
    const initialStock = Number(itemData.current_stock || 0);
    const newItem: ScrapItem = {
      id: `item-${Date.now()}`,
      business_id: this.data.business.id,
      name: itemData.name,
      local_name: itemData.local_name,
      code: itemData.code,
      default_unit: itemData.default_unit,
      default_purchase_rate: purchaseRate,
      default_sale_rate: saleRate,
      current_stock: initialStock,
      average_cost: purchaseRate,
      is_active: itemData.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
    this.data.items.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  public updateItem(id: string, updates: Partial<ScrapItem>): ScrapItem {
    let idx = this.data.items.findIndex((item) => item.id === id);
    if (idx === -1) {
      idx = this.data.items.findIndex(
        (item) =>
          item.id.toLowerCase() === id.toLowerCase() ||
          (updates.name && item.name.toUpperCase().trim() === updates.name.toUpperCase().trim())
      );
    }
    if (idx === -1) {
      const fallbackItem: ScrapItem = {
        id,
        business_id: this.data.business.id,
        name: (updates.name || 'ITEM').toUpperCase(),
        local_name: updates.local_name || '',
        default_unit: updates.default_unit || 'KG',
        default_purchase_rate: Number(updates.default_purchase_rate || 0),
        default_sale_rate: Number(updates.default_sale_rate || 0),
        current_stock: Number(updates.current_stock || 0),
        average_cost: Number(updates.average_cost || 0),
        is_active: updates.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.items.push(fallbackItem);
      this.saveToStorage();
      return fallbackItem;
    }
    this.data.items[idx] = {
      ...this.data.items[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.data.items[idx];
  }

  public deleteItem(id: string): void {
    const item = this.getItemById(id);
    if (!item) return;

    // Default 25 items are permanent in the database and can never be removed
    // Deleting them simply resets their count to 0 KG!
    if (isDefaultScrapItem(item.name)) {
      this.resetItemStock(id);
      return;
    }

    // 1. Clean up ledger and cost history
    this.data.inventory_ledger = this.data.inventory_ledger.filter((l) => l.item_id !== id);
    this.data.stock_cost_history = this.data.stock_cost_history.filter((h) => h.item_id !== id);
    this.data.stock_adjustments = this.data.stock_adjustments.filter((a) => a.item_id !== id);

    // 2. Clean up from purchases
    const purchasesToRemove: string[] = [];
    this.data.purchases.forEach((p) => {
      if (p.items) {
        p.items = p.items.filter((it) => it.item_id !== id);
        if (p.items.length === 0) {
          purchasesToRemove.push(p.id);
        } else {
          p.total_amount = p.items.reduce((sum, it) => sum + it.amount, 0);
          p.subtotal = p.total_amount;
          p.total_weight = p.items.reduce((sum, it) => sum + it.quantity, 0);
          p.paid_amount = p.total_amount;
          p.due_amount = 0;
        }
      }
    });
    if (purchasesToRemove.length > 0) {
      this.data.purchases = this.data.purchases.filter((p) => !purchasesToRemove.includes(p.id));
      this.data.payments = this.data.payments.filter((pay) => !pay.purchase_id || !purchasesToRemove.includes(pay.purchase_id));
    }

    // 3. Clean up from sales
    const salesToRemove: string[] = [];
    this.data.sales.forEach((s) => {
      if (s.items) {
        s.items = s.items.filter((it) => it.item_id !== id);
        if (s.items.length === 0) {
          salesToRemove.push(s.id);
        } else {
          s.total_amount = s.items.reduce((sum, it) => sum + it.amount, 0);
          s.subtotal = s.total_amount;
          s.total_weight = s.items.reduce((sum, it) => sum + it.quantity, 0);
          s.total_cost = s.items.reduce((sum, it) => sum + (it.cost_amount || 0), 0);
          s.total_profit = s.total_amount - s.total_cost;
          s.received_amount = s.total_amount;
          s.due_amount = 0;
        }
      }
    });
    if (salesToRemove.length > 0) {
      this.data.sales = this.data.sales.filter((s) => !salesToRemove.includes(s.id));
      this.data.payments = this.data.payments.filter((pay) => !pay.sale_id || !salesToRemove.includes(pay.sale_id));
    }

    // 4. Remove the item itself
    const idx = this.data.items.findIndex((item) => item.id === id);
    if (idx !== -1) {
      this.data.items.splice(idx, 1);
    }
    this.saveToStorage();
  }

  public resetItemStock(id: string): ScrapItem {
    const item = this.getItemById(id);
    if (!item) throw new Error('Item not found');
    item.current_stock = 0;
    item.average_cost = 0;
    item.default_purchase_rate = 0;
    item.default_sale_rate = 0;
    item.updated_at = new Date().toISOString();

    const actualId = item.id;
    const itemNameNorm = (item.name || '').toUpperCase().trim();
    const isMatchingItem = (it: any) => {
      if (!it) return false;
      if (it.item_id === actualId || it.item_id === id) return true;
      if (it.item_name && it.item_name.toUpperCase().trim() === itemNameNorm) return true;
      return false;
    };

    // Reset ledger history and adjustment history for this item
    this.data.inventory_ledger = this.data.inventory_ledger.filter((l) => l.item_id !== actualId && l.item_id !== id);
    this.data.stock_cost_history = this.data.stock_cost_history.filter((h) => h.item_id !== actualId && h.item_id !== id);
    this.data.stock_adjustments = this.data.stock_adjustments.filter((a) => a.item_id !== actualId && a.item_id !== id);

    // Clean up from purchases
    const purchasesToRemove: string[] = [];
    this.data.purchases.forEach((p) => {
      if (p.items) {
        p.items = p.items.filter((it) => !isMatchingItem(it));
        if (p.items.length === 0) {
          purchasesToRemove.push(p.id);
        } else {
          p.total_amount = p.items.reduce((sum, it) => sum + it.amount, 0);
          p.subtotal = p.total_amount;
          p.total_weight = p.items.reduce((sum, it) => sum + it.quantity, 0);
          p.paid_amount = p.total_amount;
          p.due_amount = 0;
        }
      }
    });
    if (purchasesToRemove.length > 0) {
      this.data.purchases = this.data.purchases.filter((p) => !purchasesToRemove.includes(p.id));
      this.data.payments = this.data.payments.filter((pay) => !pay.purchase_id || !purchasesToRemove.includes(pay.purchase_id));
    }

    // Clean up from sales
    const salesToRemove: string[] = [];
    this.data.sales.forEach((s) => {
      if (s.items) {
        s.items = s.items.filter((it) => !isMatchingItem(it));
        if (s.items.length === 0) {
          salesToRemove.push(s.id);
        } else {
          s.total_amount = s.items.reduce((sum, it) => sum + it.amount, 0);
          s.subtotal = s.total_amount;
          s.total_weight = s.items.reduce((sum, it) => sum + it.quantity, 0);
          s.total_cost = s.items.reduce((sum, it) => sum + (it.cost_amount || 0), 0);
          s.total_profit = s.total_amount - s.total_cost;
          s.received_amount = s.total_amount;
          s.due_amount = 0;
        }
      }
    });
    if (salesToRemove.length > 0) {
      this.data.sales = this.data.sales.filter((s) => !salesToRemove.includes(s.id));
      this.data.payments = this.data.payments.filter((pay) => !pay.sale_id || !salesToRemove.includes(pay.sale_id));
    }

    this.saveToStorage();
    return item;
  }

  public restoreDefaultItems(): ScrapItem[] {
    const now = new Date().toISOString();
    const allowedNames = new Set(INITIAL_SCRAP_ITEMS.map((i) => i.name.toUpperCase().trim()));

    // Prune any rogue items
    this.data.items = this.data.items.filter((it) => allowedNames.has((it.name || '').toUpperCase().trim()));

    INITIAL_SCRAP_ITEMS.forEach((def, idx) => {
      const existing = this.data.items.find((it) => (it.name || '').toUpperCase().trim() === def.name.toUpperCase().trim());
      if (!existing) {
        this.data.items.push({
          ...def,
          id: `item-${String(idx + 1).padStart(3, '0')}`,
          business_id: DEFAULT_BUSINESS_ID,
          created_at: now,
          updated_at: now,
        });
      } else {
        existing.local_name = def.local_name;
        existing.default_unit = def.default_unit;
      }
    });

    this.saveToStorage();
    return this.data.items;
  }

  public toggleItemActive(id: string): ScrapItem {
    const item = this.getItemById(id);
    if (!item) {
      return this.updateItem(id, { is_active: false });
    }
    return this.updateItem(id, { is_active: !item.is_active });
  }

  // --- PARTIES ---
  public getParties(includeInactive = false): Party[] {
    return this.data.parties
      .filter((p) => includeInactive || p.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public getPartyById(id: string): Party | undefined {
    return this.data.parties.find((p) => p.id === id);
  }

  public createParty(partyData: Partial<Party> & { name: string; party_type: PartyType; opening_balance: number }): Party {
    const now = new Date().toISOString();
    let initialBalance = 0;
    if (partyData.opening_balance > 0) {
      initialBalance = partyData.opening_balance_type === 'RECEIVABLE'
        ? partyData.opening_balance
        : -partyData.opening_balance;
    }

    const newParty: Party = {
      id: `party-${Date.now()}`,
      business_id: this.data.business.id,
      name: partyData.name,
      party_type: partyData.party_type,
      opening_balance: partyData.opening_balance,
      opening_balance_type: partyData.opening_balance_type || 'RECEIVABLE',
      current_balance: initialBalance,
      is_active: partyData.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
    this.data.parties.push(newParty);
    this.saveToStorage();
    return newParty;
  }

  public updateParty(id: string, updates: Partial<Party>): Party {
    const idx = this.data.parties.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Party not found');
    this.data.parties[idx] = {
      ...this.data.parties[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.data.parties[idx];
  }

  // --- TRANSACTIONAL PURCHASES ---
  public createPurchase(payload: {
    party_id: string;
    party_name?: string;
    purchase_date: string;
    items: { item_id: string; quantity: number; unit: any; rate: number; amount: number }[];
    paid_amount: number;
  }): Purchase {
    let party: Party | undefined;
    if (payload.party_name && payload.party_name.trim()) {
      const trimmed = payload.party_name.trim();
      party = this.data.parties.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
      if (!party) {
        party = {
          id: `party-${Date.now()}`,
          business_id: this.data.business.id,
          name: trimmed,
          party_type: 'BOTH',
          opening_balance: 0,
          opening_balance_type: 'RECEIVABLE',
          current_balance: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.parties.push(party);
      }
    } else {
      party = this.getPartyById(payload.party_id);
      if (!party) {
        party = this.data.parties.find((p) => p.name.includes('Walk-in') || p.name.includes('नकदी'));
        if (!party) {
          party = {
            id: `party-walkin-${Date.now()}`,
            business_id: this.data.business.id,
            name: 'Walk-in Party (नकदी पार्टी)',
            party_type: 'BOTH',
            opening_balance: 0,
            opening_balance_type: 'RECEIVABLE',
            current_balance: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.data.parties.push(party);
        }
      }
    }
    const safeParty: Party = party;

    const totalAmount = payload.items.reduce((sum, it) => sum + it.amount, 0);
    const totalWeight = payload.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const paidAmount = totalAmount;
    const dueAmount = 0;
    const now = new Date().toISOString();
    const purchaseNumber = this.generateDocNumber('PUR', payload.purchase_date, this.data.purchases);
    const purchaseId = `pur-${Date.now()}`;

    // 1. Process line items, stock updates, WAC, and ledger
    const purchaseItems = payload.items.map((it, idx) => {
      const item = this.getItemById(it.item_id);
      if (!item) throw new Error(`Item ${it.item_id} not found`);

      const qty = Number(it.quantity);
      const rate = Number(it.rate);
      const currStock = Number(item.current_stock || 0);
      const currWac = Number(item.average_cost || 0);

      // Weighted Average Cost calculation:
      let newWac = rate;
      if (currStock > 0) {
        newWac = Number((((currStock * currWac) + (qty * rate)) / (currStock + qty)).toFixed(2));
      }

      const newStock = currStock + qty;

      // Update Item
      item.current_stock = newStock;
      item.average_cost = newWac;
      item.default_purchase_rate = rate;
      item.updated_at = now;

      // Log stock cost history
      this.data.stock_cost_history.push({
        id: `cst-${Date.now()}-${idx}`,
        business_id: this.data.business.id,
        item_id: item.id,
        quantity_before: currStock,
        average_cost_before: currWac,
        quantity_change: qty,
        cost_rate: rate,
        average_cost_after: newWac,
        created_at: now,
      });

      // Log inventory ledger
      this.data.inventory_ledger.push({
        id: `ledg-${Date.now()}-${idx}`,
        business_id: this.data.business.id,
        item_id: item.id,
        item_name: item.name,
        transaction_type: 'PURCHASE',
        reference_id: purchaseId,
        reference_number: purchaseNumber,
        quantity_change: qty,
        unit: it.unit || item.default_unit,
        rate,
        running_quantity: newStock,
        party_id: safeParty.id,
        party_name: safeParty.name,
        created_at: now,
      });

      return {
        id: `pit-${Date.now()}-${idx}`,
        purchase_id: purchaseId,
        item_id: item.id,
        item_name: item.name,
        item_local_name: item.local_name,
        quantity: qty,
        unit: it.unit || item.default_unit,
        rate,
        amount: it.amount,
        created_at: now,
      };
    });

    // 2. Insert Purchase record
    const purchase: Purchase = {
      id: purchaseId,
      business_id: this.data.business.id,
      purchase_number: purchaseNumber,
      party_id: safeParty.id,
      party_name: safeParty.name,
      purchase_date: payload.purchase_date,
      subtotal: totalAmount,
      total_amount: totalAmount,
      total_weight: totalWeight,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      status: 'FINAL',
      items: purchaseItems,
      created_at: now,
      updated_at: now,
    };
    this.data.purchases.unshift(purchase);

    // 3. No Udhaari: 100% full payment, party balance untouched
    safeParty.updated_at = now;

    // 4. Create Payment entry if paid > 0
    if (paidAmount > 0) {
      const payNumber = this.generateDocNumber('PAY', payload.purchase_date, this.data.payments);
      const payment: Payment = {
        id: `pay-${Date.now()}`,
        business_id: this.data.business.id,
        payment_number: payNumber,
        party_id: safeParty.id,
        party_name: safeParty.name,
        payment_type: 'PAYMENT_TO_SUPPLIER',
        amount: paidAmount,
        payment_date: payload.purchase_date,
        purchase_id: purchaseId,
        created_at: now,
      };
      this.data.payments.unshift(payment);
    }

    this.saveToStorage();
    return purchase;
  }

  // --- TRANSACTIONAL SALES ---
  public createSale(payload: {
    party_id: string;
    party_name?: string;
    sale_date: string;
    items: { item_id: string; quantity: number; unit: any; rate: number; amount: number }[];
    received_amount: number;
  }): Sale {
    let party: Party | undefined;
    if (payload.party_name && payload.party_name.trim()) {
      const trimmed = payload.party_name.trim();
      party = this.data.parties.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
      if (!party) {
        party = {
          id: `party-${Date.now()}`,
          business_id: this.data.business.id,
          name: trimmed,
          party_type: 'BOTH',
          opening_balance: 0,
          opening_balance_type: 'RECEIVABLE',
          current_balance: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.parties.push(party);
      }
    } else {
      party = this.getPartyById(payload.party_id);
      if (!party) {
        party = this.data.parties.find((p) => p.name.includes('Walk-in') || p.name.includes('नकदी'));
        if (!party) {
          party = {
            id: `party-walkin-${Date.now()}`,
            business_id: this.data.business.id,
            name: 'Walk-in Party (नकदी पार्टी)',
            party_type: 'BOTH',
            opening_balance: 0,
            opening_balance_type: 'RECEIVABLE',
            current_balance: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.data.parties.push(party);
        }
      }
    }
    const safeParty: Party = party;

    const allowNegativeStock = this.data.business.settings?.allow_negative_stock ?? false;

    // 1. Stock Validation Check First
    for (const it of payload.items) {
      const item = this.getItemById(it.item_id);
      if (!item) throw new Error(`Item ${it.item_id} not found`);

      if (!allowNegativeStock && (item.current_stock || 0) < it.quantity) {
        throw new Error(
          `Insufficient stock for ${item.name} (${item.local_name}). Available: ${item.current_stock} ${item.default_unit}. Requested: ${it.quantity} ${item.default_unit}. Enable negative stock in Settings to bypass.`
        );
      }
    }

    const totalAmount = payload.items.reduce((sum, it) => sum + it.amount, 0);
    const totalWeight = payload.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const receivedAmount = totalAmount;
    const dueAmount = 0;
    const now = new Date().toISOString();
    const saleNumber = this.generateDocNumber('SALE', payload.sale_date, this.data.sales);
    const saleId = `sale-${Date.now()}`;

    let totalCogs = 0;
    let totalGrossProfit = 0;

    // 2. Process line items, stock reduction, COGS & profit
    const saleItems = payload.items.map((it, idx) => {
      const item = this.getItemById(it.item_id)!;
      const qty = Number(it.quantity);
      const rate = Number(it.rate);
      const currStock = Number(item.current_stock || 0);
      const wac = Number(item.average_cost || 0);

      const lineCost = Number((qty * wac).toFixed(2));
      const lineProfit = Number((it.amount - lineCost).toFixed(2));
      totalCogs += lineCost;
      totalGrossProfit += lineProfit;

      const newStock = currStock - qty;
      item.current_stock = newStock;
      item.default_sale_rate = rate;
      item.updated_at = now;

      // Inventory Ledger entry
      this.data.inventory_ledger.push({
        id: `ledg-${Date.now()}-${idx}`,
        business_id: this.data.business.id,
        item_id: item.id,
        item_name: item.name,
        transaction_type: 'SALE',
        reference_id: saleId,
        reference_number: saleNumber,
        quantity_change: -qty,
        unit: it.unit || item.default_unit,
        rate,
        running_quantity: newStock,
        party_id: safeParty.id,
        party_name: safeParty.name,
        created_at: now,
      });

      return {
        id: `sit-${Date.now()}-${idx}`,
        sale_id: saleId,
        item_id: item.id,
        item_name: item.name,
        item_local_name: item.local_name,
        quantity: qty,
        unit: it.unit || item.default_unit,
        rate,
        amount: it.amount,
        cost_rate: wac,
        cost_amount: lineCost,
        profit_amount: lineProfit,
        created_at: now,
      };
    });

    // 3. Insert Sale Record
    const sale: Sale = {
      id: saleId,
      business_id: this.data.business.id,
      sale_number: saleNumber,
      party_id: safeParty.id,
      party_name: safeParty.name,
      sale_date: payload.sale_date,
      subtotal: totalAmount,
      total_amount: totalAmount,
      total_weight: totalWeight,
      received_amount: receivedAmount,
      due_amount: dueAmount,
      total_cost: totalCogs,
      total_profit: totalGrossProfit,
      status: 'FINAL',
      items: saleItems,
      created_at: now,
      updated_at: now,
    };
    this.data.sales.unshift(sale);

    // 4. No Udhaari: 100% full payment, party balance untouched
    safeParty.updated_at = now;

    // 5. Create Payment record if received > 0
    if (receivedAmount > 0) {
      const payNumber = this.generateDocNumber('PAY', payload.sale_date, this.data.payments);
      const payment: Payment = {
        id: `pay-${Date.now()}`,
        business_id: this.data.business.id,
        payment_number: payNumber,
        party_id: safeParty.id,
        party_name: safeParty.name,
        payment_type: 'PAYMENT_RECEIVED_FROM_CUSTOMER',
        amount: receivedAmount,
        payment_date: payload.sale_date,
        sale_id: saleId,
        created_at: now,
      };
      this.data.payments.unshift(payment);
    }

    this.saveToStorage();
    return sale;
  }

  public deletePurchase(purchaseId: string): void {
    const pIdx = this.data.purchases.findIndex((p) => p.id === purchaseId);
    if (pIdx === -1) return;
    const purchase = this.data.purchases[pIdx];

    // 1. Rollback stock for all items purchased
    if (purchase.items) {
      for (const it of purchase.items) {
        const item = this.getItemById(it.item_id);
        if (item) {
          item.current_stock = Math.max(0, Number(item.current_stock || 0) - Number(it.quantity || 0));
          item.updated_at = new Date().toISOString();
        }
      }
    }

    // 2. Rollback party balance if due amount was added
    if (purchase.party_id && purchase.due_amount > 0) {
      const party = this.getPartyById(purchase.party_id);
      if (party) {
        party.current_balance += purchase.due_amount;
        party.updated_at = new Date().toISOString();
      }
    }

    // 3. Remove inventory ledger entries for this purchase
    this.data.inventory_ledger = this.data.inventory_ledger.filter(
      (l) => l.reference_id !== purchaseId && l.reference_number !== purchase.purchase_number
    );

    // 4. Remove payments linked to this purchase
    this.data.payments = this.data.payments.filter((pay) => pay.purchase_id !== purchaseId);

    // 5. Remove the purchase record
    this.data.purchases.splice(pIdx, 1);
    this.saveToStorage();
  }

  public deleteSale(saleId: string): void {
    const sIdx = this.data.sales.findIndex((s) => s.id === saleId);
    if (sIdx === -1) return;
    const sale = this.data.sales[sIdx];

    // 1. Return stock for all items sold
    if (sale.items) {
      for (const it of sale.items) {
        const item = this.getItemById(it.item_id);
        if (item) {
          item.current_stock = Number(item.current_stock || 0) + Number(it.quantity || 0);
          item.updated_at = new Date().toISOString();
        }
      }
    }

    // 2. Rollback party balance if due amount was added
    if (sale.party_id && sale.due_amount > 0) {
      const party = this.getPartyById(sale.party_id);
      if (party) {
        party.current_balance -= sale.due_amount;
        party.updated_at = new Date().toISOString();
      }
    }

    // 3. Remove inventory ledger entries for this sale
    this.data.inventory_ledger = this.data.inventory_ledger.filter(
      (l) => l.reference_id !== saleId && l.reference_number !== sale.sale_number
    );

    // 4. Remove payments linked to this sale
    this.data.payments = this.data.payments.filter((pay) => pay.sale_id !== saleId);

    // 5. Remove the sale record
    this.data.sales.splice(sIdx, 1);
    this.saveToStorage();
  }

  public updatePurchaseTransaction(
    purchaseId: string,
    updates: {
      items: { item_id: string; quantity: number; rate: number; amount: number }[];
      paid_amount?: number;
    }
  ): Purchase {
    const purchase = this.data.purchases.find((p) => p.id === purchaseId);
    if (!purchase) throw new Error('Purchase not found');

    const now = new Date().toISOString();
    for (const newItem of updates.items) {
      const oldItem = purchase.items?.find((it) => it.item_id === newItem.item_id);
      const oldQty = oldItem ? Number(oldItem.quantity) : 0;
      const newQty = Number(newItem.quantity);
      const diff = newQty - oldQty;

      const item = this.getItemById(newItem.item_id);
      if (item) {
        item.current_stock = Math.max(0, Number(item.current_stock || 0) + diff);
        item.default_purchase_rate = newItem.rate;
        item.updated_at = now;
      }
      if (oldItem) {
        oldItem.quantity = newQty;
        oldItem.rate = newItem.rate;
        oldItem.amount = newItem.amount;
      }
    }

    purchase.total_amount = updates.items.reduce((s, it) => s + it.amount, 0);
    purchase.subtotal = purchase.total_amount;
    purchase.total_weight = updates.items.reduce((s, it) => s + it.quantity, 0);
    purchase.paid_amount = purchase.total_amount;
    purchase.due_amount = 0;
    purchase.updated_at = now;

    this.saveToStorage();
    return purchase;
  }

  public updateSaleTransaction(
    saleId: string,
    updates: {
      items: { item_id: string; quantity: number; rate: number; amount: number }[];
      received_amount?: number;
    }
  ): Sale {
    const sale = this.data.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Sale not found');

    const now = new Date().toISOString();
    for (const newItem of updates.items) {
      const oldItem = sale.items?.find((it) => it.item_id === newItem.item_id);
      const oldQty = oldItem ? Number(oldItem.quantity) : 0;
      const newQty = Number(newItem.quantity);
      const diff = newQty - oldQty;

      const item = this.getItemById(newItem.item_id);
      if (item) {
        item.current_stock = Math.max(0, Number(item.current_stock || 0) - diff);
        item.default_sale_rate = newItem.rate;
        item.updated_at = now;
      }
      if (oldItem) {
        oldItem.quantity = newQty;
        oldItem.rate = newItem.rate;
        oldItem.amount = newItem.amount;
      }
    }

    sale.total_amount = updates.items.reduce((s, it) => s + it.amount, 0);
    sale.subtotal = sale.total_amount;
    sale.total_weight = updates.items.reduce((s, it) => s + it.quantity, 0);
    sale.received_amount = sale.total_amount;
    sale.due_amount = 0;
    sale.updated_at = now;

    this.saveToStorage();
    return sale;
  }

  // --- STOCK ADJUSTMENT ---
  public createStockAdjustment(payload: {
    item_id: string;
    quantity: number; // Positive or negative
    adjustment_type: any;
    reason: string;
  }): StockAdjustment {
    let item = this.getItemById(payload.item_id);
    if (!item) {
      item = this.updateItem(payload.item_id, { current_stock: 0 });
    }

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const adjNumber = this.generateDocNumber('ADJ', todayStr, this.data.stock_adjustments);
    const adjId = `adj-${Date.now()}`;

    const oldStock = Number(item.current_stock || 0);
    const newStock = oldStock + Number(payload.quantity);
    item.current_stock = newStock;
    item.updated_at = now;

    const adjustment: StockAdjustment = {
      id: adjId,
      business_id: this.data.business.id,
      adjustment_number: adjNumber,
      item_id: item.id,
      item_name: item.name,
      quantity: Number(payload.quantity),
      adjustment_type: payload.adjustment_type,
      reason: payload.reason,
      created_at: now,
    };
    this.data.stock_adjustments.unshift(adjustment);

    // Ledger entry
    this.data.inventory_ledger.push({
      id: `ledg-${Date.now()}`,
      business_id: this.data.business.id,
      item_id: item.id,
      item_name: item.name,
      transaction_type: 'ADJUSTMENT',
      reference_id: adjId,
      reference_number: adjNumber,
      quantity_change: Number(payload.quantity),
      unit: item.default_unit,
      rate: item.average_cost,
      running_quantity: newStock,
      created_at: now,
    });

    this.saveToStorage();
    return adjustment;
  }

  // --- PAYMENTS ---
  public createPayment(payload: {
    party_id: string;
    payment_type: any;
    amount: number;
    payment_date: string;
    reference?: string;
    purchase_id?: string;
    sale_id?: string;
  }): Payment {
    const party = this.getPartyById(payload.party_id);
    if (!party) throw new Error('Party not found');

    const now = new Date().toISOString();
    const payNumber = this.generateDocNumber('PAY', payload.payment_date, this.data.payments);
    const payId = `pay-${Date.now()}`;
    const amount = Number(payload.amount);

    const payment: Payment = {
      id: payId,
      business_id: this.data.business.id,
      payment_number: payNumber,
      party_id: party.id,
      party_name: party.name,
      payment_type: payload.payment_type,
      amount,
      payment_date: payload.payment_date,
      reference: payload.reference,
      purchase_id: payload.purchase_id,
      sale_id: payload.sale_id,
      created_at: now,
    };
    this.data.payments.unshift(payment);

    // Balance impact
    if (payload.payment_type === 'PAYMENT_TO_SUPPLIER') {
      // Paying supplier reduces our payable (makes balance closer to 0)
      party.current_balance += amount;

      if (payload.purchase_id) {
        const purchase = this.data.purchases.find((p) => p.id === payload.purchase_id);
        if (purchase) {
          purchase.paid_amount += amount;
          purchase.due_amount = Math.max(0, purchase.total_amount - purchase.paid_amount);
          purchase.updated_at = now;
        }
      }
    } else if (payload.payment_type === 'PAYMENT_RECEIVED_FROM_CUSTOMER') {
      // Receiving money from customer reduces customer's receivable
      party.current_balance -= amount;

      if (payload.sale_id) {
        const sale = this.data.sales.find((s) => s.id === payload.sale_id);
        if (sale) {
          sale.received_amount += amount;
          sale.due_amount = Math.max(0, sale.total_amount - sale.received_amount);
          sale.updated_at = now;
        }
      }
    }

    party.updated_at = now;
    this.saveToStorage();
    return payment;
  }

  // --- EXPENSES ---
  public createExpense(payload: {
    recipient_name: string;
    reason: string;
    amount: number;
    expense_date: string;
    category?: any;
    payment_method?: string;
    notes?: string;
    id?: string;
    expense_number?: string;
  }): Expense {
    const now = new Date().toISOString();
    const expNumber = payload.expense_number || this.generateDocNumber('EXP', payload.expense_date, this.data.expenses);
    const expId = payload.id || `exp-${Date.now()}`;

    const expense: Expense = {
      id: expId,
      business_id: this.data.business.id,
      expense_number: expNumber,
      category: payload.category || 'OTHER',
      recipient_name: payload.recipient_name,
      reason: payload.reason,
      amount: Number(payload.amount),
      expense_date: payload.expense_date,
      payment_method: payload.payment_method || 'CASH',
      notes: payload.notes,
      created_at: now,
    };
    this.data.expenses.unshift(expense);
    this.saveToStorage();
    return expense;
  }

  public deleteExpense(id: string): void {
    const idx = this.data.expenses.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.data.expenses.splice(idx, 1);
      this.saveToStorage();
    }
  }

  // --- QUERIES & REPORTS ---
  public getPurchases(): Purchase[] {
    return this.data.purchases.filter((p) => p.items && p.items.length > 0);
  }

  public getSales(): Sale[] {
    return this.data.sales.filter((s) => s.items && s.items.length > 0);
  }

  public getPayments(): Payment[] {
    return this.data.payments;
  }

  public getExpenses(): Expense[] {
    return this.data.expenses;
  }

  public getInventoryLedger(itemId?: string): InventoryLedgerEntry[] {
    if (itemId) {
      return this.data.inventory_ledger.filter((l) => l.item_id === itemId);
    }
    return this.data.inventory_ledger;
  }

  public getStockAdjustments(): StockAdjustment[] {
    return this.data.stock_adjustments;
  }

  // Party statement calculation
  public getPartyLedger(partyId: string): {
    purchases: Purchase[];
    sales: Sale[];
    payments: Payment[];
    totalPurchased: number;
    totalSold: number;
    totalPaid: number;
    totalReceived: number;
    currentBalance: number;
    ledgerEntries: Array<{
      date: string;
      docNumber: string;
      description: string;
      debit: number;
      credit: number;
      runningBalance: number;
    }>;
  } {
    const party = this.getPartyById(partyId);
    if (!party) throw new Error('Party not found');

    const partyPurchases = this.data.purchases.filter((p) => p.party_id === partyId && p.status === 'FINAL');
    const partySales = this.data.sales.filter((s) => s.party_id === partyId && s.status === 'FINAL');
    const partyPayments = this.data.payments.filter((p) => p.party_id === partyId);

    const totalPurchased = partyPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalSold = partySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalPaid = partyPayments.filter((p) => p.payment_type === 'PAYMENT_TO_SUPPLIER').reduce((sum, p) => sum + p.amount, 0);
    const totalReceived = partyPayments.filter((p) => p.payment_type === 'PAYMENT_RECEIVED_FROM_CUSTOMER').reduce((sum, p) => sum + p.amount, 0);

    // Build timeline sorted chronologically
    type RawEntry = { date: string; docNumber: string; description: string; debit: number; credit: number; timestamp: number };
    const raw: RawEntry[] = [];

    // Opening balance entry if non-zero
    if (party.opening_balance > 0) {
      if (party.opening_balance_type === 'RECEIVABLE') {
        raw.push({ date: party.created_at.split('T')[0], docNumber: 'OPN-BAL', description: 'Opening Balance (Receivable)', debit: party.opening_balance, credit: 0, timestamp: 0 });
      } else {
        raw.push({ date: party.created_at.split('T')[0], docNumber: 'OPN-BAL', description: 'Opening Balance (Payable)', debit: 0, credit: party.opening_balance, timestamp: 0 });
      }
    }

    partyPurchases.forEach((p) => {
      // We bought from supplier: Supplier is credited with the total purchase amount
      raw.push({
        date: p.purchase_date,
        docNumber: p.purchase_number,
        description: `Purchase (${p.items?.map((it) => `${it.item_name} ${it.quantity}${it.unit}`).join(', ') || ''})`,
        debit: 0,
        credit: p.total_amount,
        timestamp: new Date(p.created_at).getTime(),
      });
    });

    partySales.forEach((s) => {
      // We sold to customer: Customer is debited with the total sales amount
      raw.push({
        date: s.sale_date,
        docNumber: s.sale_number,
        description: `Sale (${s.items?.map((it) => `${it.item_name} ${it.quantity}${it.unit}`).join(', ') || ''})`,
        debit: s.total_amount,
        credit: 0,
        timestamp: new Date(s.created_at).getTime(),
      });
    });

    partyPayments.forEach((pay) => {
      if (pay.payment_type === 'PAYMENT_TO_SUPPLIER') {
        // We paid supplier: Supplier is debited with payment amount
        raw.push({
          date: pay.payment_date,
          docNumber: pay.payment_number,
          description: `Payment made to supplier`,
          debit: pay.amount,
          credit: 0,
          timestamp: new Date(pay.created_at).getTime(),
        });
      } else {
        // Customer paid us: Customer is credited with payment amount
        raw.push({
          date: pay.payment_date,
          docNumber: pay.payment_number,
          description: `Payment received from customer`,
          debit: 0,
          credit: pay.amount,
          timestamp: new Date(pay.created_at).getTime(),
        });
      }
    });

    raw.sort((a, b) => a.date.localeCompare(b.date) || a.timestamp - b.timestamp);

    let running = 0;
    const ledgerEntries = raw.map((r) => {
      running += r.debit - r.credit;
      return {
        date: r.date,
        docNumber: r.docNumber,
        description: r.description,
        debit: r.debit,
        credit: r.credit,
        runningBalance: running,
      };
    });

    return {
      purchases: partyPurchases,
      sales: partySales,
      payments: partyPayments,
      totalPurchased,
      totalSold,
      totalPaid,
      totalReceived,
      currentBalance: party.current_balance,
      ledgerEntries,
    };
  }

  // Dashboard KPIs
  public getDashboardKPIs(startDate: string, endDate: string): DashboardKPIs {
    const today = getLocalDateString();

    const todayPurchases = this.data.purchases.filter((p) => p.purchase_date === today && p.status === 'FINAL');
    const todaySales = this.data.sales.filter((s) => s.sale_date === today && s.status === 'FINAL');

    const todayPurchaseTotal = todayPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
    const todayProfitTotal = todaySales.reduce((sum, s) => sum + (s.total_profit || 0), 0);

    const periodPurchases = this.data.purchases.filter((p) => p.purchase_date >= startDate && p.purchase_date <= endDate && p.status === 'FINAL');
    const periodSales = this.data.sales.filter((s) => s.sale_date >= startDate && s.sale_date <= endDate && s.status === 'FINAL');
    const periodExpenses = this.data.expenses.filter((e) => e.expense_date >= startDate && e.expense_date <= endDate);

    const periodPurchaseTotal = periodPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const periodSalesTotal = periodSales.reduce((sum, s) => sum + s.total_amount, 0);
    const periodProfitTotal = periodSales.reduce((sum, s) => sum + (s.total_profit || 0), 0);
    const periodExpensesTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Current stock value = Sum of max(0, current_stock) * average_cost
    const currentStockValue = this.data.items
      .filter((it) => it.is_active)
      .reduce((sum, it) => sum + Math.max(0, it.current_stock) * it.average_cost, 0);

    // Pending Receivables (customers owe us) & Pending Payables (we owe suppliers)
    let pendingReceivables = 0;
    let pendingPayables = 0;

    this.data.parties
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
  }

  // Global Search
  public search(query: string): {
    items: ScrapItem[];
    parties: Party[];
    purchases: Purchase[];
    sales: Sale[];
  } {
    const q = query.trim().toLowerCase();
    if (!q) return { items: [], parties: [], purchases: [], sales: [] };

    const matchedItems = this.data.items.filter(
      (it) => it.name.toLowerCase().includes(q) || it.local_name.includes(q) || (it.code && it.code.toLowerCase().includes(q))
    ).slice(0, 8);

    const matchedParties = this.data.parties.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q))
    ).slice(0, 8);

    const matchedPurchases = this.data.purchases.filter(
      (p) => p.purchase_number.toLowerCase().includes(q) || (p.party_name && p.party_name.toLowerCase().includes(q))
    ).slice(0, 6);

    const matchedSales = this.data.sales.filter(
      (s) => s.sale_number.toLowerCase().includes(q) || (s.party_name && s.party_name.toLowerCase().includes(q))
    ).slice(0, 6);

    return {
      items: matchedItems,
      parties: matchedParties,
      purchases: matchedPurchases,
      sales: matchedSales,
    };
  }

  // Date-to-Date Calculator Analytics
  public getDateRangeAnalytics(startDate: string, endDate: string) {
    const purchases = this.data.purchases.filter(
      (p) => p.purchase_date >= startDate && p.purchase_date <= endDate && p.status === 'FINAL'
    );
    const sales = this.data.sales.filter(
      (s) => s.sale_date >= startDate && s.sale_date <= endDate && s.status === 'FINAL'
    );

    const expenses = this.data.expenses.filter(
      (e) => e.expense_date >= startDate && e.expense_date <= endDate
    );

    const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalPurchaseWeight = purchases.reduce((sum, p) => sum + (p.total_weight || 0), 0);
    const totalSaleAmount = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalSaleWeight = sales.reduce((sum, s) => sum + (s.total_weight || 0), 0);
    const totalExpenseAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const tradeBalance = totalSaleAmount - totalPurchaseAmount;
    const netBalance = tradeBalance - totalExpenseAmount;

    // Item breakdown for this date range
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

    purchases.forEach((p) => {
      p.items?.forEach((it) => {
        if (!itemMap[it.item_id]) {
          const master = this.data.items.find((m) => m.id === it.item_id);
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

    sales.forEach((s) => {
      s.items?.forEach((it) => {
        if (!itemMap[it.item_id]) {
          const master = this.data.items.find((m) => m.id === it.item_id);
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
      totalPurchasesCount: purchases.length,
      totalSalesCount: sales.length,
      totalExpensesCount: expenses.length,
      totalPurchaseAmount: Number(totalPurchaseAmount.toFixed(2)),
      totalPurchaseWeight: Number(totalPurchaseWeight.toFixed(2)),
      totalSaleAmount: Number(totalSaleAmount.toFixed(2)),
      totalSaleWeight: Number(totalSaleWeight.toFixed(2)),
      totalExpenseAmount: Number(totalExpenseAmount.toFixed(2)),
      tradeBalance: Number(tradeBalance.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2)),
      purchases,
      sales,
      expenses,
      itemBreakdown: Object.values(itemMap),
    };
  }

  // Month-by-month analytics for the entire year
  public getMonthlyAnalytics(year?: number) {
    const currentYear = year || new Date().getFullYear();
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
      const monthPurchases = this.data.purchases.filter(
        (p) => p.purchase_date.startsWith(prefix) && p.status === 'FINAL'
      );
      const monthSales = this.data.sales.filter(
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
  }
}

export const localDb = new LocalEngine();
