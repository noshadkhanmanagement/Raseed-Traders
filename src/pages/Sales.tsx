import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Download, Search, Printer } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { BottomSheet } from '../components/common/BottomSheet';
import { api } from '../services/api';
import { Sale } from '../types';
import { formatCurrency, formatDate, downloadCSV } from '../utils/formatters';

interface ContextType {
  openSale: () => void;
}

export const Sales: React.FC = () => {
  const { openSale } = useOutletContext<ContextType>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSales();
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.sale_number.toLowerCase().includes(q) ||
      (s.party_name && s.party_name.toLowerCase().includes(q)) ||
      s.items?.some((it) => it.item_name?.toLowerCase().includes(q))
    );
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
      s.payment_method,
    ]);
    downloadCSV('Sales_Register', headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Kitna Becha (बिक्री रजिस्टर)"
        subtitle="Complete log of scrap materials sold, quantities, and customer receipts"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={openSale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nayi Bikri (Sell)</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Sales Amount (कुल बिक्री राशि)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-black dark:text-white">
            {formatCurrency(totalSalesAmount)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{sales.length} total sale transactions</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Sold Weight (कुल बेची गई मात्रा)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-black dark:text-white">
            {totalSalesWeight} <span className="text-lg font-bold text-zinc-500">KG</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">Total weight dispatched from godown</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by invoice number, customer name, or material (LOHA, TEEN, etc.)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
        />
      </div>

      {/* Sales Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
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
                    <td className="px-5 py-3.5 font-mono font-bold text-black dark:text-white">
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
                      <button
                        type="button"
                        onClick={() => setSelectedSale(s)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Receipt (रसीद)
                      </button>
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
              <div>
                <span className="text-zinc-400">Payment:</span>{' '}
                <span className="font-bold">{selectedSale.payment_method}</span>
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

            {/* Print button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill (प्रिंट)</span>
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
