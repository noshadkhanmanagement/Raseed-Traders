import React from 'react';
import {
  IconShoppingBag,
  IconTrendingUp,
  IconSliders,
  IconPlus,
} from '../common/Icons';
import { BottomSheet } from '../common/BottomSheet';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'purchase' | 'sale' | 'adjustment' | 'item') => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const actions = [
    {
      id: 'purchase' as const,
      label: 'Roz Ki Kharidi (Record Purchase)',
      desc: 'Record scrap purchased from supplier (खरीदी दर्ज करें)',
      icon: IconShoppingBag,
    },
    {
      id: 'sale' as const,
      label: 'Roz Ki Bikri (Record Sale)',
      desc: 'Sell scrap material to buyer (बिक्री दर्ज करें)',
      icon: IconTrendingUp,
    },
    {
      id: 'adjustment' as const,
      label: 'Stock Adjustment (स्टॉक सुधार)',
      desc: 'Update or correct available godown inventory',
      icon: IconSliders,
    },
    {
      id: 'item' as const,
      label: 'Add Custom Material (नया सामान)',
      desc: 'Add custom scrap item with English & Hindi names',
      icon: IconPlus,
    },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Actions (त्वरित कार्य)"
      subtitle="Select an action to perform immediately"
      maxWidth="max-w-md"
    >
      <div className="grid grid-cols-1 gap-2 pt-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                onClose();
                onSelectAction(act.id);
              }}
              className="flex items-center space-x-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white bg-white dark:bg-zinc-900 transition-all text-left group btn-press"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-black text-white dark:bg-white dark:text-black icon-press">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-black dark:text-white">
                  {act.label}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{act.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
