import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem, Party, ScrapUnit } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPartyId?: string;
  initialItem?: ScrapItem | null;
}

interface PurchaseLine {
  item_id: string;
  quantity: string;
  unit: ScrapUnit;
  rate: string; // Strictly starts empty, user inputs
  amount: number;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPartyId,
  initialItem,
}) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [customPartyName, setCustomPartyName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Full form reset on every open to prevent stale data bleed-through
      setPaidAmount('');
      setCustomPartyName('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setErrorMessage('');
      setIsSubmitting(false);
      loadDependencies();
    }
  }, [isOpen, initialItem]);

  const loadDependencies = async () => {
    try {
      const [allParties, allItems] = await Promise.all([
        api.getParties(),
        api.getItems(),
      ]);
      setParties(allParties);
      setItems(allItems);

      if (initialPartyId) {
        setSelectedPartyId(initialPartyId);
      } else if (allParties.length > 0) {
        setSelectedPartyId(allParties[0].id);
      }

      // Initialize with one line with strictly empty rate (user enters rate themselves)
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
  };


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
        rate: '', // User will enter themselves
        amount: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = lines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const paid = paidAmount === '' ? subtotal : parseFloat(paidAmount) || 0;
  const due = Math.max(0, subtotal - paid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validLines = lines.filter((l) => parseFloat(l.quantity) > 0 && parseFloat(l.rate) >= 0);
    if (validLines.length === 0) {
      setErrorMessage('Kripya kam se kam ek samaan ka wazan (quantity) aur rate bharein.');
      return;
    }

    setIsSubmitting(true);
    try {
      let partyIdToUse = selectedPartyId;

      // If user typed a custom party name that's not in the dropdown
      if (customPartyName.trim() && (!partyIdToUse || partyIdToUse === 'NEW')) {
        const newParty = await api.createParty({
          name: customPartyName.trim(),
          party_type: 'SUPPLIER',
          opening_balance: 0,
        });
        partyIdToUse = newParty.id;
      }

      await api.createPurchase({
        party_id: partyIdToUse || 'party-walkin',
        purchase_date: purchaseDate,
        items: validLines.map((l) => ({
          item_id: l.item_id,
          quantity: parseFloat(l.quantity),
          unit: l.unit,
          rate: parseFloat(l.rate),
          amount: l.amount,
        })),
        paid_amount: paid,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kharidi save karne me samasya aayi. Kripya punah koshish karein.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Roz Ki Kharidi (+ Record Purchase)"
      subtitle="Enter scrap material, weight and buying rate (user inputs rate)"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Supplier and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-black dark:text-white mb-1">
              Supplier / Bikreta (विक्रेता)
            </label>
            <div className="space-y-1.5">
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              >
                <option value="">-- Walk-in Cash Supplier (नकदी विक्रेता) --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.phone ? `(${p.phone})` : ''}
                  </option>
                ))}
                <option value="NEW">+ Type New Name (+ नया नाम लिखें)</option>
              </select>

              {selectedPartyId === 'NEW' && (
                <input
                  type="text"
                  placeholder="Enter supplier name (उदा: Ramesh)"
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
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Purchase Date (खरीदी की तारीख़)</span>
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>
        </div>

        {/* Lines */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-black dark:text-white">
              Materials Purchased (खरीदा गया सामान)
            </label>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center text-xs font-semibold text-black dark:text-white hover:underline btn-press"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Item (और सामान जोड़ें)
            </button>
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2">
            स्क्रैप के दाम हर बार अलग हो सकते हैं — इस समय की सटीक खरीद दर (Spot Rate ₹) दर्ज करें।
          </div>

          <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900/50">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  {/* Select Scrap Material from the 25 exact options */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Material (सामग्री)</label>
                    <select
                      value={line.item_id}
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      className="w-full h-8 px-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-medium text-black dark:text-white outline-none"
                    >
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} — {it.local_name} ({it.default_unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity (Weight) */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                      Weight / Qty ({line.unit})
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

                  {/* Buying Rate (Strictly entered by user) */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                      Buy Rate ₹ / {line.unit}
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
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs font-bold text-black dark:text-white">
                  Line Total: {formatCurrency(line.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Summary */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
          <div className="flex items-center justify-between text-base font-extrabold text-black dark:text-white">
            <span>Total Amount (कुल रुपये):</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-black dark:text-white mb-1">
                Amount Paid (कितना नकद/ऑनलाइन दिया)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder={String(subtotal)}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white outline-none"
              />
              <span className="text-[10px] text-zinc-500">Leave blank for full cash payment</span>
            </div>
            {due > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between mt-auto h-9">
                <span>Remaining Due (बाकी उधारी):</span>
                <span className="font-bold">{formatCurrency(due)}</span>
              </div>
            )}
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
            {isSubmitting ? 'Saving...' : 'Save Purchase (खरीदी दर्ज करें)'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
