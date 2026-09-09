import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';
import { SearchCommand } from '../common/SearchCommand';
import { QuickActionSheet } from '../transactions/QuickActionSheet';
import { PurchaseModal } from '../transactions/PurchaseModal';
import { SaleModal } from '../transactions/SaleModal';
import { StockAdjustmentModal } from '../transactions/StockAdjustmentModal';
import { ItemModal } from '../transactions/ItemModal';
import {
  Search,
  Plus,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { ScrapItem } from '../../types';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, resolvedTheme, setTheme, logoSrc } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Modals state
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [activeItemForPurchase, setActiveItemForPurchase] = useState<ScrapItem | null>(null);
  const [activeItemForSale, setActiveItemForSale] = useState<ScrapItem | null>(null);

  // Data refresh counter — increments on every successful transaction so child pages re-fetch
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Global keyboard shortcut for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefreshData = () => {
    queryClient.invalidateQueries();
    setRefreshCounter((c) => c + 1);
  };

  const handleActionSelect = (
    action: 'purchase' | 'sale' | 'adjustment' | 'item' | string
  ) => {
    if (action === 'purchase') setIsPurchaseOpen(true);
    if (action === 'sale') setIsSaleOpen(true);
    if (action === 'adjustment') setIsAdjustmentOpen(true);
    if (action === 'item') setIsItemOpen(true);
  };

  const handleSearchResultClick = (type: 'item' | 'party' | 'purchase' | 'sale') => {
    if (type === 'item') navigate('/inventory');
    if (type === 'purchase') navigate('/purchases');
    if (type === 'sale') navigate('/sales');
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col md:flex-row antialiased">
      {/* Desktop Left Sidebar */}
      <Sidebar
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-32 md:pb-8 relative">
        {/* iOS Top Ambient Fade Overlay (top above top screen like exact iPhone) */}
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-40 pointer-events-none h-[max(0.75rem,env(safe-area-inset-top,0px))] bg-gradient-to-b from-white/90 to-transparent dark:from-black/90 select-none"
          aria-hidden="true"
        />

        {/* Mobile Sticky Top Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pb-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <img
              src={logoSrc}
              alt="Logo"
              className="w-7 h-7 object-contain shrink-0 icon-press"
            />
            <span className="text-sm font-extrabold text-black dark:text-white tracking-tight font-sans">
              Raseed Traders
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Quick theme cycle button for mobile */}
            <button
              type="button"
              onClick={cycleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 icon-press"
              title={`Theme: ${theme}`}
            >
              {theme === 'system' ? (
                <Laptop className="w-4 h-4" />
              ) : resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 icon-press"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsQuickActionOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold shadow-xs btn-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </header>

        {/* Page Inner Viewport */}
        <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Outlet
            context={{
              openPurchase: (item?: ScrapItem) => {
                setActiveItemForPurchase(item || null);
                setIsPurchaseOpen(true);
              },
              openSale: (item?: ScrapItem) => {
                setActiveItemForSale(item || null);
                setIsSaleOpen(true);
              },
              openAdjustment: () => setIsAdjustmentOpen(true),
              openItem: () => setIsItemOpen(true),
              refreshCounter,
            }}
          />
        </div>

        {/* Proper Minimal Functional Page Footer (No Nav Links) */}
        <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 py-4 px-4 md:px-6 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-1.5 text-center">
            <div className="flex items-center justify-center space-x-2">
              <img src={logoSrc} alt="Logo" className="w-4 h-4 object-contain icon-press" />
              <span className="font-bold text-black dark:text-white">Raseed Traders</span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                Behind Masjid, Bus Stand, Lakhnadon 480886
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-center gap-x-2">
              <span>
                Mob:{' '}
                <a
                  href="tel:+917440619649"
                  className="text-black dark:text-white hover:underline font-semibold"
                >
                  +91 744 061 9649
                </a>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span>All data saved locally</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileTabBar />

      {/* Global Search Dialog */}
      <SearchCommand
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAction={handleSearchResultClick}
      />

      {/* Quick Action Sheet */}
      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleActionSelect}
      />

      {/* Transaction Modals */}
      <PurchaseModal
        isOpen={isPurchaseOpen}
        onClose={() => {
          setIsPurchaseOpen(false);
          setActiveItemForPurchase(null);
        }}
        initialItem={activeItemForPurchase}
        onSuccess={handleRefreshData}
      />

      <SaleModal
        isOpen={isSaleOpen}
        onClose={() => {
          setIsSaleOpen(false);
          setActiveItemForSale(null);
        }}
        initialItem={activeItemForSale}
        onSuccess={handleRefreshData}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        onSuccess={handleRefreshData}
      />

      <ItemModal
        isOpen={isItemOpen}
        onClose={() => setIsItemOpen(false)}
        onSuccess={handleRefreshData}
      />
    </div>
  );
};
