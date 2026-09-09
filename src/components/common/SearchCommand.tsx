import React, { useState, useEffect } from 'react';
import { Search, X, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import { ScrapItem, Party, Purchase, Sale } from '../../types';
import { formatCurrency, formatQuantity } from '../../utils/formatters';

interface SearchCommandProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: 'item' | 'party' | 'purchase' | 'sale', id: string) => void;
}

export const SearchCommand: React.FC<SearchCommandProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    items: ScrapItem[];
    parties: Party[];
    purchases: Purchase[];
    sales: Sale[];
  }>({ items: [], parties: [], purchases: [], sales: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ items: [], parties: [], purchases: [], sales: [] });
      return;
    }
    const res = api.search(query);
    setResults(res);
  }, [query]);

  // Reset search state on every open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ items: [], parties: [], purchases: [], sales: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasAnyResults =
    results.items.length > 0 ||
    results.purchases.length > 0 ||
    results.sales.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-950 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search material in English or Hindi (LOHA, लोहा, TEEN...), bill numbers..."
            autoFocus
            className="w-full text-sm bg-transparent outline-none placeholder:text-zinc-400 text-black dark:text-white"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-400 hover:text-black dark:hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-2 divide-y divide-zinc-100 dark:divide-zinc-900 text-xs">
          {!query && (
            <div className="p-6 text-center text-zinc-400">
              Type to search any scrap material, bill number, or transaction...
            </div>
          )}

          {query && !hasAnyResults && (
            <div className="p-6 text-center text-zinc-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Items Result Group */}
          {results.items.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                Scrap Materials (सामग्री)
              </div>
              {results.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectAction('item', item.id);
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Package className="w-4 h-4 text-zinc-400" />
                    <div>
                      <span className="font-bold text-black dark:text-white">{item.name}</span>
                      <span className="ml-1.5 text-zinc-500">· {item.local_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black dark:text-white">
                      {formatQuantity(item.current_stock, item.default_unit)}
                    </div>
                    <div className="text-[10px] text-zinc-500">Current Stock</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Purchases Result Group */}
          {results.purchases.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                Purchases (खरीदी)
              </div>
              {results.purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  onClick={() => {
                    onSelectAction('purchase', purchase.id);
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <ShoppingBag className="w-4 h-4 text-zinc-400" />
                    <div>
                      <span className="font-bold text-black dark:text-white">{purchase.purchase_number}</span>
                      <span className="ml-1.5 text-zinc-500">
                        {purchase.items?.map((it) => it.item_name).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black dark:text-white">{formatCurrency(purchase.total_amount)}</div>
                    <div className="text-[10px] text-zinc-500">{purchase.purchase_date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sales Result Group */}
          {results.sales.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                Sales (बिक्री)
              </div>
              {results.sales.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => {
                    onSelectAction('sale', sale.id);
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <TrendingUp className="w-4 h-4 text-zinc-400" />
                    <div>
                      <span className="font-bold text-black dark:text-white">{sale.sale_number}</span>
                      <span className="ml-1.5 text-zinc-500">
                        {sale.items?.map((it) => it.item_name).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black dark:text-white">{formatCurrency(sale.total_amount)}</div>
                    <div className="text-[10px] text-zinc-500">{sale.sale_date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
