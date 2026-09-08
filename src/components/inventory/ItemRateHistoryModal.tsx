import React, { useState, useEffect } from 'react';
import {
  Tag,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Clock,
  User,
  CreditCard,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ItemRateHistoryModalProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPurchase?: (item: ScrapItem) => void;
}

export const ItemRateHistoryModal: React.FC<ItemRateHistoryModalProps> = ({
  itemId,
  isOpen,
  onClose,
  onRecordPurchase,
}) => {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<{
    item?: ScrapItem;
    batches: Array<{
      purchase_id: string;
      purchase_number: string;
      purchase_date: string;
      created_at: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      party_name: string;
      payment_method: string;
    }>;
    stats: {
      latestPurchaseRate: number | null;
      highestPurchaseRate: number | null;
      lowestPurchaseRate: number | null;
      averageCost: number;
      totalQuantityPurchased: number;
      totalAmountPurchased: number;
      distinctRates: Array<{
        rate: number;
        totalQty: number;
        totalAmount: number;
        count: number;
      }>;
    };
  } | null>(null);

  useEffect(() => {
    if (isOpen && itemId) {
      loadHistory(itemId);
    } else {
      setHistoryData(null);
    }
  }, [isOpen, itemId]);

  const loadHistory = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getItemRateHistory(id);
      setHistoryData(res);
    } catch (err) {
      console.error('Failed to load item rate history', err);
    } finally {
      setLoading(false);
    }
  };

  const item = historyData?.item;
  const stats = historyData?.stats;
  const batches = historyData?.batches || [];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `${item.name} — ${item.local_name}` : 'Material Rate History'}
      subtitle={
        item
          ? `All past purchase rates and spot pricing history (मापने की इकाई: ${item.default_unit})`
          : 'Scrap spot rate fluctuation log'
      }
      maxWidth="max-w-2xl"
    >
      <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
            सामग्री का खरीद इतिहास लोड हो रहा है (Loading rate history)...
          </div>
        ) : !item ? (
          <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
            सामग्री नहीं मिली (Item details not found).
          </div>
        ) : (
          <>
            {/* Quick Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs">
                  {item.default_unit}
                </span>
                <div>
                  <div className="font-extrabold text-sm text-black dark:text-white">
                    {item.name} <span className="font-medium text-zinc-500">({item.local_name})</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Current Stock: <span className="font-bold text-black dark:text-white">{item.current_stock} {item.default_unit}</span>
                  </div>
                </div>
              </div>

              {onRecordPurchase && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordPurchase(item);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buy Samaan (खरीदें)</span>
                </button>
              )}
            </div>

            {/* Rate KPI Highlights Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Latest Rate */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                  Latest Rate (ताज़ा भाव)
                </div>
                <div className="mt-1 font-extrabold text-sm sm:text-base text-black dark:text-white">
                  {stats?.latestPurchaseRate ? formatCurrency(stats.latestPurchaseRate) : '₹0.00'}
                  <span className="text-[10px] font-normal text-zinc-400">/{item.default_unit}</span>
                </div>
              </div>

              {/* Average Cost (WAC) */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                  Avg Rate (औसत दर)
                </div>
                <div className="mt-1 font-extrabold text-sm sm:text-base text-black dark:text-white">
                  {stats?.averageCost ? formatCurrency(stats.averageCost) : '₹0.00'}
                  <span className="text-[10px] font-normal text-zinc-400">/{item.default_unit}</span>
                </div>
              </div>

              {/* Lowest Rate */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3 text-zinc-400" />
                  <span>Min (न्यूनतम भाव)</span>
                </div>
                <div className="mt-1 font-bold text-xs sm:text-sm text-black dark:text-white">
                  {stats?.lowestPurchaseRate ? formatCurrency(stats.lowestPurchaseRate) : 'N/A'}
                </div>
              </div>

              {/* Highest Rate */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                  <span>Max (अधिकतम भाव)</span>
                </div>
                <div className="mt-1 font-bold text-xs sm:text-sm text-black dark:text-white">
                  {stats?.highestPurchaseRate ? formatCurrency(stats.highestPurchaseRate) : 'N/A'}
                </div>
              </div>
            </div>

            {/* Distinct Rates Summary Chips */}
            {stats && stats.distinctRates.length > 0 && (
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Alag-Alag Bhaav Summary (विभिन्न दरों पर खरीद का विवरण):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.distinctRates.map((rg) => (
                    <div
                      key={rg.rate}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                    >
                      <span className="font-extrabold text-black dark:text-white">
                        {formatCurrency(rg.rate)}/{item.default_unit}
                      </span>
                      <span className="ml-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        ({rg.totalQty} {item.default_unit} · {rg.count} bill{rg.count > 1 ? 's' : ''})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Purchase Batches History */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-black dark:text-white">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  <span>Purchase Rate Log (कब किस रेट में खरीदा गया):</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-normal">
                  Total: {batches.length} purchase{batches.length !== 1 ? 's' : ''}
                </span>
              </div>

              {batches.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-xs text-black dark:text-white">
                    Abhi tak is samaan ki koi khareedi record nahi hui hai.
                  </div>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Jab bhi aap <b>Roz Ki Kharidi (Buy)</b> me is samaan ko kisi rate par khareedenge, har rate yahan date v voucher number ke sath list ho jayega.
                  </p>
                  {onRecordPurchase && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRecordPurchase(item);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record First Purchase (पहली खरीद दर्ज करें)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                  {batches.map((b, idx) => (
                    <div
                      key={b.purchase_id + '-' + idx}
                      className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-black dark:text-white font-mono">
                            {b.purchase_number}
                          </span>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 inline" />
                            {formatDate(b.purchase_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-zinc-400" />
                            {b.party_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-zinc-400" />
                            {b.payment_method}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-1.5 sm:pt-0 border-zinc-100 dark:border-zinc-900">
                        <div className="inline-flex items-baseline gap-1">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase">Rate:</span>
                          <span className="font-extrabold text-sm sm:text-base text-black dark:text-white font-mono">
                            {formatCurrency(b.rate)}
                          </span>
                          <span className="text-[10px] text-zinc-400">/{b.unit}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Qty: <b className="text-black dark:text-white">{b.quantity} {b.unit}</b> · Total: <b className="text-black dark:text-white font-mono">{formatCurrency(b.amount)}</b>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
};
