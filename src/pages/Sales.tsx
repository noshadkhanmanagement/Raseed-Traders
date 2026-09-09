import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  IconPlus,
  IconDownload,
  IconSearch,
  IconPrinter,
  IconSliders,
  IconClose,
} from '../components/common/Icons';
import { PageHeader } from '../components/layout/PageHeader';
import { BottomSheet } from '../components/common/BottomSheet';
import { TransactionAdjustmentModal } from '../components/transactions/TransactionAdjustmentModal';
import { api } from '../services/api';
import { Sale } from '../types';
import { formatCurrency, formatDate, downloadCSV, getLocalDateString } from '../utils/formatters';

interface ContextType {
  openSale: () => void;
  refreshCounter?: number;
}

export const Sales: React.FC = () => {
  const { openSale, refreshCounter } = useOutletContext<ContextType>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToAdjust, setSaleToAdjust] = useState<Sale | null>(null);

  const loadSales = useCallback(async () => {
    try {
      const data = await api.getSales();
      setSales(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales, refreshCounter]);

  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'THIS_MONTH'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'CREDIT'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'amount_desc' | 'weight_desc'>('newest');

  const todayStr = getLocalDateString();
  const currentMonthStr = todayStr.substring(0, 7);

  const todayCount = sales.filter((s) => s.sale_date && s.sale_date.startsWith(todayStr)).length;
  const thisMonthCount = sales.filter((s) => s.sale_date && s.sale_date.startsWith(currentMonthStr)).length;

  const filteredSales = sales
    .filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const match =
          s.sale_number.toLowerCase().includes(q) ||
          (s.party_name && s.party_name.toLowerCase().includes(q)) ||
          s.items?.some((it) => it.item_name?.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (periodFilter === 'TODAY' && (!s.sale_date || !s.sale_date.startsWith(todayStr))) return false;
      if (periodFilter === 'THIS_MONTH' && (!s.sale_date || !s.sale_date.startsWith(currentMonthStr))) return false;
      if (paymentFilter === 'CASH' && (s.due_amount || 0) > 0) return false;
      if (paymentFilter === 'CREDIT' && (s.due_amount || 0) <= 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.sale_date.localeCompare(a.sale_date);
      if (sortBy === 'amount_desc') return b.total_amount - a.total_amount;
      if (sortBy === 'weight_desc') {
        const wA = a.total_weight ?? (a.items?.reduce((x, it) => x + it.quantity, 0) || 0);
        const wB = b.total_weight ?? (b.items?.reduce((x, it) => x + it.quantity, 0) || 0);
        return wB - wA;
      }
      return 0;
    });

  const totalSalesAmount = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalSalesWeight = sales.reduce((sum, s) => sum + (s.total_weight ?? (s.items?.reduce((x, it) => x + it.quantity, 0) || 0)), 0);

  const handleExportCSV = () => {
    const headers = ['Sale Number', 'Date', 'Customer', 'Items Details', 'Total Amount', 'Received Amount', 'Due Amount', 'Payment Method'];
    const rows = filteredSales.map((s) => [
      s.sale_number,
      s.sale_date,
      s.party_name || 'Walk-in Cash',
      s.items?.map((it) => `${it.item_name} (${it.quantity}${it.unit}@₹${it.rate})`).join('; ') || '',
      s.total_amount,
      s.received_amount,
      s.due_amount,
    ]);
    downloadCSV('Sales_Register', headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 page-enter">
      <PageHeader
        title="Kitna Becha (बिक्री रजिस्टर)"
        subtitle="Complete log of scrap materials sold, quantities, and customer receipts"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press shadow-xs"
            >
              <IconDownload size={14} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={openSale}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 btn-press shadow-xs"
            >
              <IconPlus size={14} />
              <span>Nayi Bikri (Sell)</span>
            </button>
          </div>
        }
      />

      {/* iOS Status Pill Bar (Compact Header Info instead of KPI Widgets) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          <span>
            {sales.length} Sale Bills · Total: <strong className="text-black dark:text-white font-bold">{formatCurrency(totalSalesAmount)}</strong> ({totalSalesWeight} KG)
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium">
          Showing {filteredSales.length} of {sales.length}
        </span>
      </div>

      {/* iOS Segmented Controls Bar for Sales Listing (All Exact Options) */}
      <div className="space-y-2.5">
        {/* Row 1: Search & Period Segmented Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <IconSearch size={16} className="text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number, customer name, or material..."
              className="w-full pl-10 pr-9 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-black dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                title="Clear search"
              >
                <IconClose size={10} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Period Segmented Control */}
          <div className="inline-flex p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPeriodFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                periodFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              All ({sales.length})
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('TODAY')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                periodFilter === 'TODAY'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Today ({todayCount})
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('THIS_MONTH')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                periodFilter === 'THIS_MONTH'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Month ({thisMonthCount})
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Exact Options (Payment Mode Segments + Sort Segments) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          {/* Payment Mode Segments */}
          <div className="inline-flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-zinc-400 mr-1">Payment:</span>
            <div className="inline-flex p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setPaymentFilter('ALL')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  paymentFilter === 'ALL'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                All Modes
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('CASH')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  paymentFilter === 'CASH'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Cash (नकद)
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('CREDIT')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  paymentFilter === 'CREDIT'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Udhaar (उधार)
              </button>
            </div>
          </div>

          {/* Sort Segments */}
          <div className="inline-flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-zinc-400 mr-1">Sort:</span>
            <div className="inline-flex p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  sortBy === 'newest'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Newest (नया)
              </button>
              <button
                type="button"
                onClick={() => setSortBy('amount_desc')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  sortBy === 'amount_desc'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Amount ↓
              </button>
              <button
                type="button"
                onClick={() => setSortBy('weight_desc')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  sortBy === 'weight_desc'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Weight ↓
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE: iOS Inset Grouped Sale Cards */}
      <div className="md:hidden space-y-2.5">
        {filteredSales.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No sale records found. Click "+ Nayi Bikri" to record a sale.
          </div>
        ) : (
          filteredSales.map((s) => {
            const weight = s.total_weight ?? (s.items?.reduce((x, it) => x + it.quantity, 0) || 0);
            return (
              <div
                key={s.id}
                className="p-4 rounded-[22px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/70 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-black dark:text-white truncate">
                        {s.party_name || 'Walk-in Cash'}
                      </span>
                      <span className="text-[10px] tabular-nums font-sans font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {s.sale_number}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {formatDate(s.sale_date)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-black dark:text-white tabular-nums font-sans">
                      {formatCurrency(s.total_amount)}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-semibold">{weight} KG</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                  {s.items?.map((it) => `${it.item_name} (${it.quantity}${it.unit}@₹${it.rate})`).join(', ')}
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSale(s)}
                    className="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleToAdjust(s)}
                    className="px-3 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold btn-press shadow-xs flex items-center gap-1"
                  >
                    <IconSliders size={12} />
                    <span>Adjust (सुधार)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP: Sales Table */}
      <div className="hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <th className="px-5 py-3 font-semibold">Bill #</th>
                <th className="px-5 py-3 font-semibold">Date (तारीख़)</th>
                <th className="px-5 py-3 font-semibold">Customer (ग्राहक)</th>
                <th className="px-5 py-3 font-semibold">Items Details (सामान व दर)</th>
                <th className="px-5 py-3 font-semibold text-right">Total Weight</th>
                <th className="px-5 py-3 font-semibold text-right">Total ₹ (रुपये)</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-white">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No sale records found. Click "+ Nayi Bikri" to record a sale.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3.5 tabular-nums font-sans font-bold text-black dark:text-white">
                      {s.sale_number}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-600 dark:text-zinc-400">
                      {formatDate(s.sale_date)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-black dark:text-white">
                      {s.party_name || 'Walk-in Cash'}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-300">
                      {s.items?.map((it) => `${it.item_name}: ${it.quantity} ${it.unit} @ ₹${it.rate}`).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium">
                      {s.total_weight ?? (s.items?.reduce((x, it) => x + it.quantity, 0) || 0)} KG
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-sm text-black dark:text-white">
                      {formatCurrency(s.total_amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(s)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          Receipt (रसीद)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSaleToAdjust(s)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity btn-press shadow-xs"
                          title="Adjust Weight, Price or Delete Bill"
                        >
                          <IconSliders size={12} />
                          <span>Adjust (सुधार)</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice / Receipt View Modal */}
      {selectedSale && (
        <BottomSheet
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          title={`Sale Bill #${selectedSale.sale_number}`}
          subtitle="Complete sale invoice record"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            {/* Header with verified Lakhnadon address */}
            <div className="text-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-extrabold text-black dark:text-white">
                Scrap Management System
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Behind Masjid, Bus Stand, Lakhnadon 480886
              </p>
              <p className="text-xs font-semibold text-black dark:text-white mt-0.5">
                Mob: +91 744 061 9649
              </p>
            </div>

            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3">
              <div>
                <span className="text-zinc-400">Bill Number:</span>{' '}
                <span className="font-bold">{selectedSale.sale_number}</span>
              </div>
              <div>
                <span className="text-zinc-400">Date:</span>{' '}
                <span className="font-bold">{formatDate(selectedSale.sale_date)}</span>
              </div>
              <div>
                <span className="text-zinc-400">Customer:</span>{' '}
                <span className="font-bold">{selectedSale.party_name || 'Walk-in Cash'}</span>
              </div>
            </div>

            {/* Items List */}
            <table className="w-full text-left text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <tr>
                  <th className="p-2">Material</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Rate ₹</th>
                  <th className="p-2 text-right">Amount ₹</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {selectedSale.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium">{it.item_name}</td>
                    <td className="p-2 text-right">{it.quantity} {it.unit}</td>
                    <td className="p-2 text-right">₹{it.rate}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-1 text-xs pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between font-extrabold text-sm">
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedSale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Received Amount:</span>
                <span>{formatCurrency(selectedSale.received_amount)}</span>
              </div>
              {selectedSale.due_amount > 0 && (
                <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                  <span>Customer Due:</span>
                  <span>{formatCurrency(selectedSale.due_amount)}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const s = selectedSale;
                  setSelectedSale(null);
                  setSaleToAdjust(s);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <IconSliders size={14} />
                <span>Adjust / Delete Bill (सुधार या हटाएं)</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <IconPrinter size={14} />
                <span>Print Bill (प्रिंट)</span>
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Transaction Adjustment & Deletion Modal */}
      <TransactionAdjustmentModal
        isOpen={!!saleToAdjust}
        onClose={() => setSaleToAdjust(null)}
        onSuccess={loadSales}
        type="SALE"
        transaction={saleToAdjust}
      />
    </div>
  );
};
