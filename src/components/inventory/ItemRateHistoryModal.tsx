import React, { useState, useEffect } from 'react';
import {
  Tag,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Clock,
  User,
  CreditCard,
  Layers,
  ArrowDownLeft,
  TrendingUp,
  Package,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ItemRateHistoryModalProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPurchase?: (item: ScrapItem) => void;
  onRecordSale?: (item: ScrapItem) => void;
}

type TabType = 'ALL' | 'PURCHASES' | 'SALES';

export const ItemRateHistoryModal: React.FC<ItemRateHistoryModalProps> = ({
  itemId,
  isOpen,
  onClose,
  onRecordPurchase,
  onRecordSale,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [historyData, setHistoryData] = useState<{
    item?: ScrapItem;
    purchases: Array<{
      purchase_id: string;
      purchase_number: string;
      purchase_date: string;
      created_at: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      party_name: string;
    }>;
    sales: Array<{
      sale_id: string;
      sale_number: string;
      sale_date: string;
      created_at: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      party_name: string;
      remaining_stock: number;
    }>;
    movements: Array<{
      id: string;
      type: 'PURCHASE' | 'SALE';
      date: string;
      created_at: string;
      reference_number: string;
      party_name: string;
      rate: number;
      quantity: number;
      amount: number;
      unit: string;
      remaining_stock: number;
    }>;
    stats: {
      currentStock: number;
      latestPurchaseRate: number | null;
      highestPurchaseRate: number | null;
      lowestPurchaseRate: number | null;
      averageCost: number;
      averagePurchaseRate: number;
      totalQuantityPurchased: number;
      totalAmountPurchased: number;
      distinctRates: Array<{
        rate: number;
        totalQty: number;
        totalAmount: number;
        count: number;
      }>;
      distinctPurchaseRates: Array<{
        rate: number;
        totalQty: number;
        totalAmount: number;
        count: number;
      }>;
      latestSaleRate: number | null;
      highestSaleRate: number | null;
      lowestSaleRate: number | null;
      averageSaleRate: number;
      totalQuantitySold: number;
      totalAmountSold: number;
      distinctSaleRates: Array<{
        rate: number;
        totalQty: number;
        totalAmount: number;
        count: number;
      }>;
    };
  } | null>(null);

  useEffect(() => {
    if (isOpen && itemId) {
      loadHistory(itemId);
    } else {
      setHistoryData(null);
      setActiveTab('ALL');
    }
  }, [isOpen, itemId]);

  const loadHistory = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getItemRateHistory(id);
      setHistoryData(res as any);
    } catch (err) {
      console.error('Failed to load item rate history', err);
    } finally {
      setLoading(false);
    }
  };

  const item = historyData?.item;
  const stats = historyData?.stats;
  const purchases = historyData?.purchases || [];
  const sales = historyData?.sales || [];
  const movements = historyData?.movements || [];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `${item.name} — ${item.local_name}` : 'Material Ledger & Rate History'}
      subtitle={
        item
          ? `Complete purchase, sale & stock ledger (मापने की इकाई: ${item.default_unit})`
          : 'Scrap spot rate and stock movement log'
      }
      maxWidth="max-w-3xl"
    >
      <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[80vh]">
        {loading ? (
          <div className="py-14 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
            <div className="w-7 h-7 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>सामग्री का खाता व इतिहास लोड हो रहा है (Loading item ledger & rate history)...</p>
          </div>
        ) : !item ? (
          <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
            सामग्री नहीं मिली (Item details not found).
          </div>
        ) : (
          <>
            {/* Quick Header Bar with Stock & Instant Buy/Sell Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono font-extrabold text-xs">
                  {item.default_unit}
                </span>
                <div>
                  <div className="font-extrabold text-sm sm:text-base text-black dark:text-white tracking-tight flex items-center gap-2">
                    <span>{item.name}</span>
                    <span className="text-zinc-500 font-medium text-xs sm:text-sm">({item.local_name})</span>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span>Current Stock (वर्तमान स्टॉक):</span>
                    <span className="font-bold text-black dark:text-white font-mono">
                      {item.current_stock.toLocaleString('en-IN')} {item.default_unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {onRecordPurchase && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRecordPurchase(item);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buy Samaan (खरीदें)</span>
                  </button>
                )}

                {onRecordSale && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRecordSale(item);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 btn-press shadow-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Sell Samaan (बेचें)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Comprehensive KPI Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* 1. Live Current Stock */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Package className="w-3 h-3 text-zinc-400" />
                  <span>Current Stock</span>
                </div>
                <div className="mt-1 font-extrabold text-sm sm:text-base text-black dark:text-white font-mono">
                  {item.current_stock.toLocaleString('en-IN')}{' '}
                  <span className="text-[10px] font-normal text-zinc-400">{item.default_unit}</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">गोदाम में उपलब्ध</div>
              </div>

              {/* 2. Total Bought (Qty & ₹) */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-zinc-400" />
                  <span>Total Bought</span>
                </div>
                <div className="mt-1 font-extrabold text-sm sm:text-base text-black dark:text-white font-mono">
                  {stats?.totalQuantityPurchased.toLocaleString('en-IN') || 0}{' '}
                  <span className="text-[10px] font-normal text-zinc-400">{item.default_unit}</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 font-mono font-medium">
                  {formatCurrency(stats?.totalAmountPurchased || 0)}
                </div>
              </div>

              {/* 3. Weighted Average Buy Rate */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                  Avg Buy Rate
                </div>
                <div className="mt-1 font-extrabold text-sm sm:text-base text-black dark:text-white font-mono">
                  {stats?.averagePurchaseRate ? formatCurrency(stats.averagePurchaseRate) : '₹0.00'}
                  <span className="text-[10px] font-normal text-zinc-400">/{item.default_unit}</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">औसत खरीद भाव</div>
              </div>

              {/* 4. Total Sold (Qty & ₹) */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-zinc-400" />
                  <span>Total Sold</span>
                </div>
                <div className="mt-1 font-extrabold text-sm sm:text-base text-black dark:text-white font-mono">
                  {stats?.totalQuantitySold.toLocaleString('en-IN') || 0}{' '}
                  <span className="text-[10px] font-normal text-zinc-400">{item.default_unit}</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 font-mono font-medium">
                  {formatCurrency(stats?.totalAmountSold || 0)}
                </div>
              </div>

              {/* 5. Weighted Average Sale Rate */}
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                  Avg Sell Rate
                </div>
                <div className="mt-1 font-extrabold text-sm sm:text-base text-black dark:text-white font-mono">
                  {stats?.averageSaleRate ? formatCurrency(stats.averageSaleRate) : '₹0.00'}
                  <span className="text-[10px] font-normal text-zinc-400">/{item.default_unit}</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">औसत बिक्री भाव</div>
              </div>
            </div>

            {/* Distinct Spot Rates Summary Chips (shows each purchase rate without overwriting) */}
            {stats && stats.distinctPurchaseRates.length > 0 && (
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Purchases by Rate (विभिन्न दरों पर खरीद का विवरण):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.distinctPurchaseRates.map((rg) => (
                    <div
                      key={rg.rate}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs shadow-xs"
                    >
                      <span className="font-extrabold text-black dark:text-white font-mono">
                        {formatCurrency(rg.rate)}/{item.default_unit}
                      </span>
                      <span className="ml-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        ({rg.totalQty.toLocaleString('en-IN')} {item.default_unit} · {rg.count} bill{rg.count > 1 ? 's' : ''})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Tab Switcher */}
            <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-colors border-b-2 ${
                  activeTab === 'ALL'
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Movements (सम्पूर्ण खाता लेज़र)</span>
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 font-mono">
                  {movements.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PURCHASES')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-colors border-b-2 ${
                  activeTab === 'PURCHASES'
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Purchases (खरीद)</span>
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 font-mono">
                  {purchases.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SALES')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-colors border-b-2 ${
                  activeTab === 'SALES'
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Sales (बिक्री)</span>
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 font-mono">
                  {sales.length}
                </span>
              </button>
            </div>

            {/* TAB CONTENT 1: ALL MOVEMENTS / COMPLETE LEDGER */}
            {activeTab === 'ALL' && (
              <div className="space-y-2">
                {movements.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 text-center space-y-2">
                    <History className="w-7 h-7 mx-auto text-zinc-400" />
                    <div className="font-semibold text-xs text-black dark:text-white">
                      इस सामग्री का कोई खरीद या बिक्री लेज़र दर्ज नहीं है।
                    </div>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      जैसे ही आप इस सामग्री की खरीद या बिक्री दर्ज करेंगे, उसका सम्पूर्ण लेज़र व शेष स्टॉक (Remaining Stock) यहाँ दिखाई देगा।
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                    {movements.map((m, idx) => {
                      const isPurchase = m.type === 'PURCHASE';
                      return (
                        <div
                          key={m.id + '-' + idx}
                          className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Type Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider ${
                                  isPurchase
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                                    : 'border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                }`}
                              >
                                {isPurchase ? '↓ Buy (खरीद)' : '↑ Sale (बिक्री)'}
                              </span>

                              <span className="font-bold text-xs text-black dark:text-white font-mono">
                                {m.reference_number}
                              </span>

                              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 inline" />
                                {formatDate(m.date)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-zinc-400" />
                                {m.party_name}
                              </span>
                            </div>
                          </div>

                          {/* Quantities, Rates, Amount and Running Remaining Stock */}
                          <div className="flex flex-wrap sm:flex-col sm:items-end justify-between items-center border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-900 gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Rate:</span>
                              <span className="font-extrabold text-xs sm:text-sm text-black dark:text-white font-mono">
                                {formatCurrency(m.rate)}/{m.unit}
                              </span>
                            </div>

                            <div className="text-xs text-zinc-500">
                              Qty:{' '}
                              <b
                                className={`font-mono ${
                                  isPurchase ? 'text-black dark:text-white' : 'text-black dark:text-white'
                                }`}
                              >
                                {isPurchase ? '+' : '-'}
                                {m.quantity.toLocaleString('en-IN')} {m.unit}
                              </b>{' '}
                              · Total: <b className="text-black dark:text-white font-mono">{formatCurrency(m.amount)}</b>
                            </div>

                            {/* Remaining Stock Badge */}
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
                              <span className="text-zinc-500 text-[10px]">Remaining Stock (शेष):</span>
                              <span className="font-extrabold text-black dark:text-white font-mono">
                                {m.remaining_stock.toLocaleString('en-IN')} {m.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: PURCHASES ONLY */}
            {activeTab === 'PURCHASES' && (
              <div className="space-y-2">
                {purchases.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 text-center space-y-2">
                    <Tag className="w-7 h-7 mx-auto text-zinc-400" />
                    <div className="font-semibold text-xs text-black dark:text-white">
                      अभी तक इस सामग्री की कोई खरीद दर्ज नहीं हुई है।
                    </div>
                    {onRecordPurchase && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onRecordPurchase(item);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 btn-press"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Purchase (खरीद दर्ज करें)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                    {purchases.map((b, idx) => (
                      <div
                        key={b.purchase_id + '-' + idx}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-black dark:text-white font-mono">
                              {b.purchase_number}
                            </span>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 inline" />
                              {formatDate(b.purchase_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-zinc-400" />
                              {b.party_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-1.5 sm:pt-0 border-zinc-100 dark:border-zinc-900">
                          <div className="inline-flex items-baseline gap-1">
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase">Rate:</span>
                            <span className="font-extrabold text-sm sm:text-base text-black dark:text-white font-mono">
                              {formatCurrency(b.rate)}
                            </span>
                            <span className="text-[10px] text-zinc-400">/{b.unit}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Qty: <b className="text-black dark:text-white font-mono">{b.quantity.toLocaleString('en-IN')} {b.unit}</b> · Total: <b className="text-black dark:text-white font-mono">{formatCurrency(b.amount)}</b>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: SALES ONLY */}
            {activeTab === 'SALES' && (
              <div className="space-y-2">
                {sales.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 text-center space-y-2">
                    <TrendingUp className="w-7 h-7 mx-auto text-zinc-400" />
                    <div className="font-semibold text-xs text-black dark:text-white">
                      अभी तक इस सामग्री की कोई बिक्री दर्ज नहीं हुई है।
                    </div>
                    {onRecordSale && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onRecordSale(item);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 btn-press"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Record Sale (बिक्री दर्ज करें)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                    {sales.map((s, idx) => (
                      <div
                        key={s.sale_id + '-' + idx}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-black dark:text-white font-mono">
                              {s.sale_number}
                            </span>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 inline" />
                              {formatDate(s.sale_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-zinc-400" />
                              {s.party_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end justify-between border-t sm:border-t-0 pt-1.5 sm:pt-0 border-zinc-100 dark:border-zinc-900 gap-1">
                          <div className="inline-flex items-baseline gap-1">
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase">Sale Rate:</span>
                            <span className="font-extrabold text-sm sm:text-base text-black dark:text-white font-mono">
                              {formatCurrency(s.rate)}
                            </span>
                            <span className="text-[10px] text-zinc-400">/{s.unit}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Sold Qty: <b className="text-black dark:text-white font-mono">{s.quantity.toLocaleString('en-IN')} {s.unit}</b> · Amount: <b className="text-black dark:text-white font-mono">{formatCurrency(s.amount)}</b>
                          </div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px]">
                            <span className="text-zinc-500">Remaining Stock (शेष):</span>
                            <span className="font-bold text-black dark:text-white font-mono">
                              {s.remaining_stock.toLocaleString('en-IN')} {s.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
};
