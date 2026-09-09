import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  IconSearch,
  IconPlus,
  IconAdjust,
  IconDelete,
  IconReset,
  IconHistory,
} from '../components/common/Icons';
import { PageHeader } from '../components/layout/PageHeader';
import { BottomSheet } from '../components/common/BottomSheet';
import { ItemAdjustmentModal } from '../components/inventory/ItemAdjustmentModal';
import { ItemModal } from '../components/transactions/ItemModal';
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
  const [isLoading, setIsLoading] = useState(true);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedItemToAdjust, setSelectedItemToAdjust] = useState<ScrapItem | null>(null);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<ScrapItem | null>(null);
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null);

  // 2-Option Deletion / Count Reset State
  const [itemForDeletion, setItemForDeletion] = useState<ScrapItem | null>(null);
  const [isDeleteChoiceModalOpen, setIsDeleteChoiceModalOpen] = useState(false);
  const [isConfirmingPermanentDelete, setIsConfirmingPermanentDelete] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isRestoringDefaults, setIsRestoringDefaults] = useState(false);

  const handleOpenHistory = (item: ScrapItem) => {
    setSelectedHistoryItemId(item.id);
    setIsHistoryModalOpen(true);
  };

  useEffect(() => {
    loadInventory();
  }, [refreshCounter]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const allItems = await api.getItems();
      setItems(allItems);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter((it) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      it.name.toLowerCase().includes(q) ||
      it.local_name.toLowerCase().includes(q) ||
      (it.code && it.code.toLowerCase().includes(q))
    );
  });

  const totalStockQuantity = items.reduce((sum, it) => sum + Math.max(0, it.current_stock), 0);
  const inStockCount = items.filter((it) => it.current_stock > 0).length;

  const handleAdjustClick = (item?: ScrapItem) => {
    setSelectedItemToAdjust(item || null);
    setIsAdjustModalOpen(true);
  };

  const handleEditClick = (item: ScrapItem) => {
    setSelectedItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleAddNewClick = () => {
    setSelectedItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleDeleteClick = (item: ScrapItem) => {
    setItemForDeletion(item);
    setIsConfirmingPermanentDelete(false);
    setIsDeleteChoiceModalOpen(true);
  };

  const handleResetCountsAction = async () => {
    if (!itemForDeletion) return;
    setIsProcessingAction(true);
    try {
      await api.resetItemStock(itemForDeletion.id);
      await loadInventory();
      setIsDeleteChoiceModalOpen(false);
      setItemForDeletion(null);
    } catch (err: any) {
      alert(err.message || 'Error resetting counts');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handlePermanentDeleteAction = async () => {
    if (!itemForDeletion) return;
    setIsProcessingAction(true);
    try {
      await api.deleteItem(itemForDeletion.id);
      await loadInventory();
      setIsDeleteChoiceModalOpen(false);
      setItemForDeletion(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting item');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRestoreDefaults = async () => {
    setIsRestoringDefaults(true);
    try {
      await api.restoreDefaultItems();
      await loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error restoring default items');
    } finally {
      setIsRestoringDefaults(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Kitna Stock Hai (स्टॉक / माल)"
        subtitle="Current scrap inventory & spot pricing (सामग्रियों का स्टॉक व चालू खरीद दर)"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              disabled={isRestoringDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press shadow-xs disabled:opacity-50"
              title="Restore any missing default items (डिफ़ॉल्ट 25 सामग्री रीस्टोर करें)"
            >
              <IconReset size={14} className={isRestoringDefaults ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isRestoringDefaults ? 'Restoring...' : 'Restore 25 Items'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAdjustClick()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press shadow-xs"
            >
              <IconAdjust size={14} />
              <span>Adjust Stock (स्टॉक बदलें)</span>
            </button>
            <button
              type="button"
              onClick={handleAddNewClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press shadow-xs"
            >
              <IconPlus size={14} />
              <span>Add Material (नया सामान)</span>
            </button>
          </div>
        }
      />

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Available Stock (कुल उपलब्ध स्टॉक)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-black dark:text-white">
            {totalStockQuantity.toLocaleString('en-IN')} <span className="text-lg font-bold text-zinc-500">KG</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">Across all active scrap materials in godown</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Items In Stock (उपलब्ध सामग्री)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-black dark:text-white">
            {inStockCount} / {items.length}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Materials currently having positive stock</div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <IconSearch size={16} className="text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search material name in English or Hindi (सामग्री का नाम खोजें, उदा: LOHA, लोहा, TEEN...)"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
        />
      </div>

      {/* Items List Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
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
                      <td className="px-5 py-3.5 font-mono text-zinc-400">{idx + 1}</td>
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
                      <td className="px-5 py-3.5 text-right font-mono">
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
                            onClick={() => handleOpenHistory(it)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Rate Fluctuation Log (कब किस रेट में खरीदा गया)"
                          >
                            <IconHistory size={14} className="text-zinc-400" />
                            <span className="hidden sm:inline">Rates</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustClick(it)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity btn-press shadow-xs"
                            title="Adjust Weight, Price & Delete (वजन, भाव व विलोपन)"
                          >
                            <IconAdjust size={14} />
                            <span>Adjust (सुधार)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(it)}
                            className="p-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                            title="Delete Material (सामग्री हटाएं)"
                          >
                            <IconDelete size={14} />
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

      {/* Unified Item Adjustment & Deletion Modal */}
      <ItemAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedItemToAdjust(null);
        }}
        preselectedItemId={selectedItemToAdjust?.id}
        onSuccess={loadInventory}
      />

      {/* Add / Edit Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setSelectedItemToEdit(null);
        }}
        editItem={selectedItemToEdit}
        onSuccess={loadInventory}
      />

      {/* Item Rate History & Ledger Modal */}
      <ItemRateHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedHistoryItemId(null);
        }}
        itemId={selectedHistoryItemId}
        onRecordPurchase={(it) => openPurchase?.(it)}
        onRecordSale={(it) => openSale?.(it)}
      />

      {/* 2-Option Delete / Reset Counts Modal */}
      <BottomSheet
        isOpen={isDeleteChoiceModalOpen && !!itemForDeletion}
        onClose={() => {
          setIsDeleteChoiceModalOpen(false);
          setItemForDeletion(null);
          setIsConfirmingPermanentDelete(false);
        }}
        title="Delete or Reset Material (सामग्री हटाएं या गिनती 0 करें)"
        subtitle={itemForDeletion ? `${itemForDeletion.name} — ${itemForDeletion.local_name} (${itemForDeletion.default_unit})` : ''}
        maxWidth="max-w-md"
      >
        {itemForDeletion && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="font-extrabold text-black dark:text-white">
                {itemForDeletion.name} <span className="text-zinc-500 font-normal">({itemForDeletion.local_name})</span>
              </div>
              <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                Stock: {itemForDeletion.current_stock.toLocaleString('en-IN')} {itemForDeletion.default_unit}
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: Reset Counts / Stock to 0 */}
              <div className="p-3.5 rounded-xl border border-amber-300/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  <IconReset size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Option 1: Delete Counts (सिर्फ गिनती / स्टॉक 0 करें)</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                  सामग्री लिस्ट में हमेशा सुरक्षित रहेगी, केवल इसका स्टॉक शून्य (0) हो जाएगा। (Keep in list, reset stock count to 0)
                </p>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleResetCountsAction}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 btn-press"
                >
                  <IconReset size={14} />
                  <span>{isProcessingAction ? 'Resetting...' : 'Reset Stock Count to 0 (गिनती 0 करें)'}</span>
                </button>
              </div>

              {/* Option 2: Delete Completely from List */}
              <div className="p-3.5 rounded-xl border border-red-300/70 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-900 dark:text-red-200">
                  <IconDelete size={14} className="text-red-600 dark:text-red-400 shrink-0" />
                  <span>Option 2: Delete from List (सामग्री पूरी तरह हटाएं)</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                  सावधानी: यह सामग्री लिस्ट और इसके सभी रिकॉर्ड्स हमेशा के लिए हटा दिए जाएंगे।
                </p>

                {!isConfirmingPermanentDelete ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingPermanentDelete(true)}
                    className="w-full py-2 px-3 rounded-xl border border-red-400 dark:border-red-700 bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <IconDelete size={14} />
                    <span>Delete "{itemForDeletion.name}" Permanently</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-lg bg-red-100/80 dark:bg-red-900/40 border border-red-300 dark:border-red-700 space-y-2">
                    <p className="text-[11px] font-bold text-red-900 dark:text-red-200 leading-tight">
                      क्या आप वाकई "{itemForDeletion.name}" को हमेशा के लिए हटाना चाहते हैं?
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsConfirmingPermanentDelete(false)}
                        className="flex-1 py-1 px-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-200"
                      >
                        रद्द करें (Keep)
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={handlePermanentDeleteAction}
                        className="flex-1 py-1 px-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold disabled:opacity-50 btn-press"
                      >
                        {isProcessingAction ? 'Deleting...' : 'हाँ, हमेशा हटाएं'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteChoiceModalOpen(false);
                  setItemForDeletion(null);
                  setIsConfirmingPermanentDelete(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-lg transition-colors"
              >
                रद्द करें (Cancel)
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
