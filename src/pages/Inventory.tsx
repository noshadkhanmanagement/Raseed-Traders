import React, { useState, useEffect } from 'react';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { StockAdjustmentModal } from '../components/transactions/StockAdjustmentModal';
import { ItemModal } from '../components/transactions/ItemModal';
import { api } from '../services/api';
import { ScrapItem } from '../types';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItemToAdjust, setSelectedItemToAdjust] = useState<ScrapItem | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const allItems = await api.getItems();
      setItems(allItems);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter((it) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      it.name.toLowerCase().includes(q) ||
      it.local_name.toLowerCase().includes(q) ||
      (it.code && it.code.toLowerCase().includes(q))
    );
  });

  const totalStockQuantity = items.reduce((sum, it) => sum + Math.max(0, it.current_stock), 0);
  const inStockCount = items.filter((it) => it.current_stock > 0).length;

  const handleAdjustClick = (item?: ScrapItem) => {
    setSelectedItemToAdjust(item || null);
    setIsAdjustModalOpen(true);
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Kitna Stock Hai (स्टॉक / माल)"
        subtitle="Current scrap inventory in godown (सभी 25 सामग्रियों की कुल मात्रा)"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdjustClick()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust Stock (स्टॉक बदलें)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsItemModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Material (नया सामान)</span>
            </button>
          </div>
        }
      />

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Available Stock (कुल उपलब्ध स्टॉक)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-black dark:text-white">
            {totalStockQuantity} <span className="text-lg font-bold text-zinc-500">KG</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">Across all active scrap materials</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Items In Stock (उपलब्ध सामग्री)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-black dark:text-white">
            {inStockCount} / {items.length}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Materials currently having positive stock</div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search material name in English or Hindi (सामग्री का नाम खोजें, उदा: LOHA, लोहा, TEEN...)"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
        />
      </div>

      {/* Items List Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-5 py-3 font-semibold">Material Name (सामग्री का नाम)</th>
                <th className="px-5 py-3 font-semibold text-right">Available Stock (स्टॉक)</th>
                <th className="px-5 py-3 font-semibold text-center">Unit (इकाई)</th>
                <th className="px-5 py-3 font-semibold text-center">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    No matching scrap materials found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((it, idx) => {
                  const hasStock = it.current_stock > 0;
                  return (
                    <tr key={it.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-zinc-400">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-sm text-black dark:text-white">{it.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{it.local_name}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-base">
                        {it.current_stock}
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-zinc-500 dark:text-zinc-400">
                        {it.default_unit}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            hasStock
                              ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
                              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {hasStock ? 'In Stock (उपलब्ध)' : '0 Stock'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleAdjustClick(it)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          Adjust (अपडेट)
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedItemToAdjust(null);
        }}
        preselectedItemId={selectedItemToAdjust?.id}
        onSuccess={loadInventory}
      />

      {/* Add Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={loadInventory}
      />
    </div>
  );
};
