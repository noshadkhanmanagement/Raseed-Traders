import React, { useState, useEffect, useMemo } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { ScrapItem } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, getLocalDateString } from '../../utils/formatters';
import { IconPlus, IconClose } from '../common/Icons';

interface TradeLine {
  id: string;
  itemId: string;
  quantity: string;
  rate: string;
}

interface QuickTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  items: ScrapItem[];
  initialItemId?: string | null;
  onSuccess: () => void;
}

let lineIdCounter = 0;
const nextLineId = () => `line-${++lineIdCounter}-${Date.now()}`;

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  isOpen,
  onClose,
  type,
  items,
  initialItemId,
  onSuccess,
}) => {
  const [tradeLines, setTradeLines] = useState<TradeLine[]>([]);
  const [partyName, setPartyName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isBuy = type === 'buy';

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      const defaultId = initialItemId || (items.length > 0 ? items[0].id : '');
      setTradeLines([{ id: nextLineId(), itemId: defaultId, quantity: '', rate: '' }]);
      setPartyName('');
    }
  }, [isOpen, initialItemId, items]);

  const getItemById = (id: string) => items.find((i) => i.id === id);

  // Get last trade rate for an item
  const getLastRate = (itemId: string): { buyRate?: number; sellRate?: number } => {
    const item = getItemById(itemId);
    if (!item) return {};
    return {
      buyRate: item.default_purchase_rate || undefined,
      sellRate: item.default_sale_rate || undefined,
    };
  };

  const handleLineChange = (lineId: string, field: 'itemId' | 'quantity' | 'rate', value: string) => {
    setTradeLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, [field]: value } : line
      )
    );
  };

  const handleAddLine = () => {
    // Find first item not already selected
    const usedIds = new Set(tradeLines.map((l) => l.itemId));
    const nextItem = items.find((it) => !usedIds.has(it.id));
    const newItemId = nextItem?.id || (items.length > 0 ? items[0].id : '');
    setTradeLines((prev) => [...prev, { id: nextLineId(), itemId: newItemId, quantity: '', rate: '' }]);
  };

  const handleRemoveLine = (lineId: string) => {
    setTradeLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  // Computed totals
  const lineDetails = useMemo(() => {
    return tradeLines.map((line) => {
      const item = getItemById(line.itemId);
      const qty = parseFloat(line.quantity) || 0;
      const rate = parseFloat(line.rate) || 0;
      const amount = Math.round(qty * rate);
      return { ...line, item, qty, rate: rate, amount };
    });
  }, [tradeLines, items]);

  const grandTotal = useMemo(() => {
    return lineDetails.reduce((sum, l) => sum + l.amount, 0);
  }, [lineDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all lines
    for (const ld of lineDetails) {
      if (!ld.item) {
        setErrorMessage('Please select a material for all items.');
        return;
      }
      if (ld.qty <= 0) {
        setErrorMessage(`Please enter a valid quantity for ${ld.item.name}.`);
        return;
      }
      if (ld.rate < 0) {
        setErrorMessage(`Please enter a valid rate for ${ld.item.name}.`);
        return;
      }
      if (!isBuy && ld.qty > ld.item.current_stock) {
        setErrorMessage(`Insufficient stock for ${ld.item.name}! Available: ${ld.item.current_stock} ${ld.item.default_unit}`);
        return;
      }
    }

    // Check for duplicate items
    const itemIds = lineDetails.map((l) => l.item?.id);
    const uniqueIds = new Set(itemIds);
    if (uniqueIds.size !== itemIds.length) {
      setErrorMessage('Duplicate materials selected! Please use different materials for each line.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const today = getLocalDateString();
      const customParty = partyName.trim() || undefined;
      const tradeItems = lineDetails.map((ld) => ({
        item_id: ld.item!.id,
        quantity: ld.qty,
        unit: ld.item!.default_unit,
        rate: ld.rate,
        amount: ld.amount,
      }));

      if (isBuy) {
        await api.createPurchase({
          party_id: 'party-walkin',
          party_name: customParty,
          purchase_date: today,
          items: tradeItems,
          paid_amount: grandTotal,
        });
      } else {
        await api.createSale({
          party_id: 'party-walkin',
          party_name: customParty,
          sale_date: today,
          items: tradeItems,
          received_amount: grandTotal,
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

        {/* 1. Vyapari / Grahak Name Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {isBuy
                ? 'Vyapari / Bechnewala (विक्रेता / जिससे खरीद रहे हैं)'
                : 'Grahak / Khareednewala (क्रेता / जिसको बेच रहे हैं)'}
            </label>
            <span className="text-[10px] font-medium text-zinc-400">वैकल्पिक (Optional)</span>
          </div>
          <input
            type="text"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder={
              isBuy
                ? 'उदा: Ramesh, सुरेश, नकदी पार्टी (Cash)...'
                : 'उदा: Gupta Traders, नकदी पार्टी (Cash)...'
            }
            className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>

        {/* 2. Trade Lines (Multi-Item) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Items (सामग्री) · {tradeLines.length} {tradeLines.length === 1 ? 'Item' : 'Items'}
            </label>
          </div>

          {tradeLines.map((line, idx) => {
            const selectedItem = getItemById(line.itemId);
            const parsedQty = parseFloat(line.quantity) || 0;
            const parsedRate = parseFloat(line.rate) || 0;
            const lineTotal = Math.round(parsedQty * parsedRate);
            const lastRates = getLastRate(line.itemId);
            const hintRate = isBuy ? lastRates.buyRate : lastRates.sellRate;

            return (
              <div
                key={line.id}
                className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2.5 relative"
              >
                {/* Line header with number & remove button */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                    Item {idx + 1}
                  </span>
                  {tradeLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                      className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/60 active:scale-90 transition-all"
                      title="Remove this item"
                    >
                      <IconClose size={12} />
                    </button>
                  )}
                </div>

                {/* Material Selector */}
                <select
                  value={line.itemId}
                  onChange={(e) => handleLineChange(line.id, 'itemId', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.local_name}) — {it.default_unit}
                    </option>
                  ))}
                </select>

                {/* Quantity & Rate Row */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Quantity */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Qty (मात्रा)
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
                        value={line.quantity}
                        onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full pl-3.5 pr-12 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-bold tabular-nums font-sans focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 pointer-events-none">
                        {selectedItem?.default_unit || 'KG'}
                      </span>
                    </div>
                    {selectedItem && (
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Stock: <strong className="text-black dark:text-white tabular-nums">{selectedItem.current_stock}</strong> {selectedItem.default_unit}
                      </p>
                    )}
                  </div>

                  {/* Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Rate (भाव)
                      </label>
                      <span className="text-[10px] font-extrabold text-zinc-400">₹</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 pointer-events-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={line.rate}
                        onChange={(e) => handleLineChange(line.id, 'rate', e.target.value)}
                        placeholder="0"
                        className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-bold tabular-nums font-sans focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                      />
                    </div>
                    {hintRate && hintRate > 0 ? (
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Last: <strong className="text-black dark:text-white tabular-nums">₹{hintRate}</strong>/{selectedItem?.default_unit || 'KG'}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Line Subtotal */}
                {lineTotal > 0 && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-[10px] font-medium text-zinc-500 tabular-nums font-sans">
                      {parsedQty} {selectedItem?.default_unit || 'KG'} × ₹{parsedRate}
                    </span>
                    <span className="text-xs font-extrabold text-black dark:text-white tabular-nums font-sans">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Another Item Button */}
          {tradeLines.length < items.length && (
            <button
              type="button"
              onClick={handleAddLine}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white active:scale-[0.98] transition-all"
            >
              <IconPlus size={14} strokeWidth={2.5} />
              <span>+ Aur Item Jodein (Add Another Material)</span>
            </button>
          )}
        </div>

        {/* 3. Grand Total Box */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
          {/* Itemized breakdown when multiple */}
          {tradeLines.length > 1 && (
            <div className="space-y-1 pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
              {lineDetails.map((ld, idx) => (
                <div key={ld.id} className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="truncate max-w-[60%]">{idx + 1}. {ld.item?.name || 'Item'}</span>
                  <span className="tabular-nums font-sans font-medium">{formatCurrency(ld.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-black dark:text-white">
              Total Amount (कुल रकम)
            </span>
            <span className="text-xl font-black text-black dark:text-white tabular-nums font-sans">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* 4. Save Button */}
        <button
          type="submit"
          disabled={isSubmitting || lineDetails.every((l) => l.qty <= 0)}
          className="w-full py-3 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-sm font-black hover:opacity-90 disabled:opacity-40 transition-all btn-press shadow-xs"
        >
          {isSubmitting ? 'Saving...' : `Save ${tradeLines.length > 1 ? `${tradeLines.length} Items` : 'Entry'} (दर्ज करें)`}
        </button>
      </form>
    </BottomSheet>
  );
};
