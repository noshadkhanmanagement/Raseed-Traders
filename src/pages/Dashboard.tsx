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
} from 'lucide-react';
import { api } from '../services/api';
import { ScrapItem, Purchase, Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

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

      {/* Stock Overview Table (Kitna Stock Hai for all 25 Materials) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40">
          <div>
            <h2 className="text-sm font-bold text-black dark:text-white">
              Current Stock Snapshot (सभी 25 सामग्रियों का स्टॉक)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              English and Hindi names with exact available stock
            </p>
          </div>
          <Link
            to="/inventory"
            className="text-xs font-semibold text-black dark:text-white hover:underline flex items-center gap-1"
          >
            <span>Complete Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <th className="px-5 py-2.5 font-semibold">#</th>
                <th className="px-5 py-2.5 font-semibold">Material (सामग्री का नाम)</th>
                <th className="px-5 py-2.5 font-semibold text-right">Available Stock (स्टॉक)</th>
                <th className="px-5 py-2.5 font-semibold text-right">Unit (इकाई)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-white">
              {items.slice(0, 10).map((it, idx) => (
                <tr key={it.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="px-5 py-2.5 font-mono text-zinc-400">{idx + 1}</td>
                  <td className="px-5 py-2.5 font-medium">
                    <span className="font-bold">{it.name}</span>
                    <span className="ml-2 text-zinc-500 dark:text-zinc-400 font-normal">
                      — {it.local_name}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-sm">
                    {it.current_stock}
                  </td>
                  <td className="px-5 py-2.5 text-right text-zinc-500 dark:text-zinc-400 font-medium">
                    {it.default_unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length > 10 && (
          <div className="p-3 text-center border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
            <Link
              to="/inventory"
              className="text-xs font-semibold text-black dark:text-white hover:underline"
            >
              View all {items.length} materials in Stock →
            </Link>
          </div>
        )}
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
    </div>
  );
};
