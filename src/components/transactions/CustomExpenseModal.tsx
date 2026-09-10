import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { formatCurrency, getLocalDateString } from '../../utils/formatters';
import { IconReceipt, IconClose } from '../common/Icons';

interface CustomExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CustomExpenseModal: React.FC<CustomExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRecipientName('');
      setReason('');
      setAmount('');
      setExpenseDate(getLocalDateString());
      setNotes('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (!recipientName.trim()) {
      setErrorMessage('Kripya jisko paise diye hain uska naam likhein (Enter recipient name).');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Kripya kharch ki wajah / karan likhein (Enter expense reason).');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Kripya sahi rashi / rupaye bharein (Enter valid amount greater than 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createExpense({
        recipient_name: recipientName.trim(),
        reason: reason.trim(),
        amount: parsedAmount,
        expense_date: expenseDate,
        notes: notes.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kharcha darj karne me samasya aayi. Kripya punah koshish karein.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Custom Kharcha (कस्टम ख़र्च)"
      subtitle="Enter recipient name, reason and amount (किसे दिया, कारण और रुपये)"
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

        {/* 1. Recipient Name Field */}
        <div>
          <label className="block text-xs font-bold text-black dark:text-white mb-1">
            Jisko Paise Diye (किसे दिया / Recipient Name) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="उदा: Raju Driver, Ramesh Mistri, Sharma Ji"
            className="w-full h-11 px-3.5 rounded-[14px] border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-semibold text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all placeholder:text-zinc-400"
            required
            autoFocus
          />
        </div>

        {/* 2. Reason Field */}
        <div>
          <label className="block text-xs font-bold text-black dark:text-white mb-1">
            Kharch Ka Karan (खर्च की वजह / Reason) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="उदा: Gaadi Bhaada / Diesel, Majdoori, Kiraya, Chai"
            className="w-full h-11 px-3.5 rounded-[14px] border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-semibold text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all placeholder:text-zinc-400"
            required
          />
        </div>

        {/* 3. Amount & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-1">
              Amount (रुपये ₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-zinc-400 pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 pl-8 pr-3.5 rounded-[14px] border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-base font-extrabold text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all tabular-nums placeholder:text-zinc-400"
                required
              />
            </div>
          </div>

          {/* Expense Date */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-1">
              Tarikh (तारीख़ / Date)
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-[14px] border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-semibold text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all cursor-pointer"
              required
            />
          </div>
        </div>

        {/* 4. Optional Extra Remark */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            Note / Parchi No. (वैकल्पिक विवरण)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="उदा: Parchi #12, GPay, Cash, etc."
            className="w-full h-9 px-3 rounded-[12px] border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 text-xs text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* Submit & Cancel Buttons */}
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
            disabled={isSubmitting || parsedAmount <= 0 || !recipientName.trim() || !reason.trim()}
            className="flex-[2] py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold active:scale-[0.98] transition-all text-center hover:opacity-90 shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            <IconReceipt size={15} />
            <span>
              {isSubmitting
                ? 'Saving...'
                : parsedAmount > 0
                ? `Kharch Likhein (- ${formatCurrency(parsedAmount)})`
                : 'Kharch Likhein (Record Expense)'}
            </span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
