import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  TrendingUp,
  Calculator,
  Settings as SettingsIcon,
} from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const tabs = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/purchases', label: 'Buy', icon: ShoppingBag },
    { to: '/inventory', label: 'Stock', icon: Package },
    { to: '/sales', label: 'Sell', icon: TrendingUp },
    { to: '/analytics', label: 'Hisab', icon: Calculator },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-0 right-0 z-40 px-3 pointer-events-none select-none">
      <div className="pointer-events-auto max-w-md mx-auto h-[62px] p-1.5 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6),0_2px_8px_rgba(0,0,0,0.3)] flex items-center justify-between gap-1 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `group relative flex flex-col items-center justify-center flex-1 h-full py-1 rounded-full transition-all duration-200 active:scale-[0.88] ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white active:bg-zinc-100/70 dark:active:bg-zinc-800/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[17px] h-[17px] transition-transform duration-200 ${
                      isActive ? 'stroke-[2.4] scale-105' : 'stroke-[1.9]'
                    }`}
                  />
                  <span
                    className={`text-[10px] leading-tight mt-0.5 tracking-tight truncate max-w-full text-center ${
                      isActive ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
