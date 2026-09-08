import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  TrendingUp,
  Package,
  Calculator,
  Settings as SettingsIcon,
  PlusCircle,
  Search,
  Sun,
  Moon,
  Laptop,
  Lock,
} from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onOpenQuickAction: () => void;
  onOpenSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenQuickAction,
  onOpenSearch,
}) => {
  const { theme, setTheme, logoSrc } = useTheme();
  const { logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard (डैशबोर्ड)', icon: LayoutDashboard },
    { to: '/purchases', label: 'Purchases (खरीदी)', icon: ShoppingBag },
    { to: '/inventory', label: 'Stock (स्टॉक)', icon: Package },
    { to: '/sales', label: 'Sales (बिक्री)', icon: TrendingUp },
    { to: '/analytics', label: 'Analytics (हिसाब-किताब)', icon: Calculator },
    { to: '/settings', label: 'Settings (सेटिंग्स)', icon: SettingsIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-black dark:text-white h-screen sticky top-0 shrink-0 select-none">
      {/* App Branding with adaptive mode logo */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center space-x-3">
        <img
          src={logoSrc}
          alt="Logo"
          className="w-9 h-9 rounded-lg object-contain shrink-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black icon-press"
        />
        <div className="min-w-0">
          <div className="text-sm font-bold text-black dark:text-white tracking-tight truncate">
            Raseed Traders
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Buy · Stock · Sell
          </div>
        </div>
      </div>

      {/* Quick Action Button & Search */}
      <div className="p-3 space-y-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onOpenQuickAction}
          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-semibold text-white bg-black dark:text-black dark:bg-white rounded-lg shadow-sm hover:opacity-90 btn-press"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.2]" />
          <span>New Entry (एंट्री करें)</span>
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between py-1.5 px-2.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 transition-colors"
        >
          <span className="flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span>Search (खोजें)...</span>
          </span>
          <kbd className="text-[10px] text-zinc-500 font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`
              }
            >
              <Icon className="w-4 h-4 stroke-[1.8]" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* 3-Way Instant Theme Mode Switcher */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">
          Theme Mode (थीम)
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => {
            const isSelected = theme === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs font-bold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {mode === 'system' && <Laptop className="w-3 h-3" />}
                {mode === 'light' && <Sun className="w-3 h-3" />}
                {mode === 'dark' && <Moon className="w-3 h-3" />}
                <span className="capitalize">{mode}</span>
              </button>
            );
          })}
        </div>

        {/* Lock / Logout App */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 mt-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors btn-press"
          title="Lock / Logout Application"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock App (लॉग आउट)</span>
        </button>
      </div>

      {/* Proper Business Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-1">
        <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate" title="Behind Masjid, Bus Stand, Lakhnadon 480886">
          Behind Masjid, Bus Stand
        </div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Lakhnadon 480886</div>
        <a
          href="tel:+917440619649"
          className="text-black dark:text-white font-medium hover:underline block text-[11px]"
        >
          +91 744 061 9649
        </a>
      </div>
    </aside>
  );
};
