import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Plus,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  History,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../services/api';
import { ScrapItem, Purchase, Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ItemRateHistoryModal } from '../components/inventory/ItemRateHistoryModal';
import { ItemModal } from '../components/transactions/ItemModal';

interface ContextType {
  openPurchase: () => void;
  openSale: () => void;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { openPurchase, openSale } = useOutletContext<ContextType>();

  const [items, setItems] = useState<ScrapItem[]>([]);
  const [todayPurchases, setTodayPurchases] = useState<Purchase[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);

  // Item Rate History & Custom Item States
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'ZERO_STOCK'>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const [allItems, purchasesData, salesData] = await Promise.all([
        api.getItems(),
        api.getPurchases(),
        api.getSales(),
      ]);

      setItems(allItems);
      setTodayPurchases(purchasesData.filter((p) => p.purchase_date === todayStr && p.status === 'FINAL'));
      setTodaySales(salesData.filter((s) => s.sale_date === todayStr && s.status === 'FINAL'));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Roz Kitna Khareeda
  const todayPurchasedAmount = todayPurchases.reduce((sum, p) => sum + p.total_amount, 0);
  const todayPurchasedWeight = todayPurchases.reduce(
    (sum, p) => sum + (p.total_weight ?? (p.items?.reduce((s, it) => s + it.quantity, 0) || 0)),
    0
  );

  // 2. Kitna Stock Hai
  const totalStockWeight = items.reduce((sum, it) => sum + Math.max(0, it.current_stock), 0);
  const stockedItemsCount = items.filter((it) => it.current_stock > 0).length;

  // 3. Kitna Becha
  const todaySoldAmount = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
  const todaySoldWeight = todaySales.reduce(
    (sum, s) => sum + (s.total_weight ?? (s.items?.reduce((x, it) => x + it.quantity, 0) || 0)),
    0
  );

