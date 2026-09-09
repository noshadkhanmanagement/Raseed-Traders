import React, { useState, useEffect, useCallback } from 'react';
import {
  NavStock as IconStock,
  IconAdjust,
  IconDelete,
  IconReset,
  IconAlert,
  IconCheck,
} from '../common/Icons';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem } from '../../types';

interface ItemAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedItemId?: string | null;
}

type StockAdjustMode = 'DIRECT' | 'DELTA';

export const ItemAdjustmentModal: React.FC<ItemAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedItemId,
}) => {
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State: Weight / Stock
  const [stockMode, setStockMode] = useState<StockAdjustMode>('DIRECT');
  const [directStockInput, setDirectStockInput] = useState('');
  const [deltaDirection, setDeltaDirection] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [deltaQuantityInput, setDeltaQuantityInput] = useState('');
  const [reason, setReason] = useState('');

  // Option 1: Delete / Reset Counts State
  const [isConfirmingResetCounts, setIsConfirmingResetCounts] = useState(false);
  const [isResettingCounts, setIsResettingCounts] = useState(false);

  // Option 2: Complete Deletion State
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initItemFields = useCallback((itemId: string, itemList?: ScrapItem[]) => {
    const list = itemList || items;
    const it = list.find((x) => x.id === itemId);
    if (it) {
      setDirectStockInput(String(it.current_stock ?? 0));
      setDeltaQuantityInput('');
      setDeltaDirection('ADD');
      setReason('');
    }
  }, [items]);

  const loadItems = useCallback(async () => {
    try {
      const allItems = await api.getItems();
      setItems(allItems);
      const target = preselectedItemId || (allItems.length > 0 ? allItems[0].id : '');
      if (target) {
        setSelectedItemId(target);
        initItemFields(target, allItems);
      }
    } catch (err) {
      console.error(err);
    }
  }, [preselectedItemId, initItemFields]);

  useEffect(() => {
    if (isOpen) {
      loadItems();
      setIsConfirmingResetCounts(false);
      setIsConfirmingDelete(false);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, loadItems]);

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsConfirmingDelete(false);
    setErrorMessage('');
    setSuccessMessage('');
    initItemFields(itemId);
  };

  const selectedItem = items.find((it) => it.id === selectedItemId);
  const unit = selectedItem?.default_unit || 'KG';
  const currentStock = Number(selectedItem?.current_stock || 0);

  // Compute calculated difference in stock
  let calculatedStockChange = 0;
  let computedNewStock = currentStock;

  if (stockMode === 'DIRECT') {
    const directVal = parseFloat(directStockInput);
    if (!isNaN(directVal)) {
      computedNewStock = directVal;
      calculatedStockChange = directVal - currentStock;
    }
  } else {
    const deltaVal = parseFloat(deltaQuantityInput);
    if (!isNaN(deltaVal) && deltaVal > 0) {
      calculatedStockChange = deltaDirection === 'DEDUCT' ? -deltaVal : deltaVal;
      computedNewStock = Math.max(0, currentStock + calculatedStockChange);
    }
  }

  // Handle Save (Weight + Price Adjustment)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const stockChanged = Math.abs(calculatedStockChange) > 0.0001;

      // 1. If stock changed, apply stock adjustment record
      if (stockChanged) {
        await api.createStockAdjustment({
          item_id: selectedItem.id,
          quantity: calculatedStockChange,
          adjustment_type: 'MANUAL',
          reason: reason.trim() || (stockMode === 'DIRECT' ? 'Physical Stock Adjustment (कांटा मिलान)' : 'Manual Stock Correction'),
        });
      }

      setSuccessMessage('सुधार सफलता से सहेज लिया गया (Adjustments saved successfully)!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'सुधार सहेजने में समस्या आई (Error saving adjustments).');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Option 1: Reset Counts / Stock to 0
  const handleResetCounts = async () => {
    if (!selectedItem) return;
    setIsResettingCounts(true);
    setErrorMessage('');

    try {
      await api.resetItemStock(selectedItem.id);
      setSuccessMessage(`"${selectedItem.name}" का स्टॉक और गिनती 0 कर दी गई (Stock count reset to 0). सामग्री लिस्ट में सुरक्षित है।`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'स्टॉक 0 करने में समस्या आई (Error resetting stock count).');
      setIsResettingCounts(false);
    }
  };

  // Handle Option 2: Complete Deletion from Catalog
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    setErrorMessage('');

    try {
      await api.deleteItem(selectedItem.id);
      setSuccessMessage(`"${selectedItem.name}" लिस्ट से पूरी तरह हटा दिया गया (Deleted permanently from list).`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'सामग्री हटाने में समस्या आई (Error deleting material).');
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={selectedItem ? `Edit: ${selectedItem.name} (${selectedItem.local_name})` : 'Edit Material (सामग्री सुधार)'}
      subtitle={selectedItem ? `Current Stock: ${currentStock.toLocaleString('en-IN')} ${unit} · Unit: ${unit}` : 'Update stock count'}
      maxWidth="max-w-md"
    >
      <div className="space-y-3.5">
        {/* Status Messages */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <IconAlert size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <IconCheck size={15} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Material Selector (only if multiple items and no preselected item or user wants to switch) */}
        {!preselectedItemId && (
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 mb-1">
              Select Material (सामग्री चुनें)
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} — {it.local_name} ({it.default_unit})
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Stock Count Field */}
          <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                Physical Stock (वास्तविक स्टॉक)
              </span>
              <span className="text-zinc-500 text-[11px]">
                Current: <strong className="text-black dark:text-white tabular-nums">{currentStock.toLocaleString('en-IN')}</strong> {unit}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={directStockInput}
                onChange={(e) => setDirectStockInput(e.target.value)}
                placeholder="Enter new stock count..."
                className="w-full h-10 px-3 pr-14 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-extrabold tabular-nums font-sans text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 tabular-nums font-sans text-xs font-bold text-zinc-400 pointer-events-none">
                {unit}
              </span>
            </div>
            {Math.abs(calculatedStockChange) > 0.0001 && (
              <div className="text-[10px] font-medium text-zinc-500 flex items-center justify-between px-1">
                <span>Difference (अंतर):</span>
                <span
                  className={`tabular-nums font-sans font-bold ${
                    calculatedStockChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {calculatedStockChange > 0 ? `+${calculatedStockChange.toLocaleString('en-IN')}` : calculatedStockChange.toLocaleString('en-IN')} {unit}
                </span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-extrabold hover:opacity-90 disabled:opacity-50 transition-all btn-press shadow-xs"
          >
            {isSubmitting ? 'Saving...' : 'Save Adjustments (सुधार सुरक्षित करें)'}
          </button>
        </form>

        {/* Collapsible More Options: Reset or Delete */}
        <details className="text-xs group pt-1">
          <summary className="text-[11px] font-bold text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer select-none py-1">
            + More options (0 करें या लिस्ट से हटाएं)
          </summary>
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isResettingCounts}
                onClick={handleResetCounts}
                className="flex-1 py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                {isResettingCounts ? 'Resetting...' : 'Reset Count to 0 (स्टॉक 0 करें)'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteItem}
                className="flex-1 py-2 px-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete from List (हटाएं)'}
              </button>
            </div>
          </div>
        </details>
      </div>
    </BottomSheet>
  );
};
