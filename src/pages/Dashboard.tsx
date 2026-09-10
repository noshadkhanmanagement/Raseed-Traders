import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IconPlus,
  IconMinus,
  IconSearch,
  IconReset,
  IconChevron,
  IconClose,
  IconReceipt,
} from '../components/common/Icons';
import { QuickTradeModal } from '../components/transactions/QuickTradeModal';
import { ItemAdjustmentModal } from '../components/inventory/ItemAdjustmentModal';
import { ItemRateHistoryModal } from '../components/inventory/ItemRateHistoryModal';
import { CustomExpenseModal } from '../components/transactions/CustomExpenseModal';
import { BottomSheet } from '../components/common/BottomSheet';
import { api } from '../services/api';
import { ScrapItem } from '../types';

export const Dashboard: React.FC = () => {
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'ZERO_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'stock_desc' | 'recently_traded'>('stock_desc');
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

  // Custom Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

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
        if (sortBy === 'recently_traded') {
          const tA = new Date(a.updated_at || a.created_at || 0).getTime();
          const tB = new Date(b.updated_at || b.created_at || 0).getTime();
          return tB - tA;
        }
        return 0;
      });
  }, [items, searchQuery, stockFilter, sortBy]);

  const stockSummary = useMemo(() => {
    let kgTotal = 0;
    let pieceTotal = 0;
    items.forEach((it) => {
      const stock = Math.max(0, it.current_stock || 0);
      if (it.default_unit === 'PIECE') {
        pieceTotal += stock;
      } else {
        kgTotal += stock;
      }
    });
    return { kg: kgTotal, piece: pieceTotal };
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
    <div className="space-y-4 page-enter max-w-4xl mx-auto pb-32 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif]">
      {/* 1. Shop Header - Apple iOS Large Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 border border-black/5 dark:border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span>Behind Masjid, Bus Stand, Lakhnadon 480886</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Raseed Traders
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium flex items-center gap-2">
            <span>Scrap Management System (कबाड़ व्यापार)</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <a
              href="tel:+917440619649"
              className="text-black dark:text-white font-semibold hover:underline"
            >
              +91 744 061 9649
            </a>
          </p>
        </div>

        {/* 2. Action Capsule Buttons: Buy, Sell, and Kharch (Custom Expense) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenBuy()}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-bold active:scale-[0.97] transition-all duration-150 shadow-[0_2px_10px_rgba(0,0,0,0.15)] hover:opacity-90 whitespace-nowrap"
          >
            <IconPlus size={15} strokeWidth={2.5} />
            <span>Kharidi (Buy)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSell()}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full border border-black/15 dark:border-white/20 bg-white/90 dark:bg-zinc-900/90 text-black dark:text-white text-xs sm:text-sm font-bold active:scale-[0.97] transition-all duration-150 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-zinc-50 dark:hover:bg-zinc-800 whitespace-nowrap"
          >
            <IconMinus size={15} strokeWidth={2.5} />
            <span>Bikri (Sell)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold active:scale-[0.97] transition-all duration-150 shadow-[0_2px_10px_rgba(225,29,72,0.22)] whitespace-nowrap"
          >
            <IconReceipt size={15} strokeWidth={2.5} />
            <span>Kharch (Expense)</span>
          </button>
        </div>
      </div>

      {/* 3. iOS Status Summary Strip */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/90 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span>
            {items.length} Materials · <strong className="text-black dark:text-white font-bold">{stockSummary.kg.toLocaleString('en-IN')} KG</strong>
            {stockSummary.piece > 0 ? (
              <> · <strong className="text-black dark:text-white font-bold">{stockSummary.piece.toLocaleString('en-IN')} PIECE</strong></>
            ) : null} Total Stock
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium">
          Showing {filteredItems.length} of {items.length}
        </span>
      </div>

      {/* 4. iOS Search Bar & Segmented Filters */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Spotlight Search Input */}
          <div className="relative flex-1">
            <IconSearch size={15} className="text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials (LOHA, लोहा, TYRE, PEETAL...)"
              className="w-full pl-10 pr-9 py-2.5 rounded-[14px] border border-black/5 dark:border-white/10 bg-zinc-100/80 dark:bg-[#1c1c1e] text-black dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <IconClose size={12} />
              </button>
            )}
          </div>

          {/* iOS Segmented Control: All | In Stock | 0 Stock */}
          <div className="inline-flex p-1 rounded-[14px] bg-zinc-100/90 dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStockFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-[11px] text-xs font-semibold transition-all duration-150 ${
                stockFilter === 'ALL'
                  ? 'bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-bold'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-3.5 py-1.5 rounded-[11px] text-xs font-semibold transition-all duration-150 ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-bold'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('ZERO_STOCK')}
              className={`px-3.5 py-1.5 rounded-[11px] text-xs font-semibold transition-all duration-150 ${
                stockFilter === 'ZERO_STOCK'
                  ? 'bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-bold'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              0 Stock ({zeroStockCount})
            </button>
          </div>
        </div>

        {/* Sort Pill Row */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[11px] font-semibold text-zinc-400">Sort By:</span>
          <div className="inline-flex p-0.5 rounded-[12px] bg-zinc-100 dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setSortBy('stock_desc')}
              className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold transition-all ${
                sortBy === 'stock_desc'
                  ? 'bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-bold'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Stock ↓
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold transition-all ${
                sortBy === 'name'
                  ? 'bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-bold'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              A-Z
            </button>
            <button
              type="button"
              onClick={() => setSortBy('recently_traded')}
              className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold transition-all ${
                sortBy === 'recently_traded'
                  ? 'bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-bold'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Recent
            </button>
          </div>
        </div>
      </div>

      {/* 5. 1000/1000 APPLE iOS INSET GROUPED STOCK LIST */}
      <div className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-400 font-medium">Loading stock materials...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400 font-medium">No scrap materials found.</div>
        ) : (
          filteredItems.map((it) => {
            const hasStock = it.current_stock > 0;
            return (
              <div
                key={it.id}
                onClick={() => handleOpenHistory(it)}
                className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 active:bg-zinc-100/80 dark:active:bg-zinc-800/80 transition-colors cursor-pointer group"
                title="Touch to view Buy & Sell rate & time history"
              >
                {/* Left: Unit Badge + Stock Dot + Material Names */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <span className="w-10 h-10 rounded-[12px] bg-zinc-100 dark:bg-zinc-800/80 text-black dark:text-white text-xs font-bold flex items-center justify-center border border-black/5 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                      {it.default_unit}
                    </span>
                    {/* Stock Status Visual Dot */}
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1c1c1e] ${
                      hasStock
                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm sm:text-[15px] font-bold text-black dark:text-white tracking-tight">
                        {it.name}
                      </h3>
                      {it.local_name && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                          ({it.local_name})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 flex items-center gap-1.5">
                      <span>Tap to view rate & time history</span>
                    </div>
                  </div>
                </div>

                {/* Right: Stock Quantity + iOS Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-extrabold text-black dark:text-white tabular-nums tracking-tight">
                      {it.current_stock.toLocaleString('en-IN')}{' '}
                      <span className="text-[11px] font-semibold text-zinc-400">{it.default_unit}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        hasStock
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {hasStock ? 'In Stock' : '0 Stock'}
                    </span>
                  </div>

                  {/* Actions: Edit & Reset */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(it)}
                      className="px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold active:scale-95 transition-all shadow-[0_2px_6px_rgba(0,0,0,0.12)] hover:opacity-90"
                      title="Edit stock count"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenReset(it)}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 active:scale-90 transition-all"
                      title="Reset stock to 0"
                    >
                      <IconReset size={14} />
                    </button>
                  </div>

                  {/* iOS Chevron */}
                  <IconChevron size={14} className="text-zinc-300 dark:text-zinc-600 rotate-270 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        )}
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

      {/* Custom Expense Modal */}
      <CustomExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
