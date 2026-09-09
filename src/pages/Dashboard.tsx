import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  MetricWidget,
  LiveBhaavTicker,
  RecentActivityFeed,
  WidgetCard,
} from '../components/widgets/iOSWidgets';
import {
  IconPlus,
  IconHistory,
  NavBuy,
  NavSell,
  NavStock,
  NavAnalytics,
  IconChevron,
} from '../components/common/Icons';
import { api } from '../services/api';
import { ScrapItem, Purchase, Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ItemRateHistoryModal } from '../components/inventory/ItemRateHistoryModal';
import { ItemModal } from '../components/transactions/ItemModal';
import { BottomSheet } from '../components/common/BottomSheet';
import { TransactionAdjustmentModal } from '../components/transactions/TransactionAdjustmentModal';

interface ContextType {
  openPurchase: (item?: ScrapItem) => void;
  openSale: (item?: ScrapItem) => void;
  refreshCounter?: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { openPurchase, openSale, refreshCounter } = useOutletContext<ContextType>();

  const [items, setItems] = useState<ScrapItem[]>([]);
  const [todayPurchases, setTodayPurchases] = useState<Purchase[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Transaction view / adjustment state
  const [selectedTx, setSelectedTx] = useState<{
    type: 'purchase' | 'sale';
    data: Purchase | Sale;
  } | null>(null);
  const [txToAdjust, setTxToAdjust] = useState<{
    type: 'purchase' | 'sale';
    data: Purchase | Sale;
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshCounter]);

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

  // 4. Net Balance
  const netDailyCashFlow = todaySoldAmount - todayPurchasedAmount;

  // Build Chronological Recent Trades Activity Feed
  const recentActivities = [
    ...todayPurchases.map((p) => ({
      id: `p-${p.id}`,
      type: 'purchase' as const,
      billNumber: p.purchase_number,
      partyName: p.party_name || 'Walk-in Supplier',
      date: p.purchase_date,
      amount: p.total_amount,
      weight: p.total_weight || p.items?.reduce((s, it) => s + it.quantity, 0) || 0,
      itemsSummary: p.items?.map((it) => `${it.item_name} (${it.quantity}${it.unit})`).join(', ') || 'Scrap Material',
      onClick: () => setSelectedTx({ type: 'purchase', data: p }),
    })),
    ...todaySales.map((s) => ({
      id: `s-${s.id}`,
      type: 'sale' as const,
      billNumber: s.sale_number,
      partyName: s.party_name || 'Cash Customer',
      date: s.sale_date,
      amount: s.total_amount,
      weight: s.total_weight || s.items?.reduce((x, it) => x + it.quantity, 0) || 0,
      itemsSummary: s.items?.map((it) => `${it.item_name} (${it.quantity}${it.unit})`).join(', ') || 'Scrap Material',
      onClick: () => setSelectedTx({ type: 'sale', data: s }),
    })),
  ].sort((a, b) => b.id.localeCompare(a.id));

