import React, { useState, useEffect, useCallback } from 'react';
import { IconPlus, IconTrash, IconCalendar } from '../common/Icons';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem, Party, ScrapUnit, BusinessSettings } from '../../types';
import { formatCurrency, getLocalDateString } from '../../utils/formatters';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPartyId?: string;
  initialItem?: ScrapItem | null;
}

interface SaleLine {
  item_id: string;
  quantity: string;
  unit: ScrapUnit;
  rate: string; // Strictly starts empty, user inputs
  amount: number;
}

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPartyId,
  initialItem,
}) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [customPartyName, setCustomPartyName] = useState('');
  const [saleDate, setSaleDate] = useState(() => getLocalDateString());
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDependencies = useCallback(async () => {
    try {
      const [allParties, allItems, biz] = await Promise.all([
        api.getParties(),
        api.getItems(),
        api.getBusiness(),
      ]);
      setParties(allParties);
      setItems(allItems);
      setSettings(biz.settings);

      if (initialPartyId) {
        setSelectedPartyId(initialPartyId);
      } else if (allParties.length > 0) {
        setSelectedPartyId(allParties[0].id);
      }

      if (allItems.length > 0) {
        const targetItem = initialItem
          ? allItems.find((it) => it.id === initialItem.id) || initialItem
          : allItems[0];
        setLines([
          {
            item_id: targetItem.id,
            quantity: '',
            unit: targetItem.default_unit,
            rate: '', // User will enter themselves
            amount: 0,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [initialPartyId, initialItem]);

  useEffect(() => {
    if (isOpen) {
      // Full form reset on every open to prevent stale data bleed-through
      setCustomPartyName('');
      setSaleDate(getLocalDateString());
      setErrorMessage('');
      setIsSubmitting(false);
      loadDependencies();
    }
  }, [isOpen, loadDependencies]);

  const handleItemChange = (index: number, itemId: string) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    setLines((prev) => {
      const updated = [...prev];
      const qty = parseFloat(updated[index].quantity) || 0;
      const rate = parseFloat(updated[index].rate) || 0;
      updated[index] = {
        ...updated[index],
        item_id: item.id,
        unit: item.default_unit,
        amount: Number((qty * rate).toFixed(2)),
      };
      return updated;
    });
  };

  const handleQtyChange = (index: number, val: string) => {
    setLines((prev) => {
      const updated = [...prev];
      const qty = parseFloat(val) || 0;
      const rate = parseFloat(updated[index].rate) || 0;
      updated[index] = {
        ...updated[index],
        quantity: val,
        amount: Number((qty * rate).toFixed(2)),
      };
      return updated;
    });
  };

  const handleRateChange = (index: number, val: string) => {
    setLines((prev) => {
      const updated = [...prev];
      const qty = parseFloat(updated[index].quantity) || 0;
      const rate = parseFloat(val) || 0;
      updated[index] = {
        ...updated[index],
        rate: val,
        amount: Number((qty * rate).toFixed(2)),
      };
      return updated;
    });
  };

  const addLine = () => {
    if (items.length === 0) return;
    const firstItem = items[0];
    setLines((prev) => [
      ...prev,
      {
        item_id: firstItem.id,
        quantity: '',
        unit: firstItem.default_unit,
        rate: '',
        amount: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = lines.reduce((sum, l) => sum + (l.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validLines = lines.filter((l) => parseFloat(l.quantity) > 0 && parseFloat(l.rate) >= 0);
    if (validLines.length === 0) {
      setErrorMessage('Kripya kam se kam ek samaan ka wazan (quantity) aur bikri rate bharein.');
      return;
    }

    // Stock check if negative stock is not allowed
    if (!settings?.allow_negative_stock) {
      for (const line of validLines) {
        const item = items.find((it) => it.id === line.item_id);
        const reqQty = parseFloat(line.quantity);
        if (item && item.current_stock < reqQty) {
          setErrorMessage(
            `Stock kam hai: ${item.name} (${item.local_name}) ka uplabdh stock kewal ${item.current_stock} ${item.default_unit} hai, jabki aap ${reqQty} bech rahe hain.`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      let partyIdToUse = selectedPartyId;

      if (customPartyName.trim() && (!partyIdToUse || partyIdToUse === 'NEW')) {
        const newParty = await api.createParty({
          name: customPartyName.trim(),
          party_type: 'CUSTOMER',
          opening_balance: 0,
        });
        partyIdToUse = newParty.id;
      }

      await api.createSale({
        party_id: partyIdToUse || 'party-walkin',
        sale_date: saleDate,
        items: validLines.map((l) => ({
          item_id: l.item_id,
          quantity: parseFloat(l.quantity),
          unit: l.unit,
          rate: parseFloat(l.rate),
          amount: l.amount,
        })),
        received_amount: subtotal,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Bikri save karne me samasya aayi. Kripya punah koshish karein.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Roz Ki Bikri (+ Record Sale)"
      subtitle="Select scrap material from stock and enter selling rate (user inputs rate)"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Customer and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-black dark:text-white mb-1">
              Customer / Grahak (ग्राहक)
            </label>
            <div className="space-y-1.5">
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              >
                <option value="">-- Walk-in Cash Customer (नकदी ग्राहक) --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.phone ? `(${p.phone})` : ''}
                  </option>
                ))}
                <option value="NEW">+ Type New Customer (+ नया नाम लिखें)</option>
              </select>

              {selectedPartyId === 'NEW' && (
                <input
                  type="text"
                  placeholder="Enter customer name (उदा: Suresh Grahak)"
                  value={customPartyName}
                  onChange={(e) => setCustomPartyName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-black dark:text-white mb-1 flex items-center gap-1">
              <IconCalendar size={14} className="text-zinc-400" />
              <span>Sale Date (बिक्री की तारीख़)</span>
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>
        </div>

        {/* Lines */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-black dark:text-white">
              Materials Sold (बेचा गया सामान)
            </label>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center text-xs font-semibold text-black dark:text-white hover:underline btn-press"
            >
              <IconPlus size={14} className="mr-1" /> Add Another Item (और सामान जोड़ें)
            </button>
          </div>

          <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900/50">
            {lines.map((line, idx) => {
              const item = items.find((it) => it.id === line.item_id);
              const available = item?.current_stock ?? 0;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    {/* Select Scrap Material */}
                    <div className="sm:col-span-5">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] text-zinc-500 dark:text-zinc-400">Material</label>
                        <span className="text-[10px] font-semibold text-zinc-500">
                          Stock: {available} {line.unit}
                        </span>
                      </div>
                      <select
                        value={line.item_id}
                        onChange={(e) => handleItemChange(idx, e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-medium text-black dark:text-white outline-none"
                      >
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} — {it.local_name} (Stock: {it.current_stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity (Weight) */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                        Sold Qty ({line.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={line.quantity}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-bold text-black dark:text-white outline-none"
                        required
                      />
                    </div>

                    {/* Selling Rate (Strictly entered by user) */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                        Sell Rate ₹ / {line.unit}
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Enter Rate ₹"
                        value={line.rate}
                        onChange={(e) => handleRateChange(idx, e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-bold text-black dark:text-white outline-none"
                        required
                      />
                    </div>

                    {/* Remove Line */}
                    <div className="sm:col-span-1 flex justify-end">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <IconTrash size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs font-bold text-black dark:text-white">
                    Line Total: {formatCurrency(line.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Summary */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
          <div className="flex items-center justify-between text-base font-extrabold text-black dark:text-white">
            <span>Total Sale Amount (कुल बिक्री राशि):</span>
            <span className="tabular-nums font-sans">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500 font-medium">Payment Settlement:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              100% Full Payment Received (पूर्ण भुगतान प्राप्त)
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel (रद्द करें)
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Sale (बिक्री दर्ज करें)'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
