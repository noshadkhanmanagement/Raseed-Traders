import React, { useState, useEffect, useCallback } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem, StockAdjustmentType } from '../../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialItemId?: string;
  preselectedItemId?: string;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialItemId,
  preselectedItemId,
}) => {
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [adjustmentType] = useState<StockAdjustmentType>('MANUAL');
  const [adjustmentDirection, setAdjustmentDirection] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const targetId = preselectedItemId || initialItemId;

  const loadItems = useCallback(async () => {
    try {
      const allItems = await api.getItems();
      setItems(allItems);
      if (targetId) {
        setSelectedItemId(targetId);
      } else if (allItems.length > 0 && !selectedItemId) {
        setSelectedItemId(allItems[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }, [targetId, selectedItemId]);

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, loadItems]);

  const selectedItem = items.find((it) => it.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedItemId) {
      setErrorMessage('Kripya samaan chunein.');
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (!qtyNum || qtyNum <= 0) {
      setErrorMessage('Kripya valid quantity bharein.');
      return;
    }

    const signedQuantity = adjustmentDirection === 'DECREASE' ? -qtyNum : qtyNum;

    setIsSubmitting(true);
    try {
      await api.createStockAdjustment({
        item_id: selectedItemId,
        quantity: signedQuantity,
        adjustment_type: adjustmentType,
        reason: reason.trim() || 'Physical Stock Count',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Stock adjust karne me samasya aayi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Adjustment (स्टॉक सुधार)"
      subtitle="Correct or update physical stock in godown"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Item Select */}
        <div>
          <label className="block font-medium text-black dark:text-white mb-1">
            Select Material (सामग्री)
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white outline-none"
            required
          >
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} — {it.local_name} (Current: {it.current_stock} {it.default_unit})
              </option>
            ))}
          </select>
          {selectedItem && (
            <div className="mt-1 text-zinc-500">
              Current Stock: <span className="font-bold text-black dark:text-white">{selectedItem.current_stock} {selectedItem.default_unit}</span>
            </div>
          )}
        </div>

        {/* Direction: Increase vs Decrease */}
        <div>
          <label className="block font-medium text-black dark:text-white mb-1">Action (दिशा)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentDirection('INCREASE')}
              className={`py-2 px-3 rounded-lg border text-center font-bold transition-colors ${
                adjustmentDirection === 'INCREASE'
                  ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              + Add to Stock (बढ़ाना)
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentDirection('DECREASE')}
              className={`py-2 px-3 rounded-lg border text-center font-bold transition-colors ${
                adjustmentDirection === 'DECREASE'
                  ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              - Reduce Stock (घटाना)
            </button>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block font-medium text-black dark:text-white mb-1">
            Quantity ({selectedItem?.default_unit || 'KG'})
          </label>
          <input
            type="number"
            step="any"
            min="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white outline-none"
            required
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block font-medium text-black dark:text-white mb-1">
            Reason (कारण)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Kaanta checking, physical count, moisture"
            className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 font-bold text-white bg-black dark:bg-white dark:text-black rounded-lg disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Updating...' : 'Update Stock (अपडेट करें)'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
