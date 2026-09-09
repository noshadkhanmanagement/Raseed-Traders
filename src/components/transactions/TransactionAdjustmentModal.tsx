import React, { useState, useEffect } from 'react';
import {
  IconTrash,
  IconAlert,
  IconCheck,
  IconCalendar,
  IconUser,
  IconPackage,
  IconSliders,
} from '../common/Icons';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { Purchase, Sale } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TransactionAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'PURCHASE' | 'SALE';
  transaction: Purchase | Sale | null;
}

interface EditableItem {
  item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export const TransactionAdjustmentModal: React.FC<TransactionAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  transaction,
}) => {
  const isPurchase = type === 'PURCHASE';
  const [items, setItems] = useState<EditableItem[]>([]);
  const [paidOrReceived, setPaidOrReceived] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen && transaction) {
      setIsConfirmingDelete(false);
      setErrorMessage('');
      setSuccessMessage('');

      const rawItems = (transaction.items || []).map((it) => ({
        item_id: it.item_id,
        item_name: it.item_name || 'Material',
        quantity: Number(it.quantity || 0),
        unit: it.unit || 'KG',
        rate: Number(it.rate || 0),
        amount: Number(it.amount || 0),
      }));
      setItems(rawItems);

      if (isPurchase) {
        setPaidOrReceived(Number((transaction as Purchase).paid_amount || 0));
      } else {
        setPaidOrReceived(Number((transaction as Sale).received_amount || 0));
      }
    }
  }, [isOpen, transaction, isPurchase]);

  if (!transaction) return null;

  const docNumber = isPurchase
    ? (transaction as Purchase).purchase_number
    : (transaction as Sale).sale_number;
  const docDate = isPurchase
    ? (transaction as Purchase).purchase_date
    : (transaction as Sale).sale_date;
  const partyName = transaction.party_name || 'Walk-in Cash';

  const handleItemChange = (index: number, field: 'quantity' | 'rate', valueStr: string) => {
    const val = parseFloat(valueStr) || 0;
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'quantity') {
        item.quantity = val;
      } else {
        item.rate = val;
      }
      item.amount = Number((item.quantity * item.rate).toFixed(2));
      next[index] = item;
      return next;
    });
  };

  const calculatedTotalAmount = items.reduce((sum, it) => sum + it.amount, 0);
  const calculatedTotalWeight = items.reduce((sum, it) => sum + it.quantity, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (isPurchase) {
        await api.updatePurchaseTransaction(transaction.id, {
          items: items.map((it) => ({
            item_id: it.item_id,
            quantity: it.quantity,
            rate: it.rate,
            amount: it.amount,
          })),
          paid_amount: paidOrReceived,
        });
      } else {
        await api.updateSaleTransaction(transaction.id, {
          items: items.map((it) => ({
            item_id: it.item_id,
            quantity: it.quantity,
            rate: it.rate,
            amount: it.amount,
          })),
          received_amount: paidOrReceived,
        });
      }

      setSuccessMessage('बिल में सुधार सफलतापूर्वक सहेज लिया गया (Transaction updated successfully)!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'सुधार सहेजने में समस्या आई (Error updating transaction).');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    setIsDeleting(true);
    setErrorMessage('');

    try {
      if (isPurchase) {
        await api.deletePurchase(transaction.id);
      } else {
        await api.deleteSale(transaction.id);
      }

      setSuccessMessage('बिल सफलतापूर्वक हटा दिया गया व स्टॉक वापस हो गया (Bill deleted & stock restored)!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'बिल हटाने में समस्या आई (Error deleting transaction).');
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isPurchase ? `Purchase Adjustment #${docNumber}` : `Sale Adjustment #${docNumber}`}
      subtitle="वजन व दर सुधारें अथवा बिल पूर्णतः हटाएं (Stock will adjust automatically)"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <IconAlert size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <IconCheck size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Bill Metadata Header */}
        <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 tabular-nums font-sans font-extrabold text-black dark:text-white">
            <IconSliders size={16} className="text-zinc-500" />
            <span>{docNumber}</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
            <span className="flex items-center gap-1">
              <IconCalendar size={14} />
              {formatDate(docDate)}
            </span>
            <span className="flex items-center gap-1">
              <IconUser size={14} />
              {partyName}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Items Adjustment Table */}
          <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-extrabold text-black dark:text-white">
              <div className="flex items-center gap-1.5">
                <IconPackage size={16} className="text-zinc-500" />
                <span>Adjust Weight & Price (वजन व भाव सुधारें)</span>
              </div>
              <span className="text-[11px] font-normal text-zinc-400">
                Total Weight: <b className="tabular-nums font-sans font-bold text-black dark:text-white">{calculatedTotalWeight} KG</b>
              </span>
            </div>

            <div className="space-y-3 divide-y divide-zinc-100 dark:divide-zinc-900">
              {items.map((it, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-black dark:text-white">
                      {it.item_name}
                    </span>
                    <span className="tabular-nums font-sans font-extrabold text-xs text-black dark:text-white">
                      {formatCurrency(it.amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-0.5">
                        Weight / Qty ({it.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold tabular-nums font-sans text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-0.5">
                        Rate (₹/{it.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={it.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold tabular-nums font-sans text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-500">Updated Total Amount:</span>
              <span className="tabular-nums font-sans font-extrabold text-sm text-black dark:text-white">
                {formatCurrency(calculatedTotalAmount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-xl transition-colors"
            >
              Cancel (रद्द करें)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 disabled:opacity-50 btn-press shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Bill Changes (सुधार सहेजें)'}
            </button>
          </div>
        </form>

        {/* Complete Deletion Section */}
        <div className="p-4 rounded-2xl border border-red-200 dark:border-red-950/60 bg-red-50/50 dark:bg-red-950/10 space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-xs text-red-600 dark:text-red-400">
            <IconTrash size={16} />
            <span>Delete Bill Completely (यह बिल हमेशा के लिए हटाएं)</span>
          </div>

          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            इस बिल को हटाने पर गोदाम का स्टॉक अपने-आप उलट (rollback) जाएगा।
            {isPurchase
              ? ' खरीदा गया माल स्टॉक से घट जाएगा।'
              : ' बेचा गया माल वापस स्टॉक में जुड़ जाएगा।'}
          </p>

          {!isConfirmingDelete ? (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-zinc-950 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <IconTrash size={14} />
              <span>Delete Bill #{docNumber}</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 space-y-2">
              <div className="font-extrabold text-xs text-red-700 dark:text-red-300">
                क्या आप वाकई यह बिल #{docNumber} हटाना चाहते हैं?
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-black dark:text-white"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteTransaction}
                  className="px-3.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 btn-press"
                >
                  {isDeleting ? 'Deleting...' : 'हाँ, बिल हटाएं (Delete Bill)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
