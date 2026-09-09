import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IconPlus,
  IconMinus,
  IconSearch,
  IconAdjust,
  IconReset,
  IconChevron,
  IconClose,
} from '../components/common/Icons';
import { QuickTradeModal } from '../components/transactions/QuickTradeModal';
import { ItemAdjustmentModal } from '../components/inventory/ItemAdjustmentModal';
import { ItemRateHistoryModal } from '../components/inventory/ItemRateHistoryModal';
import { BottomSheet } from '../components/common/BottomSheet';
import { api } from '../services/api';
import { ScrapItem } from '../types';
import { formatCurrency } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'ZERO_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'stock_desc' | 'rate_desc'>('stock_desc');
  const [isLoading, setIsLoading] = useState(true);

  // Trade Modal State
  const [tradeModal, setTradeModal] = useState<{
    isOpen: boolean;
    type: 'buy' | 'sell';
    initialItemId?: string | null;
  }>({
    isOpen: false,
    type: 'buy',
    initialItemId: null,
  });

  // Adjust Modal State
  const [itemToAdjust, setItemToAdjust] = useState<ScrapItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // History Modal State
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Delete / Reset Stock & Rate to 0 State
  const [itemToReset, setItemToReset] = useState<ScrapItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isProcessingReset, setIsProcessingReset] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allItems = await api.getItems();
      setItems(allItems);
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter & Sort Items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter((it) => {
        if (q) {
          const match =
            it.name.toLowerCase().includes(q) ||
            (it.local_name && it.local_name.toLowerCase().includes(q));
          if (!match) return false;
        }
        if (stockFilter === 'IN_STOCK' && it.current_stock <= 0) return false;
        if (stockFilter === 'ZERO_STOCK' && it.current_stock > 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stock_desc') return b.current_stock - a.current_stock;
        if (sortBy === 'rate_desc') return (b.default_purchase_rate || 0) - (a.default_purchase_rate || 0);
        return 0;
      });
  }, [items, searchQuery, stockFilter, sortBy]);

  const totalStock = useMemo(() => {
    return items.reduce((sum, it) => sum + Math.max(0, it.current_stock), 0);
  }, [items]);

  const inStockCount = useMemo(() => {
    return items.filter((it) => it.current_stock > 0).length;
  }, [items]);

  const zeroStockCount = items.length - inStockCount;

  // Handlers
  const handleOpenBuy = (itemId?: string) => {
    setTradeModal({ isOpen: true, type: 'buy', initialItemId: itemId || null });
  };

  const handleOpenSell = (itemId?: string) => {
    setTradeModal({ isOpen: true, type: 'sell', initialItemId: itemId || null });
  };

  const handleOpenAdjust = (item: ScrapItem) => {
    setItemToAdjust(item);
    setIsAdjustModalOpen(true);
  };

  const handleOpenHistory = (item: ScrapItem) => {
    setHistoryItemId(item.id);
    setIsHistoryModalOpen(true);
  };

  const handleOpenReset = (item: ScrapItem) => {
    setItemToReset(item);
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!itemToReset) return;
    setIsProcessingReset(true);
    try {
      await api.resetItemStock(itemToReset.id);
      await api.updateItem(itemToReset.id, {
        default_purchase_rate: 0,
        default_sale_rate: 0,
      });
      await loadData();
      setIsResetConfirmOpen(false);
      setItemToReset(null);
    } catch (err: any) {
      alert(err.message || 'Error resetting item');
    } finally {
      setIsProcessingReset(false);
    }
  };

  return (
    <div className="space-y-4 page-enter max-w-5xl mx-auto">
      {/* 1. Shop Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Lakhnadon 480886 · Behind Masjid, Bus Stand</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight font-sans">
            Raseed Traders
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Scrap Management System (कबाड़ व्यापार) ·{' '}
            <a href="tel:+917440619649" className="text-black dark:text-white font-semibold hover:underline">
              +91 744 061 9649
            </a>
          </p>
        </div>

        {/* 2. Primary Buy & Sell Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenBuy()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-black hover:opacity-90 active:scale-[0.97] transition-all shadow-xs btn-press"
          >
            <IconPlus size={16} strokeWidth={2.5} />
            <span>Kharidi (Buy)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSell()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-xs sm:text-sm font-black hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-[0.97] transition-all shadow-xs btn-press"
          >
            <IconMinus size={16} strokeWidth={2.5} />
            <span>Bikri (Sell)</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          <span>
            {items.length} Materials · <strong className="text-black dark:text-white font-bold">{totalStock.toLocaleString('en-IN')} KG</strong> Total Stock
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium">
          Showing {filteredItems.length} of {items.length}
        </span>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <IconSearch size={15} className="text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials (सामग्री खोजें, उदा: LOHA, लोहा, TYRE...)"
              className="w-full pl-10 pr-9 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-black dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <IconClose size={12} />
              </button>
            )}
          </div>

          {/* Stock Filter Pills */}
          <div className="inline-flex p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                stockFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('ZERO_STOCK')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                stockFilter === 'ZERO_STOCK'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              0 Stock ({zeroStockCount})
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[11px] font-bold text-zinc-400">Sort By:</span>
          <div className="inline-flex p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setSortBy('stock_desc')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                sortBy === 'stock_desc'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Stock ↓
            </button>
            <button
              type="button"
              onClick={() => setSortBy('rate_desc')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                sortBy === 'rate_desc'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Rate ↓
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                sortBy === 'name'
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              A-Z
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN STOCK LIST */}
      {/* MOBILE: iOS Segmented Grouped List */}
      <div className="md:hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 divide-y divide-zinc-100 dark:divide-zinc-800/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading stock inventory...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">No scrap materials found.</div>
        ) : (
          filteredItems.map((it) => {
            const hasStock = it.current_stock > 0;
            const spotRate = it.default_purchase_rate || 0;
            return (
              <div
                key={it.id}
                onClick={() => handleOpenHistory(it)}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors cursor-pointer"
                title="Touch to view Buy & Sell history"
              >
                {/* Left: Unit Badge + Material Names + Spot Rate */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white tabular-nums font-sans text-[11px] font-extrabold flex items-center justify-center shrink-0 border border-zinc-200/60 dark:border-zinc-700/60">
                    {it.default_unit}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-black dark:text-white tracking-tight truncate flex items-center gap-1">
                      <span>{it.name}</span>
                      <span className="text-[11px] text-zinc-400 font-normal">({it.local_name})</span>
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <span>Rate: <b className="text-black dark:text-white tabular-nums font-sans">{spotRate > 0 ? `₹${spotRate}` : '₹0'}</b>/{it.default_unit}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Stock Count + Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-extrabold text-black dark:text-white tabular-nums font-sans">
                      {it.current_stock.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] text-zinc-400 font-sans">{it.default_unit}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                        hasStock
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {hasStock ? 'In Stock' : '0 Stock'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(it)}
                      className="px-2.5 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold btn-press shadow-xs"
                      title="Edit Count & Rate"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenReset(it)}
                      className="p-1 rounded-full text-zinc-400 hover:text-amber-600 icon-press"
                      title="Reset count and rate to 0"
                    >
                      <IconReset size={13} />
                    </button>
                  </div>
                  <IconChevron size={14} className="text-zinc-300 dark:text-zinc-600 rotate-270 shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP: Clean Stock Table */}
      <div className="hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
              <th className="px-5 py-3 w-12 text-zinc-400">#</th>
              <th className="px-5 py-3">Material Name (सामग्री)</th>
              <th className="px-5 py-3 text-right">Spot Rate (चालू भाव)</th>
              <th className="px-5 py-3 text-right">Stock (कुल स्टॉक)</th>
              <th className="px-5 py-3 text-center">Unit</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                  Loading stock materials...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                  No materials found matching criteria.
                </td>
              </tr>
            ) : (
              filteredItems.map((it, idx) => {
                const hasStock = it.current_stock > 0;
                const spotRate = it.default_purchase_rate || 0;
                return (
                  <tr key={it.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3.5 tabular-nums font-sans font-bold text-zinc-400">{idx + 1}</td>
                    <td
                      className="px-5 py-3.5 cursor-pointer group"
                      onClick={() => handleOpenHistory(it)}
                      title="Touch to view Buy & Sell history"
                    >
                      <div className="font-bold text-sm text-black dark:text-white group-hover:underline flex items-center gap-1.5">
                        <span>{it.name}</span>
                        <IconChevron size={12} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity rotate-270" />
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{it.local_name}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-sans">
                      {spotRate > 0 ? (
                        <div className="inline-flex items-center gap-1 font-bold text-xs text-black dark:text-white">
                          <span>{formatCurrency(spotRate)}</span>
                          <span className="text-[10px] text-zinc-400">/{it.default_unit}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-[11px] italic">Not set</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-base">
                      {it.current_stock.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium text-zinc-500 dark:text-zinc-400">
                      {it.default_unit}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          hasStock
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {hasStock ? 'In Stock' : '0 Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(it)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity btn-press shadow-xs"
                          title="Edit Count & Rate"
                        >
                          <IconAdjust size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReset(it)}
                          className="p-1.5 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-amber-600 hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
                          title="Reset count and rate to 0"
                        >
                          <IconReset size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* QUICK TRADE POPUP (Identical clean popup for Buy and Sell) */}
      <QuickTradeModal
        isOpen={tradeModal.isOpen}
        onClose={() => setTradeModal({ isOpen: false, type: 'buy', initialItemId: null })}
        type={tradeModal.type}
        items={items}
        initialItemId={tradeModal.initialItemId}
        onSuccess={loadData}
      />

      {/* EDIT COUNT & RATE MODAL */}
      <ItemAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setItemToAdjust(null);
        }}
        preselectedItemId={itemToAdjust?.id}
        onSuccess={loadData}
      />

      {/* ITEM HISTORY SHEET (With Buy | Sell Segmented Divider) */}
      <ItemRateHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryItemId(null);
        }}
        itemId={historyItemId}
      />

      {/* RESET COUNT & RATE TO 0 CONFIRMATION SHEET */}
      <BottomSheet
        isOpen={isResetConfirmOpen && !!itemToReset}
        onClose={() => {
          setIsResetConfirmOpen(false);
          setItemToReset(null);
        }}
        title="Reset Stock & Rate (शून्य करें)"
        subtitle="Item stays permanently in catalog with 0 count & rate"
        maxWidth="max-w-md"
      >
        {itemToReset && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-extrabold text-black dark:text-white text-sm">
                  {itemToReset.name}
                </div>
                <div className="text-zinc-500 font-medium">({itemToReset.local_name})</div>
              </div>
              <div className="tabular-nums font-sans font-bold text-right">
                <div className="text-zinc-400 text-[10px]">Current Stock</div>
                <div className="text-black dark:text-white font-black text-sm">
                  {itemToReset.current_stock.toLocaleString('en-IN')} {itemToReset.default_unit}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-amber-300/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-2">
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                क्या आप वाकई <strong>{itemToReset.name}</strong> का स्टॉक और भाव शून्य (0) करना चाहते हैं? यह सामग्री आपकी लिस्ट में हमेशा सुरक्षित रहेगी।
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetConfirmOpen(false);
                    setItemToReset(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isProcessingReset}
                  onClick={handleConfirmReset}
                  className="flex-1 py-2 px-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 btn-press shadow-xs"
                >
                  {isProcessingReset ? 'Resetting...' : 'हाँ, 0 करें'}
                </button>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
