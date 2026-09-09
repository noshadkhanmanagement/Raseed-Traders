import React, { useState, useEffect } from 'react';
import {
  NavStock as IconStock,
  IconAdjust,
  IconDelete,
  IconReset,
  IconAlert,
  IconCheck,
} from '../common/Icons';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem } from '../../types';

interface ItemAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedItemId?: string | null;
}

type StockAdjustMode = 'DIRECT' | 'DELTA';

export const ItemAdjustmentModal: React.FC<ItemAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedItemId,
}) => {
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State: Weight / Stock
  const [stockMode, setStockMode] = useState<StockAdjustMode>('DIRECT');
  const [directStockInput, setDirectStockInput] = useState('');
  const [deltaDirection, setDeltaDirection] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [deltaQuantityInput, setDeltaQuantityInput] = useState('');
  const [reason, setReason] = useState('');

  // Form State: Price / Rates
  const [purchaseRateInput, setPurchaseRateInput] = useState('');
  const [saleRateInput, setSaleRateInput] = useState('');

  // Option 1: Delete / Reset Counts State
  const [isConfirmingResetCounts, setIsConfirmingResetCounts] = useState(false);
  const [isResettingCounts, setIsResettingCounts] = useState(false);

  // Option 2: Complete Deletion State
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadItems();
      setIsConfirmingResetCounts(false);
      setIsConfirmingDelete(false);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, preselectedItemId]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const allItems = await api.getItems();
      setItems(allItems);
      const target = preselectedItemId || (allItems.length > 0 ? allItems[0].id : '');
      if (target) {
        setSelectedItemId(target);
        initItemFields(target, allItems);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const initItemFields = (itemId: string, itemList = items) => {
    const it = itemList.find((x) => x.id === itemId);
    if (it) {
      setDirectStockInput(String(it.current_stock ?? 0));
      setDeltaQuantityInput('');
      setDeltaDirection('ADD');
      setPurchaseRateInput(it.default_purchase_rate ? String(it.default_purchase_rate) : '');
      setSaleRateInput(it.default_sale_rate ? String(it.default_sale_rate) : '');
      setReason('');
    }
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsConfirmingDelete(false);
    setErrorMessage('');
    setSuccessMessage('');
    initItemFields(itemId);
  };

  const selectedItem = items.find((it) => it.id === selectedItemId);
  const unit = selectedItem?.default_unit || 'KG';
  const currentStock = Number(selectedItem?.current_stock || 0);

  // Compute calculated difference in stock
  let calculatedStockChange = 0;
  let computedNewStock = currentStock;

  if (stockMode === 'DIRECT') {
    const directVal = parseFloat(directStockInput);
    if (!isNaN(directVal)) {
      computedNewStock = directVal;
      calculatedStockChange = directVal - currentStock;
    }
  } else {
    const deltaVal = parseFloat(deltaQuantityInput);
    if (!isNaN(deltaVal) && deltaVal > 0) {
      calculatedStockChange = deltaDirection === 'DEDUCT' ? -deltaVal : deltaVal;
      computedNewStock = Math.max(0, currentStock + calculatedStockChange);
    }
  }

  // Handle Save (Weight + Price Adjustment)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const newPurchaseRate = parseFloat(purchaseRateInput) || 0;
      const newSaleRate = parseFloat(saleRateInput) || 0;
      const rateChanged =
        newPurchaseRate !== selectedItem.default_purchase_rate ||
        newSaleRate !== selectedItem.default_sale_rate;

      const stockChanged = Math.abs(calculatedStockChange) > 0.0001;

      // 1. If stock changed, apply stock adjustment record
      if (stockChanged) {
        await api.createStockAdjustment({
          item_id: selectedItem.id,
          quantity: calculatedStockChange,
          adjustment_type: 'MANUAL',
          reason: reason.trim() || (stockMode === 'DIRECT' ? 'Physical Stock Adjustment (कांटा मिलान)' : 'Manual Stock Correction'),
        });
      }

      // 2. If rate changed, update item master
      if (rateChanged) {
        await api.updateItem(selectedItem.id, {
          default_purchase_rate: newPurchaseRate,
          default_sale_rate: newSaleRate,
        });
      }

      setSuccessMessage('सुधार सफलता से सहेज लिया गया (Adjustments saved successfully)!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'सुधार सहेजने में समस्या आई (Error saving adjustments).');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Option 1: Reset Counts / Stock to 0
  const handleResetCounts = async () => {
    if (!selectedItem) return;
    setIsResettingCounts(true);
    setErrorMessage('');

    try {
      await api.resetItemStock(selectedItem.id);
      setSuccessMessage(`"${selectedItem.name}" का स्टॉक और गिनती 0 कर दी गई (Stock count reset to 0). सामग्री लिस्ट में सुरक्षित है।`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'स्टॉक 0 करने में समस्या आई (Error resetting stock count).');
      setIsResettingCounts(false);
    }
  };

  // Handle Option 2: Complete Deletion from Catalog
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    setErrorMessage('');

    try {
      await api.deleteItem(selectedItem.id);
      setSuccessMessage(`"${selectedItem.name}" लिस्ट से पूरी तरह हटा दिया गया (Deleted permanently from list).`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'सामग्री हटाने में समस्या आई (Error deleting material).');
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Adjustment & Deletion (सुधार व विलोपन)"
      subtitle="एक ही स्थान से वजन, भाव व सामग्री का पूर्ण प्रबंधन करें"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Status Messages */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <IconAlert size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <IconCheck size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Material Selector & Summary Banner */}
        <div className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Select Material (सामग्री चुनें)
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} — {it.local_name} ({it.default_unit})
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-black dark:bg-white text-white dark:text-black font-mono font-extrabold text-[10px]">
                  {selectedItem.default_unit}
                </span>
                <span className="font-extrabold text-black dark:text-white">
                  {selectedItem.name}{' '}
                  <span className="text-zinc-500 font-normal">({selectedItem.local_name})</span>
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-zinc-500 text-[11px]">Current Available:</span>
                <span className="font-extrabold text-sm text-black dark:text-white">
                  {currentStock.toLocaleString('en-IN')} {unit}
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 2. SECTION: WEIGHT & STOCK ADJUSTMENT */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-black dark:text-white">
                <IconStock size={16} className="text-zinc-500" />
                <span>1. Weight / Stock Adjustment (वज़न व स्टॉक सुधार)</span>
              </div>
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-[11px]">
                <button
                  type="button"
                  onClick={() => setStockMode('DIRECT')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                    stockMode === 'DIRECT'
                      ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Direct Set (सीधा वज़न)
                </button>
                <button
                  type="button"
                  onClick={() => setStockMode('DELTA')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                    stockMode === 'DELTA'
                      ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  +/- Quick (जोड़ें/घटाएं)
                </button>
              </div>
            </div>

            {stockMode === 'DIRECT' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Total Current Physical Stock ({unit}) — नया वास्तविक स्टॉक दर्ज करें
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={directStockInput}
                    onChange={(e) => setDirectStockInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-extrabold font-mono text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-zinc-400">
                    {unit}
                  </span>
                </div>
                {Math.abs(calculatedStockChange) > 0.0001 && (
                  <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between px-1">
                    <span>अंतर (Stock Adjustment Difference):</span>
                    <span
                      className={`font-mono font-bold ${
                        calculatedStockChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {calculatedStockChange > 0 ? `+${calculatedStockChange.toLocaleString('en-IN')}` : calculatedStockChange.toLocaleString('en-IN')} {unit}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeltaDirection('ADD')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
                      deltaDirection === 'ADD'
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    + Add to Stock (माल जोड़ें)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeltaDirection('DEDUCT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
                      deltaDirection === 'DEDUCT'
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    - Deduct Stock (माल घटाएं)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={deltaQuantityInput}
                    onChange={(e) => setDeltaQuantityInput(e.target.value)}
                    placeholder={`Quantity to ${deltaDirection === 'ADD' ? 'add' : 'deduct'}...`}
                    className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-extrabold font-mono text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-zinc-400">
                    {unit}
                  </span>
                </div>
                {deltaQuantityInput && (
                  <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between px-1">
                    <span>अंतिम स्टॉक (Resulting New Stock):</span>
                    <span className="font-mono font-bold text-black dark:text-white">
                      {computedNewStock.toLocaleString('en-IN')} {unit}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Optional Reason */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Reason / Remark (कारण / टिप्पणी)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="उदा. कांटा चेकिंग, गोदाम मिलान, नमी/छंटाई..."
                className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs text-black dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
              />
            </div>
          </div>

          {/* 3. SECTION: PRICE & PIECE RATE ADJUSTMENT */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-xs">
            <div className="flex items-center gap-1.5 font-extrabold text-xs text-black dark:text-white">
              <IconAdjust size={16} className="text-zinc-500" />
              <span>2. Price & Piece Rate Adjustment (दर / भाव सुधार)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Spot Purchase Rate (चालू खरीद भाव ₹/{unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-zinc-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={purchaseRateInput}
                    onChange={(e) => setPurchaseRateInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 pl-7 pr-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-extrabold font-mono text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Spot Sale Rate (चालू बिक्री भाव ₹/{unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-zinc-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={saleRateInput}
                    onChange={(e) => setSaleRateInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 pl-7 pr-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-extrabold font-mono text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Cancel & Save */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-xl transition-colors"
            >
              Cancel (रद्द करें)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 disabled:opacity-50 btn-press shadow-xs"
            >
              {isSubmitting ? 'Saving Adjustments...' : 'Save Adjustments (सुधार सुरक्षित करें)'}
            </button>
          </div>
        </form>

        {/* 3. SECTION: DELETION & COUNT RESET OPTIONS (2 Distinct Options) */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-xs text-black dark:text-white">
            <IconDelete size={16} className="text-zinc-500" />
            <span>3. Deletion & Count Reset Options (विलोपन व गिनती रीसेट विकल्प)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* OPTION 1: Delete Counts Only / Reset Stock to 0 */}
            <div className="p-3.5 rounded-xl border border-amber-300/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  <IconReset size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>1. Delete Counts (स्टॉक 0 करें)</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1.5 leading-snug">
                  सामग्री लिस्ट में सुरक्षित रहेगी, केवल इसका गोदाम स्टॉक शून्य (<span className="font-bold font-mono">0 {unit}</span>) हो जाएगा।
                </p>
              </div>

              {!isConfirmingResetCounts ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingResetCounts(true);
                    setIsConfirmingDelete(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-amber-400 dark:border-amber-700 bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <IconReset size={14} />
                  <span>Reset Count to 0 (गिनती 0 करें)</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 space-y-2">
                  <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 leading-tight">
                    क्या आप "{selectedItem?.name}" का स्टॉक 0 करना चाहते हैं?
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingResetCounts(false)}
                      className="flex-1 py-1 px-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-200"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="button"
                      disabled={isResettingCounts}
                      onClick={handleResetCounts}
                      className="flex-1 py-1 px-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold disabled:opacity-50 btn-press"
                    >
                      {isResettingCounts ? 'Resetting...' : 'हाँ, 0 करें'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* OPTION 2: Delete Item Permanently from List */}
            <div className="p-3.5 rounded-xl border border-red-300/70 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-900 dark:text-red-200">
                  <IconDelete size={14} className="text-red-600 dark:text-red-400 shrink-0" />
                  <span>2. Delete from List (लिस्ट से हटाएं)</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1.5 leading-snug">
                  सावधानी: यह सामग्री और इसके सभी पुराने रिकॉर्ड्स हमेशा के लिए हटा दिए जाएंगे।
                </p>
              </div>

              {!isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingDelete(true);
                    setIsConfirmingResetCounts(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-red-400 dark:border-red-700 bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <IconDelete size={14} />
                  <span>Delete from List (लिस्ट से हटाएं)</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-lg bg-red-100/70 dark:bg-red-900/40 border border-red-300 dark:border-red-700 space-y-2">
                  <p className="text-[11px] font-bold text-red-900 dark:text-red-200 leading-tight">
                    क्या आप वाकई "{selectedItem?.name}" को लिस्ट से हमेशा के लिए हटाना चाहते हैं?
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="flex-1 py-1 px-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-200"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteItem}
                      className="flex-1 py-1 px-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold disabled:opacity-50 btn-press"
                    >
                      {isDeleting ? 'Deleting...' : 'हाँ, हमेशा हटाएं'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
