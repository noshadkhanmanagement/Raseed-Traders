import React, { useState, useEffect, useCallback } from 'react';
import {
  IconTag,
  IconHistory,
  IconPlus,
  IconMinus,
  IconClock,
  IconUser,
  IconTrendingUp,
  IconSliders,
} from '../common/Icons';
import { BottomSheet } from '../common/BottomSheet';
import { ItemAdjustmentModal } from './ItemAdjustmentModal';
import { api } from '../../services/api';
import { ScrapItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ItemRateHistoryModalProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPurchase?: (item: ScrapItem) => void;
  onRecordSale?: (item: ScrapItem) => void;
}

type TabType = 'ALL' | 'PURCHASES' | 'SALES';

export const ItemRateHistoryModal: React.FC<ItemRateHistoryModalProps> = ({
  itemId,
  isOpen,
  onClose,
  onRecordPurchase,
  onRecordSale,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [isItemAdjustOpen, setIsItemAdjustOpen] = useState(false);
  const [historyData, setHistoryData] = useState<{
    item?: ScrapItem;
    purchases: Array<{
      purchase_id: string;
      purchase_number: string;
      purchase_date: string;
      created_at: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      party_name: string;
    }>;
    sales: Array<{
      sale_id: string;
      sale_number: string;
      sale_date: string;
      created_at: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      party_name: string;
      remaining_stock: number;
    }>;
    movements: Array<{
      id: string;
      type: 'PURCHASE' | 'SALE';
      date: string;
      created_at: string;
      reference_number: string;
      party_name: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      remaining_stock: number;
    }>;
    stats: {
      currentStock: number;
      latestPurchaseRate: number | null;
      highestPurchaseRate: number | null;
      lowestPurchaseRate: number | null;
      averageCost: number;
      averagePurchaseRate: number;
      totalQuantityPurchased: number;
      totalAmountPurchased: number;
      distinctRates: Array<{
        rate: number;
        totalQty: number;
        totalAmount: number;
        count: number;
      }>;
      distinctPurchaseRates: Array<{
        rate: number;
        totalQty: number;
        totalAmount: number;
        count: number;
      }>;
      latestSaleRate: number | null;
      highestSaleRate: number | null;
      lowestSaleRate: number | null;
      averageSaleRate: number;
      totalQuantitySold: number;
      totalAmountSold: number;
      distinctSaleRates: Array<{
        rate: number;
        totalQty: number;
        totalAmount: number;
        count: number;
      }>;
    };
  } | null>(null);

  const loadHistory = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getItemRateHistory(id);
      setHistoryData(res as any);
    } catch (err) {
      console.error('Failed to load item rate history', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && itemId) {
      loadHistory(itemId);
    } else {
      setHistoryData(null);
      setActiveTab('ALL');
    }
  }, [isOpen, itemId, loadHistory]);

  const item = historyData?.item;
  const stats = historyData?.stats;
  const purchases = historyData?.purchases || [];
  const sales = historyData?.sales || [];
  const movements = historyData?.movements || [];

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={item ? `${item.name} — ${item.local_name}` : 'Material Ledger & Rate History'}
      subtitle={
        item
          ? `Complete purchase, sale & stock ledger (मापने की इकाई: ${item.default_unit})`
          : 'Scrap spot rate and stock movement log'
      }
      maxWidth="max-w-3xl"
    >
      <div className="space-y-3">
        {loading ? (
          <div className="py-14 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
            <div className="w-7 h-7 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>सामग्री का खाता व इतिहास लोड हो रहा है (Loading item ledger & rate history)...</p>
          </div>
        ) : !item ? (
          <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
            सामग्री नहीं मिली (Item details not found).
          </div>
        ) : (
          <>
            {/* Quick Action & Stock Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                {onRecordPurchase && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRecordPurchase(item);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 btn-press shadow-xs"
                  >
                    <IconPlus size={12} />
                    <span>Buy (खरीद)</span>
                  </button>
                )}

                {onRecordSale && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRecordSale(item);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 btn-press shadow-xs"
                  >
                    <IconMinus size={12} />
                    <span>Sell (बिक्री)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsItemAdjustOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 btn-press shadow-xs"
                  title="Adjust Weight, Price & Delete Material"
                >
                  <IconSliders size={12} />
                  <span>Adjust</span>
                </button>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                <span className="text-zinc-400 font-medium">Stock:</span>
                <span className="font-extrabold text-black dark:text-white tabular-nums font-sans">
                  {item.current_stock.toLocaleString('en-IN')} {item.default_unit}
                </span>
              </div>
            </div>

            {/* iOS Segmented Stat Capsule */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">Avg Buy Rate</div>
                <div className="font-extrabold text-xs sm:text-sm text-black dark:text-white tabular-nums font-sans">
                  {stats?.averagePurchaseRate ? formatCurrency(stats.averagePurchaseRate) : '₹0'}/{item.default_unit}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">Avg Sell Rate</div>
                <div className="font-extrabold text-xs sm:text-sm text-black dark:text-white tabular-nums font-sans">
                  {stats?.averageSaleRate ? formatCurrency(stats.averageSaleRate) : '₹0'}/{item.default_unit}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">Total Volume</div>
                <div className="font-extrabold text-xs sm:text-sm text-black dark:text-white tabular-nums font-sans">
                  {((stats?.totalQuantityPurchased || 0) + (stats?.totalQuantitySold || 0)).toLocaleString('en-IN')} {item.default_unit}
                </div>
              </div>
            </div>

            {/* iOS Segmented Tab Switcher */}
            <div className="inline-flex p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 w-full">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`flex-1 py-1 rounded-full text-xs font-bold transition-all text-center ${
                  activeTab === 'ALL'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                All ({movements.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PURCHASES')}
                className={`flex-1 py-1 rounded-full text-xs font-bold transition-all text-center ${
                  activeTab === 'PURCHASES'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Purchases ({purchases.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SALES')}
                className={`flex-1 py-1 rounded-full text-xs font-bold transition-all text-center ${
                  activeTab === 'SALES'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Sales ({sales.length})
              </button>
            </div>

            {/* TAB CONTENT 1: ALL MOVEMENTS / COMPLETE LEDGER */}
            {activeTab === 'ALL' && (
              <div className="space-y-2">
                {movements.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 text-center space-y-2">
                    <IconHistory size={28} className="mx-auto text-zinc-400" />
                    <div className="font-semibold text-xs text-black dark:text-white">
                      इस सामग्री का कोई खरीद या बिक्री लेज़र दर्ज नहीं है।
                    </div>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      जैसे ही आप इस सामग्री की खरीद या बिक्री दर्ज करेंगे, उसका सम्पूर्ण लेज़र व शेष स्टॉक (Remaining Stock) यहाँ दिखाई देगा।
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                    {movements.map((m, idx) => {
                      const isPurchase = m.type === 'PURCHASE';
                      return (
                        <div
                          key={m.id + '-' + idx}
                          className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Type Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tabular-nums font-sans tracking-wider ${
                                  isPurchase
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                                    : 'border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                }`}
                              >
                                {isPurchase ? '↓ Buy (खरीद)' : '↑ Sale (बिक्री)'}
                              </span>

                              <span className="font-bold text-xs text-black dark:text-white tabular-nums font-sans">
                                {m.reference_number}
                              </span>

                              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                <IconClock size={12} className="inline" />
                                {formatDate(m.date)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                              <span className="flex items-center gap-1">
                                <IconUser size={12} className="text-zinc-400" />
                                {m.party_name}
                              </span>
                            </div>
                          </div>

                          {/* Quantities, Rates, Amount and Running Remaining Stock */}
                          <div className="flex flex-wrap sm:flex-col sm:items-end justify-between items-center border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-900 gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Rate:</span>
                              <span className="font-extrabold text-xs sm:text-sm text-black dark:text-white tabular-nums font-sans">
                                {formatCurrency(m.rate)}/{m.unit}
                              </span>
                            </div>

                            <div className="text-xs text-zinc-500">
                              Qty:{' '}
                              <b
                                className={`tabular-nums font-sans ${
                                  isPurchase ? 'text-black dark:text-white' : 'text-black dark:text-white'
                                }`}
                              >
                                {isPurchase ? '+' : '-'}
                                {m.quantity.toLocaleString('en-IN')} {m.unit}
                              </b>{' '}
                              · Total: <b className="text-black dark:text-white tabular-nums font-sans">{formatCurrency(m.amount)}</b>
                            </div>

                            {/* Remaining Stock Badge */}
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
                              <span className="text-zinc-500 text-[10px]">Remaining Stock (शेष):</span>
                              <span className="font-extrabold text-black dark:text-white tabular-nums font-sans">
                                {m.remaining_stock.toLocaleString('en-IN')} {m.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: PURCHASES ONLY */}
            {activeTab === 'PURCHASES' && (
              <div className="space-y-2">
                {purchases.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 text-center space-y-2">
                    <IconTag size={28} className="mx-auto text-zinc-400" />
                    <div className="font-semibold text-xs text-black dark:text-white">
                      अभी तक इस सामग्री की कोई खरीद दर्ज नहीं हुई है।
                    </div>
                    {onRecordPurchase && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onRecordPurchase(item);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press"
                      >
                        <IconPlus size={14} />
                        <span>Record Purchase (खरीद दर्ज करें)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                    {purchases.map((b, idx) => (
                      <div
                        key={b.purchase_id + '-' + idx}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-black dark:text-white tabular-nums font-sans">
                              {b.purchase_number}
                            </span>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <IconClock size={12} className="inline" />
                              {formatDate(b.purchase_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1">
                              <IconUser size={12} className="text-zinc-400" />
                              {b.party_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-1.5 sm:pt-0 border-zinc-100 dark:border-zinc-900">
                          <div className="inline-flex items-baseline gap-1">
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase">Rate:</span>
                            <span className="font-extrabold text-sm sm:text-base text-black dark:text-white tabular-nums font-sans">
                              {formatCurrency(b.rate)}
                            </span>
                            <span className="text-[10px] text-zinc-400">/{b.unit}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Qty: <b className="text-black dark:text-white tabular-nums font-sans">{b.quantity.toLocaleString('en-IN')} {b.unit}</b> · Total: <b className="text-black dark:text-white tabular-nums font-sans">{formatCurrency(b.amount)}</b>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: SALES ONLY */}
            {activeTab === 'SALES' && (
              <div className="space-y-2">
                {sales.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 text-center space-y-2">
                    <IconTrendingUp size={28} className="mx-auto text-zinc-400" />
                    <div className="font-semibold text-xs text-black dark:text-white">
                      अभी तक इस सामग्री की कोई बिक्री दर्ज नहीं हुई है।
                    </div>
                    {onRecordSale && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onRecordSale(item);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 btn-press"
                      >
                        <IconMinus size={14} />
                        <span>Record Sale (बिक्री दर्ज करें)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                    {sales.map((s, idx) => (
                      <div
                        key={s.sale_id + '-' + idx}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-black dark:text-white tabular-nums font-sans">
                              {s.sale_number}
                            </span>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <IconClock size={12} className="inline" />
                              {formatDate(s.sale_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1">
                              <IconUser size={12} className="text-zinc-400" />
                              {s.party_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end justify-between border-t sm:border-t-0 pt-1.5 sm:pt-0 border-zinc-100 dark:border-zinc-900 gap-1">
                          <div className="inline-flex items-baseline gap-1">
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase">Sale Rate:</span>
                            <span className="font-extrabold text-sm sm:text-base text-black dark:text-white tabular-nums font-sans">
                              {formatCurrency(s.rate)}
                            </span>
                            <span className="text-[10px] text-zinc-400">/{s.unit}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Sold Qty: <b className="text-black dark:text-white tabular-nums font-sans">{s.quantity.toLocaleString('en-IN')} {s.unit}</b> · Amount: <b className="text-black dark:text-white tabular-nums font-sans">{formatCurrency(s.amount)}</b>
                          </div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px]">
                            <span className="text-zinc-500">Remaining Stock (शेष):</span>
                            <span className="font-bold text-black dark:text-white tabular-nums font-sans">
                              {s.remaining_stock.toLocaleString('en-IN')} {s.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>

    <ItemAdjustmentModal
      isOpen={isItemAdjustOpen}
      onClose={() => setIsItemAdjustOpen(false)}
      onSuccess={() => {
        setIsItemAdjustOpen(false);
        if (itemId) {
          loadHistory(itemId);
        }
      }}
      preselectedItemId={item?.id}
    />
  </>
  );
};
