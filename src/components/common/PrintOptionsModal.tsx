import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { IconPrinter, IconCalendar, IconCheck } from './Icons';
import { getDateRangePreset, getLocalDateString } from '../../utils/formatters';

export type QuickRange = 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS';

export interface PrintConfig {
  startDate: string;
  endDate: string;
  includeSummary: boolean;
  includeExpenses: boolean;
  includeTransactions: boolean;
  includeMaterialBreakdown: boolean;
  includeSignatures: boolean;
}

interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStartDate: string;
  currentEndDate: string;
  onExecutePrint: (config: PrintConfig) => void;
}

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({
  isOpen,
  onClose,
  currentStartDate,
  currentEndDate,
  onExecutePrint,
}) => {
  const [startDate, setStartDate] = useState(currentStartDate || getLocalDateString());
  const [endDate, setEndDate] = useState(currentEndDate || getLocalDateString());
  const [activeRange, setActiveRange] = useState<QuickRange | 'CUSTOM'>('TODAY');

  // Print section toggles
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeMaterialBreakdown, setIncludeMaterialBreakdown] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);

  const applyPreset = (preset: QuickRange) => {
    const { startDate: s, endDate: e } = getDateRangePreset(preset);
    setStartDate(s);
    setEndDate(e);
    setActiveRange(preset);
  };

  const handlePrintClick = () => {
    onExecutePrint({
      startDate,
      endDate,
      includeSummary,
      includeExpenses,
      includeTransactions,
      includeMaterialBreakdown,
      includeSignatures,
    });
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Print Report Options (प्रिंट विकल्प)"
      subtitle="Select date range and sections to print with professional 1cm border"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] text-black dark:text-white">
        {/* 1. Date Range Picker Section */}
        <div className="p-3.5 rounded-[20px] border border-black/5 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/60 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-black dark:text-white">
            <IconCalendar size={15} />
            <span>Select Date Period (तारीख़ चुनें)</span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                ['TODAY', 'Today (आज)'],
                ['YESTERDAY', 'Yesterday (कल)'],
                ['THIS_MONTH', 'This Month (इस महीने)'],
                ['LAST_MONTH', 'Last Month (पिछले)'],
                ['LAST_30_DAYS', '30 Days'],
              ] as const
            ).map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                  activeRange === preset
                    ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-bold shadow-xs'
                    : 'bg-white dark:bg-zinc-800 border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                From (शुरुआत)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveRange('CUSTOM');
                }}
                className="w-full h-10 px-3 rounded-[12px] border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs font-semibold text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                To (अंतिम)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveRange('CUSTOM');
                }}
                className="w-full h-10 px-3 rounded-[12px] border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs font-semibold text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. What to Print Checklist */}
        <div className="p-3.5 rounded-[20px] border border-black/5 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/60 space-y-2.5">
          <div className="text-xs font-bold text-black dark:text-white">
            What to Print? (क्या प्रिंट करना चाहते हैं?)
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="w-4 h-4 rounded-md accent-black dark:accent-white cursor-pointer"
              />
              <span>Executive Hisaab Summary (कुल खरीदी, बिक्री, कस्टम खर्च व शुद्ध अंतर)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none">
              <input
                type="checkbox"
                checked={includeExpenses}
                onChange={(e) => setIncludeExpenses(e.target.checked)}
                className="w-4 h-4 rounded-md accent-black dark:accent-white cursor-pointer"
              />
              <span>Custom Kharcha Statement (दुकान व अन्य खर्च - Name, Reason, Amount)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none">
              <input
                type="checkbox"
                checked={includeTransactions}
                onChange={(e) => setIncludeTransactions(e.target.checked)}
                className="w-4 h-4 rounded-md accent-black dark:accent-white cursor-pointer"
              />
              <span>Detailed Transaction Bills (खरीदी व बिक्री रसीदें with 12hr Time)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none">
              <input
                type="checkbox"
                checked={includeMaterialBreakdown}
                onChange={(e) => setIncludeMaterialBreakdown(e.target.checked)}
                className="w-4 h-4 rounded-md accent-black dark:accent-white cursor-pointer"
              />
              <span>Material-wise Breakdown Table (सामग्री अनुसार खरीदी-बिक्री विवरण)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="w-4 h-4 rounded-md accent-black dark:accent-white cursor-pointer"
              />
              <span>Authorized Signatory Stamp Box (हस्ताक्षर / मुंशी बॉक्स)</span>
            </label>
          </div>
        </div>

        {/* 3. Paper & Border Notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-[12px] bg-zinc-100 dark:bg-zinc-800/60 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
          <IconCheck size={14} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            Strict 1cm border around every side of the printed page. Zero web UI artifacts, sharp high-contrast professional ink layout.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-black/10 dark:border-white/15 bg-zinc-100/80 dark:bg-zinc-800/80 text-black dark:text-white text-xs font-bold active:scale-[0.98] transition-all text-center hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel (रद्द करें)
          </button>
          <button
            type="button"
            onClick={handlePrintClick}
            className="flex-[2] py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold active:scale-[0.98] transition-all text-center hover:opacity-90 shadow-[0_2px_10px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2"
          >
            <IconPrinter size={15} />
            <span>Print Official Report (प्रिंट निकालें)</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
