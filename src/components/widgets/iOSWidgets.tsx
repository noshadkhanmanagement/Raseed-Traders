import React from 'react';
import {
  NavBuy,
  NavSell,
  NavStock,
  NavAnalytics,
  IconChevron,
} from '../common/Icons';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ScrapItem } from '../../types';

interface WidgetCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  children,
  className = '',
  onClick,
  title,
}) => {
  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative rounded-[26px] p-4 sm:p-5 backdrop-blur-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer active:scale-[0.975]' : ''
      } ${className}`}
    >
      {/* Specular Top Reflection Line */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/35 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

interface MetricWidgetProps {
  label: string;
  hindiLabel: string;
  value: string | number;
  unit?: string;
  secondaryText?: string;
  icon: 'buy' | 'sell' | 'stock' | 'hisab';
  badgeColor?: string;
  onClick?: () => void;
  actionText?: string;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  label,
  hindiLabel,
  value,
  unit,
  secondaryText,
  icon,
  onClick,
  actionText,
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'buy':
        return <NavBuy size={20} className="text-black dark:text-white" />;
      case 'sell':
        return <NavSell size={20} className="text-black dark:text-white" />;
      case 'stock':
        return <NavStock size={20} className="text-black dark:text-white" />;
      case 'hisab':
        return <NavAnalytics size={20} className="text-black dark:text-white" />;
    }
  };

  return (
    <WidgetCard onClick={onClick} className="flex flex-col justify-between min-h-[140px] group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            {hindiLabel}
          </p>
        </div>
        <div className="p-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/50 dark:border-zinc-700/50 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
          {renderIcon()}
        </div>
      </div>

      {/* Main Metric Figure */}
      <div className="mt-3">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white font-sans">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
              {unit}
            </span>
          )}
        </div>

        {/* Footer info / disclosure */}
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="truncate font-medium">{secondaryText || 'Touch to inspect'}</span>
          {actionText && (
            <span className="inline-flex items-center gap-0.5 font-bold text-black dark:text-white group-hover:translate-x-0.5 transition-transform">
              <span>{actionText}</span>
              <IconChevron size={12} className="rotate-270" />
            </span>
          )}
        </div>
      </div>
    </WidgetCard>
  );
};

interface LiveBhaavTickerProps {
  items: ScrapItem[];
  onSelectItem: (item: ScrapItem) => void;
  onViewAllStock: () => void;
}

export const LiveBhaavTicker: React.FC<LiveBhaavTickerProps> = ({
  items,
  onSelectItem,
  onViewAllStock,
}) => {
  // Highlight top traded materials
  const displayItems = items.slice(0, 8);

  return (
    <WidgetCard className="space-y-3.5">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
              Live Bhaav Ticker (चालू मंडी भाव)
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Lakhnadon Material Catalog — Tap for Trade History
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAllStock}
          className="text-[11px] font-bold text-black dark:text-white hover:underline flex items-center gap-0.5"
        >
          <span>All 25 Items</span>
          <IconChevron size={12} className="rotate-270" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {displayItems.map((item) => {
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all cursor-pointer active:scale-[0.96] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-black dark:text-white truncate">
                  {item.name}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-700 dark:text-zinc-300">
                  {item.default_unit}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {item.local_name}
              </div>

              <div className="mt-2 pt-1.5 border-t border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Kharidi:</span>
                <span className="text-xs font-black text-black dark:text-white tabular-nums font-sans">
                  ₹{item.default_purchase_rate || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
};

interface RecentActivityItem {
  id: string;
  type: 'purchase' | 'sale';
  billNumber: string;
  partyName: string;
  date: string;
  amount: number;
  weight: number;
  itemsSummary: string;
  onClick: () => void;
}

interface RecentActivityFeedProps {
  activities: RecentActivityItem[];
  onViewAllPurchases: () => void;
  onViewAllSales: () => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  onViewAllPurchases,
  onViewAllSales,
}) => {
  return (
    <WidgetCard className="space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
            Recent Trades Feed (हालिया लेन-देन)
          </h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Latest inward & outward entries recorded today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewAllPurchases}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
          >
            All Buy
          </button>
          <button
            type="button"
            onClick={onViewAllSales}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
          >
            All Sell
          </button>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
          No transactions recorded today yet (आज कोई लेन-देन दर्ज नहीं है).
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {activities.slice(0, 6).map((act) => {
            const isBuy = act.type === 'purchase';
            return (
              <div
                key={act.id}
                onClick={act.onClick}
                className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 -mx-2 px-2 rounded-xl transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isBuy
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isBuy ? <NavBuy size={16} /> : <NavSell size={16} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-black dark:text-white truncate">
                        {act.partyName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 tabular-nums font-sans">
                        {act.billNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {act.itemsSummary}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-black dark:text-white tabular-nums font-sans">
                    {formatCurrency(act.amount)}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    {act.weight > 0 ? `${act.weight} KG` : formatDate(act.date)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
};
