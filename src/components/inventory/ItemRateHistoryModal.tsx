import React, { useState, useEffect, useCallback } from 'react';
import { BottomSheet } from '../common/BottomSheet';
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
      subtitle={item ? `Stock: ${item.current_stock.toLocaleString('en-IN')} ${item.default_unit} · Rate Log` : 'Item trade history'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading history...</div>
        ) : !item ? (
          <div className="py-12 text-center text-xs text-zinc-400">Item not found.</div>
        ) : (
          <>
            {/* Segmented Divider: Buy (खरीदी) | Sell (बिक्री) */}
            <div className="inline-flex p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 w-full">
              <button
                type="button"
                onClick={() => setActiveTab('BUY')}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all text-center ${
                  activeTab === 'BUY'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Buy (खरीदी) · {purchases.length}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SELL')}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all text-center ${
                  activeTab === 'SELL'
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xs'
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
                  <div className="py-10 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    No purchase records found for {item.name}.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/60">
                    {purchases.map((p, idx) => (
                      <div
                        key={p.purchase_id || idx}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-black dark:text-white">
                            {formatDate(p.purchase_date)}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            Rate: <strong className="text-black dark:text-white tabular-nums font-sans">{formatCurrency(p.rate)}</strong>/{p.unit}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-extrabold text-black dark:text-white tabular-nums font-sans">
                            {p.quantity.toLocaleString('en-IN')} {p.unit}
                          </div>
                          <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums font-sans mt-0.5">
                            Total: {formatCurrency(p.amount)}
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
                  <div className="py-10 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    No sale records found for {item.name}.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/60">
                    {sales.map((s, idx) => (
                      <div
                        key={s.sale_id || idx}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-black dark:text-white">
                            {formatDate(s.sale_date)}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            Rate: <strong className="text-black dark:text-white tabular-nums font-sans">{formatCurrency(s.rate)}</strong>/{s.unit}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-extrabold text-black dark:text-white tabular-nums font-sans">
                            {s.quantity.toLocaleString('en-IN')} {s.unit}
                          </div>
                          <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums font-sans mt-0.5">
                            Total: {formatCurrency(s.amount)}
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
