import React, { useState, useEffect, useCallback } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem } from '../../types';
import { formatCurrency, formatDateTime12Hr } from '../../utils/formatters';
import { IconEdit, IconDelete } from '../common/Icons';
import { TransactionEditModal, UnifiedTx } from '../transactions/TransactionEditModal';

interface ItemRateHistoryModalProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TabType = 'BUY' | 'SELL';

export const ItemRateHistoryModal: React.FC<ItemRateHistoryModalProps> = ({
  itemId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('BUY');
  const [catalogItems, setCatalogItems] = useState<ScrapItem[]>([]);
  const [transactionToEdit, setTransactionToEdit] = useState<UnifiedTx | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  useEffect(() => {
    api.getItems().then(setCatalogItems).catch(() => {});
  }, []);

  const item = historyData.item;
  const purchases = historyData.purchases;
  const sales = historyData.sales;

  // Edit Purchase Handler
  const handleEditPurchase = async (p: (typeof purchases)[0]) => {
    try {
      const allPurchases = await api.getPurchases();
      const fullPurchase = allPurchases.find((pur) => pur.id === p.purchase_id);
      const tx: UnifiedTx = {
        id: p.purchase_id,
        type: 'PURCHASE',
        date: fullPurchase?.purchase_date || p.purchase_date,
        created_at: fullPurchase?.created_at || p.created_at,
        reference_number: fullPurchase?.purchase_number || p.purchase_number,
        party_name: fullPurchase?.party_name || p.party_name,
        total_amount: fullPurchase?.total_amount || p.amount,
        total_weight: fullPurchase?.total_weight || p.quantity,
        items: (fullPurchase?.items && fullPurchase.items.length > 0)
          ? fullPurchase.items.map((it: any) => ({
              item_id: it.item_id,
              item_name: it.item_name || (item && it.item_id === item.id ? item.name : 'Item'),
              item_local_name: it.item_local_name || (item && it.item_id === item.id ? item.local_name : undefined),
              quantity: Number(it.quantity || 0),
              unit: it.unit || p.unit,
              rate: Number(it.rate || 0),
              amount: Number(it.amount || 0),
            }))
          : [{
              item_id: item?.id || itemId || '',
              item_name: item?.name || 'Item',
              item_local_name: item?.local_name,
              quantity: p.quantity,
              unit: p.unit,
              rate: p.rate,
              amount: p.amount,
            }],
      };
      setTransactionToEdit(tx);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Failed to prepare purchase for editing:', err);
    }
  };

  // Edit Sale Handler
  const handleEditSale = async (s: (typeof sales)[0]) => {
    try {
      const allSales = await api.getSales();
      const fullSale = allSales.find((sl) => sl.id === s.sale_id);
      const tx: UnifiedTx = {
        id: s.sale_id,
        type: 'SALE',
        date: fullSale?.sale_date || s.sale_date,
        created_at: fullSale?.created_at || s.created_at,
        reference_number: fullSale?.sale_number || s.sale_number,
        party_name: fullSale?.party_name || s.party_name,
        total_amount: fullSale?.total_amount || s.amount,
        total_weight: fullSale?.total_weight || s.quantity,
        items: (fullSale?.items && fullSale.items.length > 0)
          ? fullSale.items.map((it: any) => ({
              item_id: it.item_id,
              item_name: it.item_name || (item && it.item_id === item.id ? item.name : 'Item'),
              item_local_name: it.item_local_name || (item && it.item_id === item.id ? item.local_name : undefined),
              quantity: Number(it.quantity || 0),
              unit: it.unit || s.unit,
              rate: Number(it.rate || 0),
              amount: Number(it.amount || 0),
            }))
          : [{
              item_id: item?.id || itemId || '',
              item_name: item?.name || 'Item',
              item_local_name: item?.local_name,
              quantity: s.quantity,
              unit: s.unit,
              rate: s.rate,
              amount: s.amount,
            }],
      };
      setTransactionToEdit(tx);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Failed to prepare sale for editing:', err);
    }
  };

  // Delete Purchase Handler
  const handleDeletePurchase = async (p: (typeof purchases)[0]) => {
    const confirmMsg = `"${p.party_name}" ki Kharidi (BUY) bill (${p.purchase_number}) delete karein?\n\nYard stock se maal ghat jayega (-${p.quantity} ${p.unit}).\n\nKya aap nishchit hain?`;
    if (!window.confirm(confirmMsg)) return;

    // Immediately remove from history buy list
    setHistoryData((prev) => ({
      ...prev,
      purchases: prev.purchases.filter((item) => item.purchase_id !== p.purchase_id),
    }));

    try {
      await api.deletePurchase(p.purchase_id);
      await loadData();
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || 'Purchase bill delete karne me samasya aayi.');
      await loadData();
    }
  };

  // Delete Sale Handler
  const handleDeleteSale = async (s: (typeof sales)[0]) => {
    const confirmMsg = `"${s.party_name}" ki Bikri (SELL) bill (${s.sale_number}) delete karein?\n\nYard stock me ${s.quantity} ${s.unit} wapas jud jayega.\n\nKya aap nishchit hain?`;
    if (!window.confirm(confirmMsg)) return;

    // Immediately remove from history sell list
    setHistoryData((prev) => ({
      ...prev,
      sales: prev.sales.filter((item) => item.sale_id !== s.sale_id),
    }));

    try {
      await api.deleteSale(s.sale_id);
      await loadData();
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || 'Sale bill delete karne me samasya aayi.');
      await loadData();
    }
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
    await loadData();
    onSuccess?.();
  };

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

            {/* Min / Max / Avg Rate Metric Tiles */}
            {(() => {
              const records = activeTab === 'BUY' ? purchases : sales;
              if (records.length === 0) return null;
              const rates = records.map((r) => Number(r.rate || 0)).filter((r) => r > 0);
              if (rates.length === 0) return null;
              const minRate = Math.min(...rates);
              const maxRate = Math.max(...rates);
              const avgRate = Number((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2));
              return (
                <div className="grid grid-cols-3 gap-2">
                  <div className="px-3 py-2.5 rounded-[14px] bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 text-center">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Sabse Sasta</div>
                    <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums font-sans mt-0.5">{formatCurrency(minRate)}</div>
                  </div>
                  <div className="px-3 py-2.5 rounded-[14px] bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 text-center">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Average (औसत)</div>
                    <div className="text-sm font-extrabold text-amber-700 dark:text-amber-300 tabular-nums font-sans mt-0.5">{formatCurrency(avgRate)}</div>
                  </div>
                  <div className="px-3 py-2.5 rounded-[14px] bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/50 text-center">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Sabse Mehenga</div>
                    <div className="text-sm font-extrabold text-rose-700 dark:text-rose-300 tabular-nums font-sans mt-0.5">{formatCurrency(maxRate)}</div>
                  </div>
                </div>
              );
            })()}

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
                        className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
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

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-extrabold text-black dark:text-white tabular-nums font-sans">
                              {p.quantity.toLocaleString('en-IN')} {p.unit}
                            </div>
                            <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums font-sans mt-0.5">
                              {formatCurrency(p.amount)}
                            </div>
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditPurchase(p)}
                              className="p-1.5 rounded-full text-zinc-400 hover:text-black dark:hover:text-white active:scale-90 transition-all"
                              title="Edit this purchase (खरीदी बिल सुधारें)"
                            >
                              <IconEdit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePurchase(p)}
                              className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 active:scale-90 transition-all"
                              title="Delete this purchase (खरीदी बिल हटाएं)"
                            >
                              <IconDelete size={14} />
                            </button>
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
                        className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
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

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-extrabold text-black dark:text-white tabular-nums font-sans">
                              {s.quantity.toLocaleString('en-IN')} {s.unit}
                            </div>
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-sans mt-0.5">
                              {formatCurrency(s.amount)}
                            </div>
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditSale(s)}
                              className="p-1.5 rounded-full text-zinc-400 hover:text-black dark:hover:text-white active:scale-90 transition-all"
                              title="Edit this sale (बिक्री बिल सुधारें)"
                            >
                              <IconEdit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSale(s)}
                              className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 active:scale-90 transition-all"
                              title="Delete this sale (बिक्री बिल हटाएं)"
                            >
                              <IconDelete size={14} />
                            </button>
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

      {/* Transaction Edit Modal */}
      <TransactionEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        transaction={transactionToEdit}
        itemsList={catalogItems}
      />
    </BottomSheet>
  );
};
