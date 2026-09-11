// Strict TypeScript Domain Models for Scrap Management System

export type ScrapUnit = 'KG' | 'PIECE' | 'BUNDLE' | 'PACK' | 'METER' | 'LITRE' | 'OTHER';

export type PartyType = 'SUPPLIER' | 'CUSTOMER' | 'BOTH';

export type BalanceType = 'RECEIVABLE' | 'PAYABLE';

export type PaymentType = 'PAYMENT_TO_SUPPLIER' | 'PAYMENT_RECEIVED_FROM_CUSTOMER';

export type StockAdjustmentType = 'DAMAGE' | 'MISSING' | 'WEIGHING_CORRECTION' | 'OPENING_STOCK' | 'MANUAL';

export type ExpenseCategory =
  | 'TRANSPORT'
  | 'LABOUR'
  | 'ELECTRICITY'
  | 'RENT'
  | 'MAINTENANCE'
  | 'LOADING_UNLOADING'
  | 'OTHER';

export interface BusinessSettings {
  allow_negative_stock: boolean;
  negative_stock_zero_floor?: boolean;
  default_unit: ScrapUnit;
  stock_warning_threshold: number;
  currency: string;
}

export interface Business {
  id: string;
  name: string;
  phone: string;
  address: string;
  settings: BusinessSettings;
  created_at: string;
  updated_at: string;
}

export interface ScrapItem {
  id: string;
  business_id: string;
  name: string; // English / primary code name (e.g. LOHA)
  local_name: string; // Hindi name (e.g. लोहा)
  code?: string;
  default_unit: ScrapUnit;
  default_purchase_rate: number;
  default_sale_rate: number;
  current_stock: number;
  average_cost: number; // Weighted Average Cost (WAC)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Party {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  address?: string;
  party_type: PartyType;
  opening_balance: number;
  opening_balance_type?: BalanceType;
  current_balance: number; // >0 means customer owes us (receivable), <0 means we owe supplier (payable)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  item_id: string;
  item_name?: string;
  item_local_name?: string;
  quantity: number;
  unit: ScrapUnit;
  rate: number;
  amount: number;
  created_at: string;
}

export interface Purchase {
  id: string;
  business_id: string;
  purchase_number: string;
  party_id: string;
  party_name?: string;
  purchase_date: string;
  subtotal: number;
  total_amount: number;
  total_weight?: number;
  paid_amount: number;
  due_amount: number;
  status: 'FINAL' | 'CANCELLED';
  items?: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  item_id: string;
  item_name?: string;
  item_local_name?: string;
  quantity: number;
  unit: ScrapUnit;
  rate: number;
  amount: number;
  cost_rate: number; // WAC at time of sale
  cost_amount: number; // COGS
  profit_amount: number; // Gross profit
  created_at: string;
}

export interface Sale {
  id: string;
  business_id: string;
  sale_number: string;
  party_id: string;
  party_name?: string;
  sale_date: string;
  subtotal: number;
  total_amount: number;
  total_weight?: number;
  received_amount: number;
  due_amount: number;
  total_cost: number; // COGS
  total_profit: number; // Gross Profit
  status: 'FINAL' | 'CANCELLED';
  items?: SaleItem[];
  created_at: string;
  updated_at: string;
}

export interface StockAdjustment {
  id: string;
  business_id: string;
  adjustment_number: string;
  item_id: string;
  item_name?: string;
  quantity: number; // Positive (addition) or Negative (reduction)
  adjustment_type: StockAdjustmentType;
  reason: string;
  created_at: string;
}

export interface Payment {
  id: string;
  business_id: string;
  payment_number: string;
  party_id: string;
  party_name?: string;
  payment_type: PaymentType;
  amount: number;
  payment_date: string;
  reference?: string;
  purchase_id?: string;
  sale_id?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  business_id?: string;
  expense_number: string;
  category?: ExpenseCategory;
  recipient_name: string; // Jisko paise diye (Recipient Name)
  reason: string;         // Kharch ka karan (Reason)
  amount: number;
  expense_date: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryLedgerEntry {
  id: string;
  business_id: string;
  item_id: string;
  item_name?: string;
  transaction_type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT';
  reference_id: string;
  reference_number: string;
  quantity_change: number; // + or -
  unit: ScrapUnit;
  rate: number;
  running_quantity: number;
  party_id?: string;
  party_name?: string;
  created_at: string;
}

export interface StockCostHistory {
  id: string;
  business_id: string;
  item_id: string;
  quantity_before: number;
  average_cost_before: number;
  quantity_change: number;
  cost_rate: number;
  average_cost_after: number;
  created_at: string;
}

export interface DashboardKPIs {
  today_purchase: number;
  today_sales: number;
  today_profit: number;
  period_purchase: number;
  period_sales: number;
  period_profit: number;
  period_expenses: number;
  current_stock_value: number;
  pending_receivables: number;
  pending_payables: number;
}

export type DateRangePreset = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';

export interface DateFilter {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
}