  const handleOpenHistory = (item: ScrapItem) => {
    setSelectedHistoryItemId(item.id);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-5 page-enter">
      {/* iOS Executive Large Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Lakhnadon 480886 · {formatDate(todayStr)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight font-sans">
            Raseed Traders
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Scrap Management System (कबाड़ व्यापार प्रबंधन) ·{' '}
            <a href="tel:+917440619649" className="text-black dark:text-white font-semibold hover:underline">
              +91 744 061 9649
            </a>
          </p>
        </div>

        {/* Primary Trade Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => openPurchase()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 active:scale-[0.96] transition-all shadow-xs btn-press"
          >
            <IconPlus size={14} />
            <span>Kharidi (Buy)</span>
          </button>
          <button
            type="button"
            onClick={() => openSale()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-[0.96] transition-all shadow-xs btn-press"
          >
            <IconPlus size={14} />
            <span>Bikri (Sell)</span>
          </button>
        </div>
      </div>

      {/* 4 Core iOS 2x2 Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Widget 1: Roz Kitna Khareeda */}
        <MetricWidget
          label="Roz Kitna Khareeda"
          hindiLabel="आज की कुल खरीदी"
          value={formatCurrency(todayPurchasedAmount)}
          secondaryText={`Total Weight: ${todayPurchasedWeight} KG`}
          icon="buy"
          actionText="Buy Log"
          onClick={() => navigate('/purchases')}
        />

        {/* Widget 2: Kitna Stock Hai */}
        <MetricWidget
          label="Kitna Stock Hai"
          hindiLabel="गोदाम कुल स्टॉक"
          value={totalStockWeight}
          unit="KG"
          secondaryText={`${stockedItemsCount} materials in stock`}
          icon="stock"
          actionText="Stock"
          onClick={() => navigate('/inventory')}
        />

        {/* Widget 3: Kitna Becha */}
        <MetricWidget
          label="Kitna Becha"
          hindiLabel="आज की कुल बिक्री"
          value={formatCurrency(todaySoldAmount)}
          secondaryText={`Total Sold: ${todaySoldWeight} KG`}
          icon="sell"
          actionText="Sell Log"
          onClick={() => navigate('/sales')}
        />

        {/* Widget 4: Net Hisab (Daily Settlement) */}
        <MetricWidget
          label="Daily Net Hisab"
          hindiLabel="आज का शुद्ध संतुलन"
          value={formatCurrency(netDailyCashFlow)}
          secondaryText={netDailyCashFlow >= 0 ? 'Surplus (नफा)' : 'Investment (लागत)'}
          icon="hisab"
          actionText="Hisab"
          onClick={() => navigate('/analytics')}
        />
      </div>

      {/* 2x4 iOS Widget: Live Bhaav Ticker */}
      <LiveBhaavTicker
        items={items}
        onSelectItem={handleOpenHistory}
        onViewAllStock={() => navigate('/inventory')}
      />

      {/* Inset Grouped Widget: Recent Trades Feed */}
      <RecentActivityFeed
        activities={recentActivities}
        onViewAllPurchases={() => navigate('/purchases')}
        onViewAllSales={() => navigate('/sales')}
      />

      {/* Modal: Item Rate History */}
      {selectedHistoryItemId && (
        <ItemRateHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedHistoryItemId(null);
          }}
          itemId={selectedHistoryItemId}
        />
      )}

      {/* Modal: Create Custom Material */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Modal: Transaction Details Bottom Sheet */}
      {selectedTx && (
        <BottomSheet
          isOpen={true}
          onClose={() => setSelectedTx(null)}
          title={
            selectedTx.type === 'purchase'
              ? `Purchase Invoice (${(selectedTx.data as Purchase).purchase_number})`
              : `Sale Receipt (${(selectedTx.data as Sale).sale_number})`
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">
                  {selectedTx.type === 'purchase' ? 'Supplier (विक्रेता):' : 'Buyer (ग्राहक):'}
                </span>
                <span className="text-sm font-bold text-black dark:text-white">
                  {selectedTx.data.party_name || 'Walk-in Customer'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Date:</span>
                <span className="text-xs font-semibold text-black dark:text-white">
                  {formatDate(
                    selectedTx.type === 'purchase'
                      ? (selectedTx.data as Purchase).purchase_date
                      : (selectedTx.data as Sale).sale_date
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Total Amount:</span>
                <span className="text-base font-extrabold text-black dark:text-white font-mono">
                  {formatCurrency(selectedTx.data.total_amount)}
                </span>
              </div>
            </div>

            {/* Item Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Items Details (सामान विवरण)
              </h4>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-3">
                {selectedTx.data.items?.map((it, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-black dark:text-white">{it.item_name}</span>
                      <span className="text-[10px] text-zinc-500 block">
                        {it.quantity} {it.unit} @ ₹{it.rate}/{it.unit}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-black dark:text-white">
                      {formatCurrency(it.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTxToAdjust(selectedTx);
                  setSelectedTx(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all shadow-xs"
              >
                Adjust / Delete Bill (सुधार / हटाएं)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Modal: Transaction Adjustment & Deletion */}
      {txToAdjust && (
        <TransactionAdjustmentModal
          isOpen={true}
          onClose={() => setTxToAdjust(null)}
          type={txToAdjust.type === 'purchase' ? 'PURCHASE' : 'SALE'}
          transaction={txToAdjust.data}
          onSuccess={() => {
            setTxToAdjust(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};
