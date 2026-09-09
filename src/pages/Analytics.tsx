import React, { useState, useEffect, useCallback } from 'react';
import {
  IconDownload,
  IconPrinter,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCalculator,
  IconRefresh,
} from '../components/common/Icons';
import { PageHeader } from '../components/layout/PageHeader';
import { api } from '../services/api';
import { formatCurrency, formatQuantity, formatDate, downloadCSV, getLocalDateString, getDateRangePreset } from '../utils/formatters';

type QuickRange = 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS';

export const Analytics: React.FC = () => {
  const today = getLocalDateString();

  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [activeRange, setActiveRange] = useState<QuickRange | 'CUSTOM'>('TODAY');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [rangeData, setRangeData] = useState<{
    totalPurchasesCount: number;
    totalSalesCount: number;
    totalPurchaseAmount: number;
    totalPurchaseWeight: number;
    totalSaleAmount: number;
    totalSaleWeight: number;
    netBalance: number;
    purchases: any[];
    sales: any[];
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
    totalPurchaseAmount: 0,
    totalPurchaseWeight: 0,
    totalSaleAmount: 0,
    totalSaleWeight: 0,
    netBalance: 0,
    purchases: [],
    sales: [],
    itemBreakdown: [],
  });

  const [monthlyData, setMonthlyData] = useState<
    Array<{
      monthKey: string;
      monthName: string;
      monthHindi: string;
      purchaseAmount: number;
      purchaseWeight: number;
      purchaseCount: number;
      saleAmount: number;
      saleWeight: number;
      saleCount: number;
      netDifference: number;
    }>
  >([]);

  const applyQuickRange = (range: QuickRange) => {
    const { startDate: s, endDate: e } = getDateRangePreset(range);
    setStartDate(s);
    setEndDate(e);
    setActiveRange(range);
  };

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rangeRes, monthRes] = await Promise.all([
        api.getDateRangeAnalytics(startDate, endDate),
        api.getMonthlyAnalytics(new Date().getFullYear()),
      ]);
      setRangeData(rangeRes);
      setMonthlyData(monthRes);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCSV = () => {
    const headers = ['Material Name (सामग्री)', 'Buy Quantity (खरीदा)', 'Buy Amount (₹)', 'Sell Quantity (बेचा)', 'Sell Amount (₹)', 'Net Balance (₹)'];
    const rows = rangeData.itemBreakdown.map((it) => [
      `${it.itemName} (${it.localName})`,
      `${it.buyQty} ${it.unit}`,
      it.buyAmount,
      `${it.sellQty} ${it.unit}`,
      it.sellAmount,
      it.sellAmount - it.buyAmount,
    ]);
    downloadCSV(`Date_Calculator_${startDate}_to_${endDate}`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Analytics & Calculator (हिसाब-किताब)"
        subtitle="Date to date total kharida, total becha and monthly calculations"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press"
            >
              <IconPrinter size={14} />
              <span>Print (प्रिंट)</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-90 btn-press"
            >
              <IconDownload size={14} />
              <span>Export CSV (डाउनलोड)</span>
            </button>
          </div>
        }
      />

      {/* Date-to-Date Calculator iOS Widget */}
      <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 text-black dark:text-white">
              <IconCalculator size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-black dark:text-white tracking-tight font-sans">
                Date Range Calculator (तारीख़ से तारीख़ का हिसाब)
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Select custom dates to calculate total purchases, sales, and net balance
              </p>
            </div>
          </div>

          {/* iOS Segmented Filter: Line 1 (Today / Yesterday) & Line 2 (This Month / Last Month / 30 Days) on Mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            {/* Switch Line 1: Today & Yesterday */}
            <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
              <button
                type="button"
                onClick={() => applyQuickRange('TODAY')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-full transition-all duration-150 text-center ${
                  activeRange === 'TODAY'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-extrabold shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                Today (आज)
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange('YESTERDAY')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-full transition-all duration-150 text-center ${
                  activeRange === 'YESTERDAY'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-extrabold shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                Yesterday (कल)
              </button>
            </div>

            {/* Switch Line 2: This Month, Last Month & 30 Days */}
            <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
              <button
                type="button"
                onClick={() => applyQuickRange('THIS_MONTH')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-full transition-all duration-150 text-center ${
                  activeRange === 'THIS_MONTH'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-extrabold shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                This Month (इस महीने)
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange('LAST_MONTH')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-full transition-all duration-150 text-center ${
                  activeRange === 'LAST_MONTH'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-extrabold shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                Last Month (पिछले महीने)
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange('LAST_30_DAYS')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs rounded-full transition-all duration-150 text-center ${
                  activeRange === 'LAST_30_DAYS'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white font-extrabold shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                30 Days (30 दिन)
              </button>
            </div>
          </div>
        </div>

        {/* Date pickers & Action Bar */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-2.5 flex-1 max-w-lg">
            {/* From Date Cell */}
            <div className="flex flex-col px-3.5 py-1.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 focus-within:border-black dark:focus-within:border-white transition-colors">
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
            <div className="flex flex-col px-3.5 py-1.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 focus-within:border-black dark:focus-within:border-white transition-colors">
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
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.97] transition-all shadow-xs shrink-0"
          >
            <IconRefresh size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Calculate (हिसाब निकालें)</span>
          </button>
        </div>
      </div>

      {/* Date Range Calculated Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Purchases Card */}
        <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Khareeda (कुल खरीदी)
            </span>
            <span className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white">
              <IconArrowDownLeft size={16} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-black dark:text-white font-sans">
              {formatCurrency(rangeData.totalPurchaseAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
              <span>Qty: {formatQuantity(rangeData.totalPurchaseWeight, 'KG')}</span>
              <span>{rangeData.totalPurchasesCount} Bills</span>
            </div>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Becha (कुल बिक्री)
            </span>
            <span className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white">
              <IconArrowUpRight size={16} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-black dark:text-white font-sans">
              {formatCurrency(rangeData.totalSaleAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
              <span>Qty: {formatQuantity(rangeData.totalSaleWeight, 'KG')}</span>
              <span>{rangeData.totalSalesCount} Bills</span>
            </div>
          </div>
        </div>

        {/* Net Difference Card */}
        <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Net Balance (शुद्ध अंतर / मुनाफा)
            </span>
            <span className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white">
              <IconCalculator size={16} />
            </span>
          </div>
          <div className="mt-2">
            <div className={`text-2xl sm:text-3xl font-black font-sans ${rangeData.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {rangeData.netBalance >= 0 ? '+' : ''}{formatCurrency(rangeData.netBalance)}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500 font-medium">
              {rangeData.netBalance >= 0 ? 'Sales exceed Purchases (Surplus)' : 'Purchases exceed Sales (Inventory)'}
            </div>
          </div>
        </div>
      </div>

      {/* Material-wise Breakdown */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-black dark:text-white">
              Material-wise Breakdown ({formatDate(startDate)} to {formatDate(endDate)})
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Total bought & sold during this period
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {rangeData.itemBreakdown.length} Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/80 text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                <th className="px-4 py-2.5">Material (सामग्री)</th>
                <th className="px-4 py-2.5 text-right">Khareeda Qty</th>
                <th className="px-4 py-2.5 text-right">Khareeda (₹)</th>
                <th className="px-4 py-2.5 text-right">Becha Qty</th>
                <th className="px-4 py-2.5 text-right">Becha (₹)</th>
                <th className="px-4 py-2.5 text-right">Net Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-black dark:text-white">
              {rangeData.itemBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-zinc-400">
                    No transactions found in this date range.
                  </td>
                </tr>
              ) : (
                rangeData.itemBreakdown.map((row) => {
                  const diff = row.sellAmount - row.buyAmount;
                  return (
                    <tr key={row.itemId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-2.5 font-bold">
                        <span>{row.itemName}</span>
                        {row.localName && (
                          <span className="ml-1.5 text-zinc-400 font-normal">({row.localName})</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums font-sans">
                        {row.buyQty > 0 ? `${row.buyQty} ${row.unit}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums font-sans">
                        {row.buyAmount > 0 ? formatCurrency(row.buyAmount) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums font-sans">
                        {row.sellQty > 0 ? `${row.sellQty} ${row.unit}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums font-sans">
                        {row.sellAmount > 0 ? formatCurrency(row.sellAmount) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-extrabold tabular-nums font-sans">
                        <span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
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
