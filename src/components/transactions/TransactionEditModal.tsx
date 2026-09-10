import React, { useState, useEffect, useMemo } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { formatCurrency, formatDateTime12Hr } from '../../utils/formatters';
import { IconClose, IconSave, IconAlert } from '../common/Icons';
import { ScrapItem } from '../../types';

export interface UnifiedTxItem {
  item_id?: string;
  item_name: string;
  item_local_name?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface UnifiedTx {
  id: string;
  type: 'PURCHASE' | 'SALE';
  date: string;
  created_at?: string;
  reference_number: string;
  party_name: string;
  total_amount: number;
  total_weight?: number;
  items: UnifiedTxItem[];
}

export interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: UnifiedTx | null;
  itemsList: ScrapItem[];
}

interface EditableItemState {
  item_id: string;
  item_name: string;
  item_local_name?: string;
  unit: string;
  quantity: string;
  rate: string;
  originalQty: number;
  originalRate: number;
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
  itemsList,
}) => {
  const [partyName, setPartyName] = useState('');
  const [lineItems, setLineItems] = useState<EditableItemState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && transaction) {
      setPartyName(transaction.party_name || '');
      setErrorMessage('');
      setIsSubmitting(false);

      const mapped = (transaction.items || []).map((it) => {
        let itemId = it.item_id || '';
        if (!itemId) {
          const match = itemsList.find(
            (catalog) =>
              catalog.name.toUpperCase().trim() === (it.item_name || '').toUpperCase().trim()
          );
          if (match) itemId = match.id;
        }

        return {
          item_id: itemId,
          item_name: it.item_name,
          item_local_name: it.item_local_name,
          unit: it.unit || 'KG',
          quantity: String(it.quantity ?? 0),
          rate: String(it.rate ?? 0),
          originalQty: it.quantity ?? 0,
          originalRate: it.rate ?? 0,
        };
      });

      setLineItems(mapped);
    }
  }, [isOpen, transaction, itemsList]);

  const handleItemChange = (index: number, field: 'quantity' | 'rate', value: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const newTotalAmount = useMemo(() => {
    return lineItems.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      const r = parseFloat(it.rate) || 0;
      return sum + q * r;
    }, 0);
  }, [lineItems]);

  const newTotalWeight = useMemo(() => {
    return lineItems.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      return sum + q;
    }, 0);
  }, [lineItems]);

  if (!transaction) return null;

  const isPurchase = transaction.type === 'PURCHASE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    for (let i = 0; i < lineItems.length; i++) {
      const it = lineItems[i];
      const q = parseFloat(it.quantity);
      const r = parseFloat(it.rate);

      if (isNaN(q) || q <= 0) {
        setErrorMessage(`${it.item_name}: Kripya sahi quantity/vajan darj karein (> 0).`);
        return;
      }
      if (isNaN(r) || r <= 0) {
        setErrorMessage(`${it.item_name}: Kripya sahi bhaav/rate darj karein (> 0).`);
        return;
      }
      if (!it.item_id) {
        setErrorMessage(`${it.item_name}: Material ID missing. Kripya punah koshish karein.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payloadItems = lineItems.map((it) => {
        const q = parseFloat(it.quantity) || 0;
        const r = parseFloat(it.rate) || 0;
        return {
          item_id: it.item_id,
          quantity: q,
          rate: r,
          amount: Math.round(q * r * 100) / 100,
        };
      });

      if (isPurchase) {
        await api.updatePurchaseTransaction(transaction.id, {
          party_name: partyName.trim(),
          items: payloadItems,
          paid_amount: newTotalAmount,
        });
      } else {
        await api.updateSaleTransaction(transaction.id, {
          party_name: partyName.trim(),
          items: payloadItems,
          received_amount: newTotalAmount,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction update karne me samasya aayi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isPurchase ? 'Edit Kharidi Bill (खरीदी बिल सुधारें)' : 'Edit Bikri Bill (बिक्री बिल सुधारें)'}
      subtitle={`${transaction.reference_number} · ${formatDateTime12Hr(transaction.date, transaction.created_at)}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif]">
        {errorMessage && (
          <div className="p-3 rounded-[14px] border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-2">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-500 hover:text-rose-700"
            >
              <IconClose size={12} />
            </button>
          </div>
        )}

        {/* Header Indicator */}
        <div className="flex items-center justify-between p-3 rounded-[16px] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isPurchase
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {isPurchase ? 'KHARIDI (BUY)' : 'BIKRI (SELL)'}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Bill No: <strong className="text-black dark:text-white">{transaction.reference_number}</strong>
            </span>
          </div>
          <div className="text-xs font-bold text-black dark:text-white tabular-nums">
            Original: {formatCurrency(transaction.total_amount)}
          </div>
        </div>

        {/* 1. Party Name Field */}
        <div>
          <label className="block text-xs font-bold text-black dark:text-white mb-1">
            Party Name (पार्टी का नाम)
          </label>
          <input
            type="text"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder={isPurchase ? 'Walk-in Party (नकदी पार्टी)' : 'Buyer Company (क्रेता)'}
            className="w-full h-11 px-3.5 rounded-[14px] border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-semibold text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>

        {/* 2. Line Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-black dark:text-white px-0.5">
            <span>Bill Materials (सामान विवरण)</span>
            <span className="text-[11px] text-zinc-400 font-medium">Quantity & Rate</span>
          </div>

          <div className="space-y-2.5 max-h-[38vh] overflow-y-auto overscroll-contain pr-0.5">
            {lineItems.map((it, idx) => {
              const q = parseFloat(it.quantity) || 0;
              const r = parseFloat(it.rate) || 0;
              const lineAmt = q * r;
              const qtyDiff = q - it.originalQty;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-[16px] border border-black/5 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-2.5"
                >
                  {/* Item title and line total */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">
                        {it.item_name}
                      </span>
                      {it.item_local_name && (
                        <span className="text-[11px] text-zinc-400 ml-1">
                          ({it.item_local_name})
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-zinc-400 ml-1.5 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                        {it.unit}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-black dark:text-white tabular-nums">
                      {formatCurrency(lineAmt)}
                    </div>
                  </div>

                  {/* Quantity & Rate inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">
                        Quantity ({it.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full h-9 px-3 rounded-[10px] border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white tabular-nums"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">
                        Spot Rate (₹/{it.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={it.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full h-9 px-3 rounded-[10px] border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white tabular-nums"
                        required
                      />
                    </div>
                  </div>

                  {/* Stock impact indicator */}
                  {qtyDiff !== 0 && (
                    <div className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                      <IconAlert size={10} className="text-amber-500 shrink-0" />
                      <span>
                        Stock Impact:{' '}
                        <strong className={isPurchase ? (qtyDiff > 0 ? 'text-emerald-600' : 'text-rose-600') : (qtyDiff > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                          {isPurchase
                            ? `${qtyDiff > 0 ? '+' : ''}${qtyDiff} ${it.unit} (Yard stock will ${qtyDiff > 0 ? 'increase' : 'decrease'})`
                            : `${qtyDiff > 0 ? '-' : '+'}${Math.abs(qtyDiff)} ${it.unit} (Yard stock will ${qtyDiff > 0 ? 'decrease' : 'increase'})`}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Updated Total Summary Banner */}
        <div className="p-3.5 rounded-[16px] bg-black text-white dark:bg-white dark:text-black flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
              New Bill Total (नया कुल योग)
            </div>
            <div className="text-xs opacity-90 font-medium mt-0.5">
              Total Weight: {newTotalWeight} KG/PIECE
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black tabular-nums tracking-tight">
              {formatCurrency(newTotalAmount)}
            </div>
            {newTotalAmount !== transaction.total_amount && (
              <div className="text-[10px] font-semibold opacity-80">
                Diff: {newTotalAmount > transaction.total_amount ? '+' : ''}
                {formatCurrency(newTotalAmount - transaction.total_amount)}
              </div>
            )}
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-black/10 dark:border-white/15 bg-zinc-100/80 dark:bg-zinc-800/80 text-black dark:text-white text-xs font-bold active:scale-[0.98] transition-all text-center hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel (रद्द करें)
          </button>
          <button
            type="submit"
            disabled={isSubmitting || newTotalAmount <= 0}
            className="flex-[2] py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold active:scale-[0.98] transition-all text-center hover:opacity-90 shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            <IconSave size={14} />
            <span>
              {isSubmitting
                ? 'Updating...'
                : `Update Bill (${formatCurrency(newTotalAmount)})`}
            </span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
