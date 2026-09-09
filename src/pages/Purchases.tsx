import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Download, Search, Printer, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { BottomSheet } from '../components/common/BottomSheet';
import { TransactionAdjustmentModal } from '../components/transactions/TransactionAdjustmentModal';
import { api } from '../services/api';
import { Purchase } from '../types';
import { formatCurrency, formatDate, downloadCSV } from '../utils/formatters';

interface ContextType {
  openPurchase: () => void;
  refreshCounter?: number;
}

export const Purchases: React.FC = () => {
  const { openPurchase, refreshCounter } = useOutletContext<ContextType>();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseToAdjust, setPurchaseToAdjust] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, [refreshCounter]);

  const loadPurchases = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPurchases();
      setPurchases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.purchase_number.toLowerCase().includes(q) ||
      (p.party_name && p.party_name.toLowerCase().includes(q)) ||
      p.items?.some((it) => it.item_name?.toLowerCase().includes(q))
    );
  });

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const totalPurchasesWeight = purchases.reduce((sum, p) => sum + (p.total_weight ?? (p.items?.reduce((s, it) => s + it.quantity, 0) || 0)), 0);

  const handleExportCSV = () => {
    const headers = ['Purchase Number', 'Date', 'Supplier', 'Items Details', 'Total Amount', 'Paid Amount', 'Due Amount', 'Payment Method'];
    const rows = filteredPurchases.map((p) => [
      p.purchase_number,
      p.purchase_date,
      p.party_name || 'Walk-in',
      p.items?.map((it) => `${it.item_name} (${it.quantity}${it.unit}@₹${it.rate})`).join('; ') || '',
      p.total_amount,
      p.paid_amount,
      p.due_amount,
    ]);
    downloadCSV('Purchases_Register', headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Roz Kitna Khareeda (खरीदी रजिस्टर)"
        subtitle="Complete log of scrap materials bought, weight, and amounts paid"
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
              onClick={openPurchase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nayi Kharidi (Buy)</span>
            </button>
          </div>
        }
      />

      {/* iOS KPI Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Purchased Amount (कुल खरीदी राशि)
          </div>
          <div className="mt-2 text-3xl font-black text-black dark:text-white font-sans">
            {formatCurrency(totalPurchasesAmount)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 font-medium">{purchases.length} total purchase transactions</div>
        </div>

        <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Purchased Weight (कुल खरीदा गया वज़न)
          </div>
          <div className="mt-2 text-3xl font-black text-black dark:text-white font-sans">
            {totalPurchasesWeight} <span className="text-sm font-bold text-zinc-400">KG</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 font-medium">Total weight received in godown</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by invoice number, supplier name, or material..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-black dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
        />
      </div>

      {/* MOBILE: iOS Inset Grouped Purchase Cards */}
      <div className="md:hidden space-y-2.5">
        {filteredPurchases.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No purchase records found. Click "+ Nayi Kharidi" to add entry.
          </div>
        ) : (
          filteredPurchases.map((p) => {
            const weight = p.total_weight ?? (p.items?.reduce((s, it) => s + it.quantity, 0) || 0);
            return (
              <div
                key={p.id}
                className="p-4 rounded-[22px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/70 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-black dark:text-white truncate">
                        {p.party_name || 'Walk-in Supplier'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {p.purchase_number}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {formatDate(p.purchase_date)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-black dark:text-white font-mono">
                      {formatCurrency(p.total_amount)}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-semibold">{weight} KG</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                  {p.items?.map((it) => `${it.item_name} (${it.quantity}${it.unit}@₹${it.rate})`).join(', ')}
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPurchase(p)}
                    className="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseToAdjust(p)}
                    className="px-3 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold btn-press shadow-xs flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Adjust (सुधार)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP: Purchases Table */}
      <div className="hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <th className="px-5 py-3 font-semibold">Bill #</th>
                <th className="px-5 py-3 font-semibold">Date (तारीख़)</th>
                <th className="px-5 py-3 font-semibold">Supplier (विक्रेता)</th>
                <th className="px-5 py-3 font-semibold">Items Details (सामान व दर)</th>
                <th className="px-5 py-3 font-semibold text-right">Total Weight</th>
                <th className="px-5 py-3 font-semibold text-right">Total ₹ (रुपये)</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-white">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No purchase records found. Click "+ Nayi Kharidi" to add entry.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-black dark:text-white">
                      {p.purchase_number}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-600 dark:text-zinc-400">
                      {formatDate(p.purchase_date)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-black dark:text-white">
                      {p.party_name || 'Walk-in Cash'}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-300">
                      {p.items?.map((it) => `${it.item_name}: ${it.quantity} ${it.unit} @ ₹${it.rate}`).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium">
                      {p.total_weight ?? (p.items?.reduce((s, it) => s + it.quantity, 0) || 0)} KG
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-sm text-black dark:text-white">
                      {formatCurrency(p.total_amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPurchase(p)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          Receipt (रसीद)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPurchaseToAdjust(p)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity btn-press shadow-xs"
                          title="Adjust Weight, Price or Delete Bill"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
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
      {selectedPurchase && (
        <BottomSheet
          isOpen={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          title={`Purchase Bill #${selectedPurchase.purchase_number}`}
          subtitle="Complete purchase invoice record"
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
                <span className="font-bold">{selectedPurchase.purchase_number}</span>
              </div>
              <div>
                <span className="text-zinc-400">Date:</span>{' '}
                <span className="font-bold">{formatDate(selectedPurchase.purchase_date)}</span>
              </div>
              <div>
                <span className="text-zinc-400">Supplier:</span>{' '}
                <span className="font-bold">{selectedPurchase.party_name || 'Walk-in Cash'}</span>
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
                {selectedPurchase.items?.map((it, idx) => (
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
                <span>{formatCurrency(selectedPurchase.total_amount)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Paid Amount:</span>
                <span>{formatCurrency(selectedPurchase.paid_amount)}</span>
              </div>
              {selectedPurchase.due_amount > 0 && (
                <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(selectedPurchase.due_amount)}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const p = selectedPurchase;
                  setSelectedPurchase(null);
                  setPurchaseToAdjust(p);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Adjust / Delete Bill (सुधार या हटाएं)</span>
              </button>
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

      {/* Transaction Adjustment & Deletion Modal */}
      <TransactionAdjustmentModal
        isOpen={!!purchaseToAdjust}
        onClose={() => setPurchaseToAdjust(null)}
        onSuccess={loadPurchases}
        type="PURCHASE"
        transaction={purchaseToAdjust}
      />
    </div>
  );
};
