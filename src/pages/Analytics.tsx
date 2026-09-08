import React, { useState, useEffect } from 'react';
import { Download, Printer, ArrowDownLeft, ArrowUpRight, Calculator, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { api } from '../services/api';
import { formatCurrency, formatQuantity, formatDate, downloadCSV } from '../utils/formatters';

type QuickRange = 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS';

export const Analytics: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];

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
    const now = new Date();
    let start = today;
    let end = today;

    if (range === 'TODAY') {
      start = today;
      end = today;
    } else if (range === 'YESTERDAY') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      start = y.toISOString().split('T')[0];
      end = start;
    } else if (range === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      end = today;
    } else if (range === 'LAST_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    } else if (range === 'LAST_30_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
      end = today;
    }

    setStartDate(start);
    setEndDate(end);
    setActiveRange(range);
  };

  const loadAnalytics = async () => {
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
  };

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate]);

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
              <Printer className="w-3.5 h-3.5" />
              <span>Print (प्रिंट)</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-90 btn-press"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV (डाउनलोड)</span>
            </button>
          </div>
        }
      />

      {/* Date-to-Date Calculator Bar */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-black dark:text-white">
                Date-to-Date Calculator (तारीख़ से तरीख़ का हिसाब)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select any custom date range to calculate total buy, sell, and balance
              </p>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyQuickRange('TODAY')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeRange === 'TODAY'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              Today (आज)
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange('YESTERDAY')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeRange === 'YESTERDAY'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              Yesterday (कल)
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange('THIS_MONTH')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeRange === 'THIS_MONTH'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              This Month (इस महीने)
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange('LAST_MONTH')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeRange === 'LAST_MONTH'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              Last Month (पिछला महीना)
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange('LAST_30_DAYS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeRange === 'LAST_30_DAYS'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              Last 30 Days (30 दिन)
            </button>
          </div>
        </div>

        {/* Date pickers */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">From (से):</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveRange('CUSTOM');
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">To (तक):</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveRange('CUSTOM');
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Calculate (गणना करें)</span>
          </button>
        </div>
      </div>

      {/* Date Range Calculated Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Purchases Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Khareeda (कुल खरीदी)
            </span>
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-black dark:text-white">
              {formatCurrency(rangeData.totalPurchaseAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Quantity: {formatQuantity(rangeData.totalPurchaseWeight, 'KG')}</span>
              <span>{rangeData.totalPurchasesCount} Entries</span>
            </div>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Becha (कुल बिक्री)
            </span>
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-black dark:text-white">
              {formatCurrency(rangeData.totalSaleAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Quantity: {formatQuantity(rangeData.totalSaleWeight, 'KG')}</span>
              <span>{rangeData.totalSalesCount} Entries</span>
            </div>
          </div>
        </div>

        {/* Net Difference Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Net Balance (शुद्ध अंतर / मुनाफा)
            </span>
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white">
              <Calculator className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold ${rangeData.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {rangeData.netBalance >= 0 ? '+' : ''}{formatCurrency(rangeData.netBalance)}
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {rangeData.netBalance >= 0 ? 'Sales exceed Purchases' : 'Purchases exceed Sales (Inventory Built)'}
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Item-by-Item Breakdown */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white">
              Material-wise Breakdown ({formatDate(startDate)} to {formatDate(endDate)})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Kitna maal khareeda aur kitna becha is samay me
            </p>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            {rangeData.itemBreakdown.length} Items active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <th className="px-4 py-2.5 font-medium">Material (सामग्री)</th>
                <th className="px-4 py-2.5 font-medium text-right">Khareeda Qty (खरीदा)</th>
                <th className="px-4 py-2.5 font-medium text-right">Khareeda ₹ (रुपये)</th>
                <th className="px-4 py-2.5 font-medium text-right">Becha Qty (बेचा)</th>
                <th className="px-4 py-2.5 font-medium text-right">Becha ₹ (रुपये)</th>
                <th className="px-4 py-2.5 font-medium text-right">Net ₹ (अंतर)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-white">
              {rangeData.itemBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No buy or sell transactions found in this date range. (इस तारीख़ में कोई रिकॉर्ड नहीं है)
                  </td>
                </tr>
              ) : (
                rangeData.itemBreakdown.map((row) => {
                  const diff = row.sellAmount - row.buyAmount;
                  return (
                    <tr key={row.itemId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium">
                        <span className="font-semibold">{row.itemName}</span>
                        {row.localName && (
                          <span className="ml-1.5 text-zinc-500 dark:text-zinc-400">({row.localName})</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {row.buyQty > 0 ? `${row.buyQty} ${row.unit}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {row.buyAmount > 0 ? formatCurrency(row.buyAmount) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {row.sellQty > 0 ? `${row.sellQty} ${row.unit}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {row.sellAmount > 0 ? formatCurrency(row.sellAmount) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
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

      {/* Har Month Kitne Rupaye Ka Total Kharida / Becha (Monthly Summary Table) */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white">
              Har Month Ka Total Hisab (Month-by-Month Summary {new Date().getFullYear()})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Har mahine kitne rupaye ka total khareeda aur becha
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            Year {new Date().getFullYear()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <th className="px-4 py-2.5 font-medium">Month (महीना)</th>
                <th className="px-4 py-2.5 font-medium text-right">Total Kharida ₹ (खरीदी)</th>
                <th className="px-4 py-2.5 font-medium text-right">Kharida Weight</th>
                <th className="px-4 py-2.5 font-medium text-right">Total Becha ₹ (बिक्री)</th>
                <th className="px-4 py-2.5 font-medium text-right">Becha Weight</th>
                <th className="px-4 py-2.5 font-medium text-right">Net Difference (अंतर)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-white">
              {monthlyData.map((m) => (
                <tr key={m.monthKey} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-2.5 font-medium">
                    <span className="font-semibold">{m.monthName}</span>
                    <span className="ml-1 text-zinc-500 dark:text-zinc-400">({m.monthHindi})</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    {m.purchaseAmount > 0 ? formatCurrency(m.purchaseAmount) : '₹0'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-500 dark:text-zinc-400">
                    {m.purchaseWeight > 0 ? `${m.purchaseWeight} KG` : '0 KG'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    {m.saleAmount > 0 ? formatCurrency(m.saleAmount) : '₹0'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-500 dark:text-zinc-400">
                    {m.saleWeight > 0 ? `${m.saleWeight} KG` : '0 KG'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold">
                    <span className={m.netDifference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {m.netDifference >= 0 ? '+' : ''}{formatCurrency(m.netDifference)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
