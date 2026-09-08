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
    { to: '/purchases', label: 'Buy (खरीद)', icon: ShoppingBag },
    { to: '/inventory', label: 'Stock', icon: Package },
    { to: '/sales', label: 'Sell (बिक्री)', icon: TrendingUp },
    { to: '/analytics', label: 'Hisab', icon: Calculator },
    { to: '/settings', label: 'Setting', icon: SettingsIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full pt-1 px-1 transition-colors icon-press ${
                  isActive
                    ? 'text-black dark:text-white font-bold'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`
              }
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              <span className="text-[9.5px] sm:text-[10px] leading-tight font-medium mt-0.5 truncate max-w-full text-center">
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
