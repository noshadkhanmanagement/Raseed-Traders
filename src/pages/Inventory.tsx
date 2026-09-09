import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  IconSearch,
  IconPlus,
  IconAdjust,
  IconDelete,
  IconReset,
  IconHistory,
  IconClose,
  IconChevron,
} from '../components/common/Icons';
import { PageHeader } from '../components/layout/PageHeader';
import { BottomSheet } from '../components/common/BottomSheet';
import { ItemAdjustmentModal } from '../components/inventory/ItemAdjustmentModal';
import { ItemRateHistoryModal } from '../components/inventory/ItemRateHistoryModal';
import { api } from '../services/api';
import { ScrapItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ContextType {
  openPurchase?: (item?: ScrapItem) => void;
  openSale?: (item?: ScrapItem) => void;
  refreshCounter?: number;
}

export const Inventory: React.FC = () => {
  const { openPurchase, openSale, refreshCounter } = useOutletContext<ContextType>() || {};
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'ZERO_STOCK'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedItemToAdjust, setSelectedItemToAdjust] = useState<ScrapItem | null>(null);
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null);

  // Count Reset State (Stock resets to 0 KG, item stays permanent in database)
  const [itemToResetStock, setItemToResetStock] = useState<ScrapItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleOpenHistory = (item: ScrapItem) => {
    setSelectedHistoryItemId(item.id);
    setIsHistoryModalOpen(true);
  };

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const allItems = await api.getItems();
      setItems(allItems);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory, refreshCounter]);

  const [unitFilter, setUnitFilter] = useState<'ALL' | 'KG' | 'PIECE'>('ALL');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'stock_desc' | 'rate_desc'>('name_asc');

  const filteredItems = items
    .filter((it) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const match =
          it.name.toLowerCase().includes(q) ||
          it.local_name.toLowerCase().includes(q) ||
          (it.code && it.code.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (stockFilter === 'IN_STOCK' && it.current_stock <= 0) return false;
      if (stockFilter === 'ZERO_STOCK' && it.current_stock > 0) return false;
      if (unitFilter !== 'ALL' && it.default_unit !== unitFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'stock_desc') return b.current_stock - a.current_stock;
      if (sortBy === 'rate_desc') return (b.default_purchase_rate || 0) - (a.default_purchase_rate || 0);
      return 0;
    });

  const totalStockQuantity = items.reduce((sum, it) => sum + Math.max(0, it.current_stock), 0);
  const inStockCount = items.filter((it) => it.current_stock > 0).length;
  const zeroStockCount = items.filter((it) => it.current_stock <= 0).length;

  const handleAdjustClick = (item?: ScrapItem) => {
    setSelectedItemToAdjust(item || null);
    setIsAdjustModalOpen(true);
  };

  const handleResetStockClick = (item: ScrapItem) => {
    setItemToResetStock(item);
    setIsResetConfirmOpen(true);
  };

  const handleConfirmResetStock = async () => {
    if (!itemToResetStock) return;
    setIsProcessingAction(true);
    try {
      await api.resetItemStock(itemToResetStock.id);
      await loadInventory();
      setIsResetConfirmOpen(false);
      setItemToResetStock(null);
    } catch (err: any) {
      alert(err.message || 'Error resetting stock count');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-4 page-enter">
      <PageHeader
        title="Kitna Stock Hai (स्टॉक / माल)"
        subtitle="Current scrap inventory & spot pricing (सामग्रियों का स्टॉक व चालू खरीद दर)"
        actions={
          <button
            type="button"
            onClick={() => handleAdjustClick()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press shadow-xs"
          >
            <IconAdjust size={14} />
            <span>Adjust Stock</span>
          </button>
        }
      />

      {/* iOS Status Pill Bar (Compact Header Info instead of KPI Widgets) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          <span>
            {items.length} Materials · <strong className="text-black dark:text-white font-bold">{totalStockQuantity.toLocaleString('en-IN')} KG</strong> Stock · <strong className="text-black dark:text-white font-bold">{inStockCount}</strong> In Stock
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium">
          Showing {filteredItems.length} of {items.length}
        </span>
      </div>

      {/* iOS Segmented Controls Bar for Items Listing (All Exact Options) */}
      <div className="space-y-2.5">
        {/* Row 1: Search and Stock Filter Segmented Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* iOS Search Input */}
          <div className="relative flex-1">
            <IconSearch size={16} className="text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials (सामग्री का नाम खोजें, उदा: LOHA, लोहा, 2 TYRE...)"
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

          {/* iOS Stock Segmented Control */}
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

        {/* Row 2: Secondary Exact Options (Unit Segments + Sort Segments) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          {/* Unit Segments */}
          <div className="inline-flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-zinc-400 mr-1">Unit:</span>
            <div className="inline-flex p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setUnitFilter('ALL')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  unitFilter === 'ALL'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setUnitFilter('KG')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  unitFilter === 'KG'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => setUnitFilter('PIECE')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  unitFilter === 'PIECE'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                PIECE
              </button>
            </div>
          </div>

          {/* Sort Segments */}
          <div className="inline-flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-zinc-400 mr-1">Sort:</span>
            <div className="inline-flex p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSortBy('name_asc')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  sortBy === 'name_asc'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                A to Z
              </button>
              <button
                type="button"
                onClick={() => setSortBy('name_desc')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  sortBy === 'name_desc'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Z to A
              </button>
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
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE & TABLET: iOS Segmented Inset Grouped List (Compact & Instant Access) */}
      <div className="md:hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 divide-y divide-zinc-100 dark:divide-zinc-800/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading inventory materials...</div>
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
              >
                {/* Left: Unit Badge + Material Names + Rate */}
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
                      <span>Kharidi: <b className="text-black dark:text-white tabular-nums font-sans">{spotRate > 0 ? `₹${spotRate}` : '₹0'}</b>/{it.default_unit}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Stock + Status + Quick Actions + Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-extrabold text-black dark:text-white tabular-nums font-sans">
                      {it.current_stock.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] text-zinc-400 font-sans">{it.default_unit}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                        hasStock ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {hasStock ? 'In Stock' : '0 Stock'}
                    </span>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleAdjustClick(it)}
                      className="px-2.5 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold btn-press shadow-xs"
                      title="Adjust Weight, Price & Delete"
                    >
                      Adjust
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetStockClick(it)}
                      className="p-1 rounded-full text-zinc-400 hover:text-amber-600 icon-press"
                      title="Reset Stock Count to 0 (स्टॉक 0 करें)"
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

      {/* DESKTOP: Clean High-Density Table */}
      <div className="hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-5 py-3 font-semibold">Material (सामग्री का नाम)</th>
                <th className="px-5 py-3 font-semibold text-right">Spot Purchase Rate (खरीद दर ₹)</th>
                <th className="px-5 py-3 font-semibold text-right">Available Stock (स्टॉक)</th>
                <th className="px-5 py-3 font-semibold text-center">Unit (इकाई)</th>
                <th className="px-5 py-3 font-semibold text-center">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions (कार्य)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    Loading inventory materials...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No matching scrap materials found.
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
                        data-item-name={it.name}
                        className="px-5 py-3.5 cursor-pointer group"
                        onClick={() => handleOpenHistory(it)}
                        title="Touch to view past purchase rates (भाव इतिहास देखें)"
                      >
                        <div className="font-bold text-sm text-black dark:text-white group-hover:underline flex items-center gap-1.5">
                          <span>{it.name}</span>
                          <IconHistory size={12} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                          {hasStock ? 'In Stock (उपलब्ध)' : '0 Stock'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustClick(it)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity btn-press shadow-xs"
                            title="Adjust Weight, Price & Delete (वजन, भाव व विलोपन)"
                          >
                            <IconAdjust size={14} />
                            <span>Adjust</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetStockClick(it)}
                            className="p-1.5 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-amber-600 hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
                            title="Reset Stock Count to 0 (स्टॉक 0 करें)"
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
      </div>

      {/* Reset Stock to 0 Modal (Item remains permanent in database) */}
      <BottomSheet
        isOpen={isResetConfirmOpen && !!itemToResetStock}
        onClose={() => {
          setIsResetConfirmOpen(false);
          setItemToResetStock(null);
        }}
        title="Reset Stock to 0 (स्टॉक शून्य करें)"
        subtitle="Item stays permanently in catalog with 0 count"
        maxWidth="max-w-md"
      >
        {itemToResetStock && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-extrabold text-black dark:text-white text-sm">
                  {itemToResetStock.name}
                </div>
                <div className="text-zinc-500 font-medium">({itemToResetStock.local_name})</div>
              </div>
              <div className="tabular-nums font-sans font-bold text-right">
                <div className="text-zinc-400 text-[10px]">Current Stock</div>
                <div className="text-black dark:text-white font-black text-sm">
                  {itemToResetStock.current_stock.toLocaleString('en-IN')} {itemToResetStock.default_unit}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-amber-300/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-2">
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                क्या आप वाकई <strong>{itemToResetStock.name}</strong> का स्टॉक शून्य (0) करना चाहते हैं? यह सामग्री आपकी लिस्ट में हमेशा सुरक्षित रहेगी।
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetConfirmOpen(false);
                    setItemToResetStock(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleConfirmResetStock}
                  className="flex-1 py-2 px-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 btn-press shadow-xs"
                >
                  {isProcessingAction ? 'Resetting...' : 'हाँ, स्टॉक 0 करें'}
                </button>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
