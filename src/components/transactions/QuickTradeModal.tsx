import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { ScrapItem } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, getLocalDateString } from '../../utils/formatters';

interface QuickTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  items: ScrapItem[];
  initialItemId?: string | null;
  onSuccess: () => void;
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  isOpen,
  onClose,
  type,
  items,
  initialItemId,
  onSuccess,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const isBuy = type === 'buy';

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      const defaultId = initialItemId || (items.length > 0 ? items[0].id : '');
      setSelectedItemId(defaultId);
      const matched = items.find((i) => i.id === defaultId);
      if (matched) {
        setRate(matched.default_purchase_rate ? String(matched.default_purchase_rate) : '');
      } else {
        setRate('');
      }
      setQuantity('');
    }
  }, [isOpen, initialItemId, items]);

  const handleItemChange = (id: string) => {
    setSelectedItemId(id);
    const matched = items.find((i) => i.id === id);
    if (matched) {
      if (isBuy && matched.default_purchase_rate) {
        setRate(String(matched.default_purchase_rate));
      } else if (!isBuy && matched.default_sale_rate) {
        setRate(String(matched.default_sale_rate));
      }
    }
  };

  const parsedQty = parseFloat(quantity) || 0;
  const parsedRate = parseFloat(rate) || 0;
  const calculatedTotal = Math.round(parsedQty * parsedRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setErrorMessage('Please select a material.');
      return;
    }
    if (parsedQty <= 0) {
      setErrorMessage('Please enter a valid quantity/count.');
      return;
    }
    if (parsedRate < 0) {
      setErrorMessage('Please enter a valid rate.');
      return;
    }

    if (!isBuy && parsedQty > selectedItem.current_stock) {
      setErrorMessage(`Insufficient stock! Available: ${selectedItem.current_stock} ${selectedItem.default_unit}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const today = getLocalDateString();
      if (isBuy) {
        await api.createPurchase({
          party_id: 'party-walkin',
          purchase_date: today,
          items: [
            {
              item_id: selectedItem.id,
              quantity: parsedQty,
              unit: selectedItem.default_unit,
              rate: parsedRate,
              amount: calculatedTotal,
            },
          ],
          paid_amount: calculatedTotal,
        });
      } else {
        await api.createSale({
          party_id: 'party-walkin',
          sale_date: today,
          items: [
            {
              item_id: selectedItem.id,
              quantity: parsedQty,
              unit: selectedItem.default_unit,
              rate: parsedRate,
              amount: calculatedTotal,
            },
          ],
          received_amount: calculatedTotal,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isBuy ? 'Kharidi (Buy Scrap)' : 'Bikri (Sell Scrap)';
  const subtitle = isBuy
    ? 'Record scrap purchase into inventory'
    : 'Record scrap sale from inventory';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {/* 1. Item Selector */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Select Material (सामग्री चुनें)
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => handleItemChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          >
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} ({it.local_name}) — {it.default_unit}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Item Count & Rate Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Count / Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Count / Weight (मात्रा)
              </label>
              <span className="text-[10px] font-extrabold text-zinc-400">
                {selectedItem?.default_unit || 'KG'}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full pl-3.5 pr-12 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-bold tabular-nums font-sans focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                {selectedItem?.default_unit || 'KG'}
              </span>
            </div>
            {selectedItem && (
              <p className="text-[10px] text-zinc-400 mt-1">
                Current Stock: <strong className="text-black dark:text-white tabular-nums">{selectedItem.current_stock}</strong> {selectedItem.default_unit}
              </p>
            )}
          </div>

          {/* Rate Enterer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Rate (भाव प्रति {selectedItem?.default_unit || 'KG'})
              </label>
              <span className="text-[10px] font-extrabold text-zinc-400">₹</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-bold tabular-nums font-sans focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>
        </div>

        {/* 3. Calculated Account Box */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Calculated Account (हिसाब)</span>
            <span className="tabular-nums font-sans">
              {parsedQty} {selectedItem?.default_unit || 'KG'} × ₹{parsedRate}
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-bold text-black dark:text-white">
              Total Amount (कुल रकम)
            </span>
            <span className="text-xl font-black text-black dark:text-white tabular-nums font-sans">
              {formatCurrency(calculatedTotal)}
            </span>
          </div>
        </div>

        {/* 4. Save Button */}
        <button
          type="submit"
          disabled={isSubmitting || parsedQty <= 0}
          className="w-full py-3 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-sm font-black hover:opacity-90 disabled:opacity-40 transition-all btn-press shadow-xs"
        >
          {isSubmitting ? 'Saving...' : 'Save Entry (दर्ज करें)'}
        </button>
      </form>
    </BottomSheet>
  );
};
