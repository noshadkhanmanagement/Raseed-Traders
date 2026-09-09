import React, { useState, useEffect, useCallback } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem } from '../../types';
import { formatCurrency, formatDateTime12Hr } from '../../utils/formatters';

interface ItemRateHistoryModalProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPurchase?: (item: ScrapItem) => void;
  onRecordSale?: (item: ScrapItem) => void;
}

type TabType = 'BUY' | 'SELL';

export const ItemRateHistoryModal: React.FC<ItemRateHistoryModalProps> = ({
  itemId,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('BUY');
  const [historyData, setHistoryData] = useState<{
    item?: ScrapItem;
    purchases: Array<{
      purchase_id: string;
      purchase_number: string;
      purchase_date: string;
      created_at?: string;
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
      created_at?: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      party_name: string;
    }>;
  }>({ purchases: [], sales: [] });

  const loadData = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const data = await api.getItemRateHistory(itemId);
      setHistoryData({
        item: data.item,
        purchases: data.purchases || [],
        sales: data.sales || [],
      });
    } catch (err) {
      console.error('Failed to load item history', err);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (isOpen && itemId) {
      loadData();
      setActiveTab('BUY');
    }
  }, [isOpen, itemId, loadData]);

  const item = historyData.item;
  const purchases = historyData.purchases;
  const sales = historyData.sales;

  return (
    <BottomSheet
      isOpen={isOpen && !!itemId}
      onClose={onClose}
      title={item ? `${item.name} (${item.local_name})` : 'Material History'}
      subtitle={item ? `Stock: ${item.current_stock.toLocaleString('en-IN')} ${item.default_unit} · Rate & Time Log` : 'Item trade history'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif]">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading history...</div>
        ) : !item ? (
          <div className="py-12 text-center text-xs text-zinc-400">Item not found.</div>
        ) : (
          <>
            {/* iOS Segmented Control: Buy (खरीदी) | Sell (बिक्री) */}
            <div className="flex p-1 rounded-[14px] bg-zinc-100 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 w-full">
              <button
                type="button"
                onClick={() => setActiveTab('BUY')}
                className={`flex-1 py-1.5 rounded-[11px] text-xs font-semibold transition-all text-center ${
                  activeTab === 'BUY'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-bold'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Buy (खरीदी) · {purchases.length}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SELL')}
                className={`flex-1 py-1.5 rounded-[11px] text-xs font-semibold transition-all text-center ${
                  activeTab === 'SELL'
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-bold'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Sell (बिक्री) · {sales.length}
              </button>
            </div>

            {/* TAB CONTENT: BUY LIST */}
            {activeTab === 'BUY' && (
              <div className="space-y-2">
                {purchases.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    No purchase records found for {item.name}.
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-black/5 dark:border-white/10 overflow-hidden max-h-[50vh] overflow-y-auto overscroll-contain bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {purchases.map((p, idx) => (
                      <div
                        key={p.purchase_id || idx}
                        className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                              BUY
                            </span>
                            <span className="text-xs font-bold text-black dark:text-white tracking-tight">
                              {formatDateTime12Hr(p.purchase_date, p.created_at)}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1 flex items-center gap-2">
                            <span>Rate: <strong className="text-black dark:text-white tabular-nums font-sans font-bold">{formatCurrency(p.rate)}</strong>/{p.unit}</span>
                            {p.party_name && (
                              <>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="truncate">{p.party_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-extrabold text-black dark:text-white tabular-nums font-sans">
                            {p.quantity.toLocaleString('en-IN')} {p.unit}
                          </div>
                          <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums font-sans mt-0.5">
                            {formatCurrency(p.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SELL LIST */}
            {activeTab === 'SELL' && (
              <div className="space-y-2">
                {sales.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    No sale records found for {item.name}.
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-black/5 dark:border-white/10 overflow-hidden max-h-[50vh] overflow-y-auto overscroll-contain bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {sales.map((s, idx) => (
                      <div
                        key={s.sale_id || idx}
                        className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                              SELL
                            </span>
                            <span className="text-xs font-bold text-black dark:text-white tracking-tight">
                              {formatDateTime12Hr(s.sale_date, s.created_at)}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1 flex items-center gap-2">
                            <span>Rate: <strong className="text-black dark:text-white tabular-nums font-sans font-bold">{formatCurrency(s.rate)}</strong>/{s.unit}</span>
                            {s.party_name && (
                              <>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="truncate">{s.party_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-extrabold text-black dark:text-white tabular-nums font-sans">
                            {s.quantity.toLocaleString('en-IN')} {s.unit}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-sans mt-0.5">
                            {formatCurrency(s.amount)}
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
  );
};
