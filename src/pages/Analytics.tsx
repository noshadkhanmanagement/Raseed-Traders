import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IconDownload,
  IconPrinter,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCalculator,
  IconRefresh,
  IconReceipt,
  IconDelete,
} from '../components/common/Icons';
import { api } from '../services/api';
import {
  formatCurrency,
  formatQuantity,
  formatDate,
  formatDateTime12Hr,
  downloadCSV,
  getLocalDateString,
  getDateRangePreset,
} from '../utils/formatters';

type QuickRange = 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS';
type TxFilter = 'ALL' | 'PURCHASE' | 'SALE';

interface UnifiedTx {
  id: string;
  type: 'PURCHASE' | 'SALE';
  date: string;
  created_at?: string;
  reference_number: string;
  party_name: string;
  total_amount: number;
  total_weight?: number;
  items: Array<{
    item_name: string;
    item_local_name?: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }>;
}

export const Analytics: React.FC = () => {
  const today = getLocalDateString();

  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [activeRange, setActiveRange] = useState<QuickRange | 'CUSTOM'>('TODAY');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [txFilter, setTxFilter] = useState<TxFilter>('ALL');

  const [rangeData, setRangeData] = useState<{
    totalPurchasesCount: number;
    totalSalesCount: number;
    totalExpensesCount?: number;
    totalPurchaseAmount: number;
    totalPurchaseWeight: number;
    totalSaleAmount: number;
    totalSaleWeight: number;
    totalExpenseAmount?: number;
    tradeBalance?: number;
    netBalance: number;
    purchases: any[];
    sales: any[];
    expenses?: any[];
    itemBreakdown: Array<{
      itemId: string;
      itemName: string;
      localName: string;
      buyQty: number;
      buyAmount: number;
      sellQty: number;
      sellAmount: number;
      unit: string;
    }>;
  }>({
    totalPurchasesCount: 0,
    totalSalesCount: 0,
    totalExpensesCount: 0,
    totalPurchaseAmount: 0,
    totalPurchaseWeight: 0,
    totalSaleAmount: 0,
    totalSaleWeight: 0,
    totalExpenseAmount: 0,
    tradeBalance: 0,
    netBalance: 0,
    purchases: [],
    sales: [],
    expenses: [],
    itemBreakdown: [],
  });

  const applyQuickRange = (range: QuickRange) => {
    const { startDate: s, endDate: e } = getDateRangePreset(range);
    setStartDate(s);
    setEndDate(e);
    setActiveRange(range);
  };

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const rangeRes = await api.getDateRangeAnalytics(startDate, endDate);
      setRangeData(rangeRes);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Merge purchases and sales into chronological transaction feed (newest first)
  const unifiedTransactions = useMemo<UnifiedTx[]>(() => {
    const list: UnifiedTx[] = [];

    rangeData.purchases.forEach((p) => {
      list.push({
        id: p.id,
        type: 'PURCHASE',
        date: p.purchase_date,
        created_at: p.created_at || p.purchase_date,
        reference_number: p.purchase_number || p.id,
        party_name: p.party_name || 'Walk-in Party (नकदी पार्टी)',
        total_amount: Number(p.total_amount || 0),
        total_weight: Number(p.total_weight || 0),
        items: (p.items || []).map((it: any) => ({
          item_name: it.item_name || 'Item',
          item_local_name: it.item_local_name,
          quantity: Number(it.quantity || 0),
          unit: it.unit || 'KG',
          rate: Number(it.rate || 0),
          amount: Number(it.amount || 0),
        })),
      });
    });

    rangeData.sales.forEach((s) => {
      list.push({
        id: s.id,
        type: 'SALE',
        date: s.sale_date,
        created_at: s.created_at || s.sale_date,
        reference_number: s.sale_number || s.id,
        party_name: s.party_name || 'Buyer Party (क्रेता पार्टी)',
        total_amount: Number(s.total_amount || 0),
        total_weight: Number(s.total_weight || 0),
        items: (s.items || []).map((it: any) => ({
          item_name: it.item_name || 'Item',
          item_local_name: it.item_local_name,
          quantity: Number(it.quantity || 0),
          unit: it.unit || 'KG',
          rate: Number(it.rate || 0),
          amount: Number(it.amount || 0),
        })),
      });
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.created_at || a.date).getTime();
      const timeB = new Date(b.created_at || b.date).getTime();
      return timeB - timeA;
    });
  }, [rangeData.purchases, rangeData.sales]);

  const filteredTransactions = useMemo(() => {
    if (txFilter === 'ALL') return unifiedTransactions;
    return unifiedTransactions.filter((t) => t.type === txFilter);
  }, [unifiedTransactions, txFilter]);

  // Compute KG vs PIECE breakdowns for purchases and sales
  const purchaseWeightBreakdown = useMemo(() => {
    let kg = 0;
    let piece = 0;
    unifiedTransactions.filter(t => t.type === 'PURCHASE').forEach(tx => {
      tx.items.forEach(it => {
        if (it.unit === 'PIECE') piece += it.quantity;
        else kg += it.quantity;
      });
    });
    return { kg, piece };
  }, [unifiedTransactions]);

  const saleWeightBreakdown = useMemo(() => {
    let kg = 0;
    let piece = 0;
    unifiedTransactions.filter(t => t.type === 'SALE').forEach(tx => {
      tx.items.forEach(it => {
        if (it.unit === 'PIECE') piece += it.quantity;
        else kg += it.quantity;
      });
    });
    return { kg, piece };
  }, [unifiedTransactions]);

  const handleExportCSV = () => {
    const headers = [
      'Type',
      'Date & Time',
      'Party Name',
      'Items',
      'Total Weight (KG)',
      'Total Amount (₹)',
    ];
    const rows = unifiedTransactions.map((tx) => [
      tx.type === 'PURCHASE' ? 'Kharidi (Buy)' : 'Bikri (Sell)',
      formatDateTime12Hr(tx.date, tx.created_at),
      tx.party_name,
      tx.items.map((it) => `${it.item_name}: ${it.quantity} ${it.unit} @ ₹${it.rate}`).join('; '),
      tx.total_weight || '',
      tx.type === 'PURCHASE' ? -tx.total_amount : tx.total_amount,
    ]);
    downloadCSV(`Hisaab_${startDate}_to_${endDate}`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteExpense = async (id: string, name: string, amount: number) => {
    if (!window.confirm(`"${name}" ke liye ${formatCurrency(amount)} ka kharcha delete karein?`)) return;
    try {
      await api.deleteExpense(id);
      await loadAnalytics();
    } catch (err: any) {
      alert(err.message || 'Kharcha delete karne me samasya aayi');
    }
  };

  return (
    <div className="space-y-5 page-enter max-w-4xl mx-auto pb-32 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif]">
      {/* 1. Header - Apple iOS Large Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 border border-black/5 dark:border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span>Exact 12-Hour Indian Timing Enabled</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Hisaab & Calculator (हिसाब)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Date-to-date calculation of purchases, sales, and profit with exact timestamps
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border border-black/10 dark:border-white/15 bg-white/90 dark:bg-zinc-900/90 text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <IconPrinter size={14} />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          >
            <IconDownload size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Apple iOS Inset Date Range Calculator Card */}
      <div className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/10 text-black dark:text-white flex items-center justify-center shrink-0">
              <IconCalculator size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black dark:text-white tracking-tight">
                Date Range Calculator (तारीख़ से तारीख़)
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Select custom period to calculate exact buying, selling & net balance
              </p>
            </div>
          </div>

          {/* 2-Tier iOS Segmented Control */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            {/* Switch Line 1: Today & Yesterday */}
            <div className="inline-flex items-center p-1 rounded-[14px] bg-zinc-100/90 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => applyQuickRange('TODAY')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-[11px] transition-all duration-150 text-center ${
                  activeRange === 'TODAY'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                Today (आज)
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange('YESTERDAY')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-[11px] transition-all duration-150 text-center ${
                  activeRange === 'YESTERDAY'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                Yesterday (कल)
              </button>
            </div>

            {/* Switch Line 2: This Month, Last Month & 30 Days */}
            <div className="inline-flex items-center p-1 rounded-[14px] bg-zinc-100/90 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => applyQuickRange('THIS_MONTH')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-[11px] transition-all duration-150 text-center ${
                  activeRange === 'THIS_MONTH'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                This Month (इस महीने)
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange('LAST_MONTH')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-[11px] transition-all duration-150 text-center ${
                  activeRange === 'LAST_MONTH'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                Last Month (पिछले)
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange('LAST_30_DAYS')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-[11px] transition-all duration-150 text-center ${
                  activeRange === 'LAST_30_DAYS'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>

        {/* Date pickers & Action Bar */}
        <div className="pt-3 border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-2.5 flex-1 max-w-md">
            {/* From Date Cell */}
            <div className="flex flex-col px-3.5 py-1.5 rounded-[14px] bg-zinc-100/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/10">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                From (शुरुआत)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveRange('CUSTOM');
                }}
                className="bg-transparent text-xs font-bold text-black dark:text-white focus:outline-none w-full cursor-pointer mt-0.5"
              />
            </div>

            {/* To Date Cell */}
            <div className="flex flex-col px-3.5 py-1.5 rounded-[14px] bg-zinc-100/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/10">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                To (अंतिम)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveRange('CUSTOM');
                }}
                className="bg-transparent text-xs font-bold text-black dark:text-white focus:outline-none w-full cursor-pointer mt-0.5"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.12)] shrink-0"
          >
            <IconRefresh size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Calculate (हिसाब निकालें)</span>
          </button>
        </div>
      </div>

      {/* 3. Apple Health / Wallet Style KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Purchases Card */}
        <div className="rounded-[22px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Khareeda (कुल खरीदी)
            </span>
            <span className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center">
              <IconArrowDownLeft size={15} />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tabular-nums tracking-tight">
              {formatCurrency(rangeData.totalPurchaseAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5 flex-wrap">
                {purchaseWeightBreakdown.kg > 0 && (
                  <span className="tabular-nums font-sans"><strong className="text-black dark:text-white">{purchaseWeightBreakdown.kg.toLocaleString('en-IN')}</strong> KG</span>
                )}
                {purchaseWeightBreakdown.kg > 0 && purchaseWeightBreakdown.piece > 0 && (
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                )}
                {purchaseWeightBreakdown.piece > 0 && (
                  <span className="tabular-nums font-sans"><strong className="text-black dark:text-white">{purchaseWeightBreakdown.piece.toLocaleString('en-IN')}</strong> PIECE</span>
                )}
                {purchaseWeightBreakdown.kg === 0 && purchaseWeightBreakdown.piece === 0 && (
                  <span>Qty: {formatQuantity(rangeData.totalPurchaseWeight, 'KG')}</span>
                )}
              </span>
              <span>{rangeData.totalPurchasesCount} Bills</span>
            </div>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="rounded-[22px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Becha (कुल बिक्री)
            </span>
            <span className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IconArrowUpRight size={15} />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tabular-nums tracking-tight">
              {formatCurrency(rangeData.totalSaleAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5 flex-wrap">
                {saleWeightBreakdown.kg > 0 && (
                  <span className="tabular-nums font-sans"><strong className="text-black dark:text-white">{saleWeightBreakdown.kg.toLocaleString('en-IN')}</strong> KG</span>
                )}
                {saleWeightBreakdown.kg > 0 && saleWeightBreakdown.piece > 0 && (
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                )}
                {saleWeightBreakdown.piece > 0 && (
                  <span className="tabular-nums font-sans"><strong className="text-black dark:text-white">{saleWeightBreakdown.piece.toLocaleString('en-IN')}</strong> PIECE</span>
                )}
                {saleWeightBreakdown.kg === 0 && saleWeightBreakdown.piece === 0 && (
                  <span>Qty: {formatQuantity(rangeData.totalSaleWeight, 'KG')}</span>
                )}
              </span>
              <span>{rangeData.totalSalesCount} Bills</span>
            </div>
          </div>
        </div>

        {/* Custom Expenses Card */}
        <div className="rounded-[22px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Dukaan Kharcha (कुल ख़र्च)
            </span>
            <span className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <IconReceipt size={15} />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
              {formatCurrency(rangeData.totalExpenseAmount || 0)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
              <span>{rangeData.totalExpensesCount || 0} Entries</span>
              <span>Dukaan Costs</span>
            </div>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="rounded-[22px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Net Hisaab (शुद्ध अंतर)
            </span>
            <span className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center">
              <IconCalculator size={15} />
            </span>
          </div>
          <div className="mt-2.5">
            <div
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight ${
                rangeData.netBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {rangeData.netBalance >= 0 ? '+' : ''}
              {formatCurrency(rangeData.netBalance)}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500 font-medium">
              {rangeData.netBalance >= 0
                ? 'Profit after all expenses (शुद्ध बचत)'
                : 'Expenses & Purchases exceed (कमी)'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. DEDICATED CUSTOM EXPENSES SECTION */}
      <div className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/40 dark:border-rose-900/40 flex items-center justify-center shrink-0">
              <IconReceipt size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-black dark:text-white tracking-tight">
                  Custom Expenses (दुकान व अन्य ख़र्चे)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-500/10">
                  Total: {formatCurrency(rangeData.totalExpenseAmount || 0)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Driver bhaada, diesel, majdoori, dukaan kiraya, chai-nashta with recipient & timestamps
              </p>
            </div>
          </div>
        </div>

        {/* Expenses Feed / List */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-[45vh] overflow-y-auto overscroll-contain">
          {!rangeData.expenses || rangeData.expenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400 font-medium">
              Is date range me koi alag kharch nahi likha gaya hai (No custom expenses recorded).
            </div>
          ) : (
            rangeData.expenses.map((exp: any) => (
              <div
                key={exp.id}
                className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                {/* Left: Recipient & Reason */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                      EXPENSE
                    </span>
                    <span className="text-xs font-bold text-black dark:text-white tracking-tight">
                      {exp.recipient_name}
                    </span>
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {formatDateTime12Hr(exp.expense_date, exp.created_at)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {exp.reason}
                    </span>
                    {exp.notes && (
                      <span className="text-zinc-400 dark:text-zinc-500 italic">
                        ({exp.notes})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Delete Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
                      -{formatCurrency(exp.amount)}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-medium">
                      {exp.payment_method || 'CASH'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(exp.id, exp.recipient_name, exp.amount)}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 active:scale-90 transition-all opacity-70 group-hover:opacity-100"
                    title="Delete this expense"
                  >
                    <IconDelete size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. EXACT 12-HOUR INDIAN TIMING TRANSACTION ACTIVITY FEED */}
      <div className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Header with Segmented Filter */}
        <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white tracking-tight">
              Transaction Activity Feed (लेन-देन समय विवरण)
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Every buy & sell entry with exact 12-hour Indian timing
            </p>
          </div>

          {/* Segmented Filter Pills */}
          <div className="inline-flex p-1 rounded-[14px] bg-zinc-100/90 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTxFilter('ALL')}
              className={`px-3 py-1 rounded-[11px] text-xs font-semibold transition-all ${
                txFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              All ({unifiedTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setTxFilter('PURCHASE')}
              className={`px-3 py-1 rounded-[11px] text-xs font-semibold transition-all ${
                txFilter === 'PURCHASE'
                  ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Kharidi ({rangeData.purchases.length})
            </button>
            <button
              type="button"
              onClick={() => setTxFilter('SALE')}
              className={`px-3 py-1 rounded-[11px] text-xs font-semibold transition-all ${
                txFilter === 'SALE'
                  ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Bikri ({rangeData.sales.length})
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-[55vh] overflow-y-auto overscroll-contain">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-400 font-medium">
              No transactions recorded in this date range.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isPurchase = tx.type === 'PURCHASE';
              return (
                <div
                  key={tx.id}
                  className="px-4 sm:px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Left: Badge + Date & Time + Items */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isPurchase
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isPurchase ? 'BUY (खरीदी)' : 'SELL (बिक्री)'}
                      </span>
                      <span className="text-xs font-bold text-black dark:text-white tracking-tight">
                        {formatDateTime12Hr(tx.date, tx.created_at)}
                      </span>
                      {tx.party_name && (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                          · {tx.party_name}
                        </span>
                      )}
                    </div>

                    {/* Material line items */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {tx.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 text-zinc-700 dark:text-zinc-300"
                        >
                          <strong className="text-black dark:text-white font-bold">{it.item_name}</strong>
                          {it.item_local_name && (
                            <span className="text-zinc-400 font-normal">({it.item_local_name})</span>
                          )}
                          <span>· {it.quantity} {it.unit}</span>
                          <span className="font-semibold text-zinc-500">@{formatCurrency(it.rate)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Total Amount */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm sm:text-base font-extrabold tabular-nums tracking-tight ${
                        isPurchase
                          ? 'text-black dark:text-white'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isPurchase ? '-' : '+'}
                      {formatCurrency(tx.total_amount)}
                    </div>
                    {tx.total_weight ? (
                      <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
                        {tx.total_weight} KG
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Apple Inset Grouped Material-wise Breakdown */}
      <div className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white tracking-tight">
              Material-wise Aggregate ({formatDate(startDate)} to {formatDate(endDate)})
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Total quantity and amount summary per scrap material
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {rangeData.itemBreakdown.length} Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/50 text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                <th className="px-5 py-3">Material (सामग्री)</th>
                <th className="px-5 py-3 text-right">Khareeda Qty</th>
                <th className="px-5 py-3 text-right">Khareeda (₹)</th>
                <th className="px-5 py-3 text-right">Becha Qty</th>
                <th className="px-5 py-3 text-right">Becha (₹)</th>
                <th className="px-5 py-3 text-right">Net Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-black dark:text-white">
              {rangeData.itemBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-zinc-400 font-medium">
                    No transactions found in this date range.
                  </td>
                </tr>
              ) : (
                rangeData.itemBreakdown.map((row) => {
                  const diff = row.sellAmount - row.buyAmount;
                  return (
                    <tr key={row.itemId} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold">
                        <span>{row.itemName}</span>
                        {row.localName && (
                          <span className="ml-1.5 text-zinc-400 font-normal">({row.localName})</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums font-sans">
                        {row.buyQty > 0 ? `${row.buyQty} ${row.unit}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums font-sans">
                        {row.buyAmount > 0 ? formatCurrency(row.buyAmount) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums font-sans">
                        {row.sellQty > 0 ? `${row.sellQty} ${row.unit}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums font-sans">
                        {row.sellAmount > 0 ? formatCurrency(row.sellAmount) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold tabular-nums font-sans">
                        <span
                          className={
                            diff >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {diff >= 0 ? '+' : ''}
                          {formatCurrency(diff)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