  // Filter items based on search query and stock filter
  const filteredItems = items.filter((it) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      it.name.toLowerCase().includes(q) ||
      it.local_name.toLowerCase().includes(q);
    if (!matchesQuery) return false;

    if (stockFilter === 'IN_STOCK') return it.current_stock > 0;
    if (stockFilter === 'ZERO_STOCK') return it.current_stock <= 0;
    return true;
  });

  const handleOpenHistory = (item: ScrapItem) => {
    setSelectedHistoryItemId(item.id);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Top Header & Fast Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white tracking-tight">
            Raseed Traders
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Behind Masjid, Bus Stand, Lakhnadon 480886 · Mob:{' '}
            <a href="tel:+917440619649" className="text-black dark:text-white font-medium hover:underline">
              +91 744 061 9649
            </a>{' '}
            · {formatDate(todayStr)}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={openPurchase}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Roz Ki Kharidi (Buy)</span>
          </button>
          <button
            type="button"
            onClick={openSale}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 btn-press shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Roz Ki Bikri (Sell)</span>
          </button>
        </div>
      </div>

      {/* The 3 Core Requirements in Big iOS B&W Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Roz Kitna Khareeda */}
        <div
          onClick={() => navigate('/purchases')}
          className="cursor-pointer rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 card-press"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Roz Kitna Khareeda (आज की खरीदी)
            </span>
            <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white icon-press">
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold text-black dark:text-white">
              {formatCurrency(todayPurchasedAmount)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Total Weight: {todayPurchasedWeight} KG</span>
              <span className="underline flex items-center gap-0.5 text-zinc-500 hover:text-black dark:hover:text-white">
                View Purchases <ArrowRight className="w-3 h-3 inline" />
              </span>
            </div>
          </div>
        </div>

        {/* 2. Kitna Stock Hai */}
        <div
          onClick={() => navigate('/inventory')}
          className="cursor-pointer rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 card-press"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Kitna Stock Hai (वर्तमान कुल स्टॉक)
            </span>
            <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white icon-press">
              <Package className="w-5 h-5" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold text-black dark:text-white">
              {totalStockWeight} <span className="text-lg font-bold text-zinc-500">KG</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">{stockedItemsCount} materials in stock</span>
              <span className="underline flex items-center gap-0.5 text-zinc-500 hover:text-black dark:hover:text-white">
                View Stock <ArrowRight className="w-3 h-3 inline" />
              </span>
            </div>
          </div>
        </div>

        {/* 3. Kitna Becha */}
        <div
          onClick={() => navigate('/sales')}
          className="cursor-pointer rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 card-press"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Kitna Becha (आज की कुल बिक्री)
            </span>
            <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white icon-press">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold text-black dark:text-white">
              {formatCurrency(todaySoldAmount)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Total Sold: {todaySoldWeight} KG</span>
              <span className="underline flex items-center gap-0.5 text-zinc-500 hover:text-black dark:hover:text-white">
                View Sales <ArrowRight className="w-3 h-3 inline" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Scrap Materials Catalog & Rate History Matrix (All 25 + Custom Items) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs space-y-4 p-4 sm:p-5">
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black">
                <Tag className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-black dark:text-white tracking-tight">
                All Scrap Materials & Bhaav History (सभी सामग्रियां व खरीद भाव)
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Touch any material to view all past purchase rates & spot price logs (दर व खरीद इतिहास देखने के लिए सामग्री पर टच करें)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Material (नया सामान)</span>
            </button>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:underline flex items-center gap-1 ml-1"
            >
              <span>Manage Inventory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Search Bar & Filter Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials (सामग्री खोजें, उदा: Loha, Teen, Tamba, Plastic...)"
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 text-xs font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                stockFilter === 'ALL'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              In Stock ({items.filter((i) => i.current_stock > 0).length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('ZERO_STOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                stockFilter === 'ZERO_STOCK'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              0 Stock ({items.filter((i) => i.current_stock <= 0).length})
            </button>
          </div>
        </div>

        {/* Materials Grid (All 25 + Custom) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No scrap materials matched your filter (सामग्री नहीं मिली).
            </div>
          ) : (
            filteredItems.map((it, idx) => {
              const hasStock = it.current_stock > 0;
              return (
                <div
                  key={it.id}
                  onClick={() => handleOpenHistory(it)}
                  className="group relative p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-black dark:hover:border-white shadow-xs cursor-pointer transition-all card-press flex flex-col justify-between"
                  title="Touch to view purchase rates & history (भाव इतिहास देखें)"
                >
                  <div>
                    {/* Top Row: Unit badge & In-stock status */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-mono">
                        {it.default_unit}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          hasStock
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {hasStock ? 'In Stock (उपलब्ध)' : '0 Stock'}
                      </span>
                    </div>

                    {/* Material Names */}
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-sm text-black dark:text-white tracking-tight flex items-baseline gap-1.5">
                        <span className="text-zinc-400 text-xs font-mono font-normal">#{idx + 1}</span>
                        <span className="truncate">{it.name}</span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
                        {it.local_name}
                      </div>
                    </div>
                  </div>

                  {/* Stock Count & Click Action Prompt */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Stock</div>
                      <div className="text-base font-extrabold text-black dark:text-white font-mono">
                        {it.current_stock.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal text-zinc-400">{it.default_unit}</span>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                      <History className="w-3.5 h-3.5" />
                      <span>Bhaav Log →</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Today's Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Purchases */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white">
                <ArrowDownLeft className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-black dark:text-white">
                Today's Purchases (आज की खरीदी)
              </h3>
            </div>
            <Link to="/purchases" className="text-xs font-medium text-zinc-500 hover:text-black dark:hover:text-white">
              All ({todayPurchases.length}) →
            </Link>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900 mt-2">
            {todayPurchases.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Aaj abhi tak koi khareedi nahi hui. (Buy par click karke add karein)
              </div>
            ) : (
              todayPurchases.slice(0, 5).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-black dark:text-white">
                      {p.items?.map((it) => `${it.item_name} (${it.quantity}${it.unit})`).join(', ') || 'Purchase'}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {p.purchase_number} {p.party_name ? `· ${p.party_name}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black dark:text-white">
                      {formatCurrency(p.total_amount)}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {p.total_weight ?? (p.items?.reduce((s, it) => s + it.quantity, 0) || 0)} KG
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Sales */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-black dark:text-white">
                Today's Sales (आज की बिक्री)
              </h3>
            </div>
            <Link to="/sales" className="text-xs font-medium text-zinc-500 hover:text-black dark:hover:text-white">
              All ({todaySales.length}) →
            </Link>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900 mt-2">
            {todaySales.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Aaj abhi tak koi bikri nahi hui. (Sell par click karke add karein)
              </div>
            ) : (
              todaySales.slice(0, 5).map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-black dark:text-white">
                      {s.items?.map((it) => `${it.item_name} (${it.quantity}${it.unit})`).join(', ') || 'Sale'}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {s.sale_number} {s.party_name ? `· ${s.party_name}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black dark:text-white">
                      {formatCurrency(s.total_amount)}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {s.total_weight ?? (s.items?.reduce((x, it) => x + it.quantity, 0) || 0)} KG
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Item Rate History Modal */}
      <ItemRateHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedHistoryItemId(null);
        }}
        itemId={selectedHistoryItemId}
        onRecordPurchase={() => openPurchase()}
      />

      {/* Add Custom Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
