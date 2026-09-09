import React, { useState, useEffect } from 'react';
import {
  Package,
  Tag,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
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

  // Deletion Confirmation State
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadItems();
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

  // Handle Complete Deletion
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    setErrorMessage('');

    try {
      await api.deleteItem(selectedItem.id);
      setSuccessMessage(`"${selectedItem.name}" पूरी तरह से हटा दिया गया (Deleted completely).`);
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
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
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
                <Package className="w-4 h-4 text-zinc-500" />
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
              <Tag className="w-4 h-4 text-zinc-500" />
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

        {/* 4. SECTION: COMPLETE DELETION */}
        <div className="p-4 rounded-2xl border border-red-200 dark:border-red-950/60 bg-red-50/50 dark:bg-red-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-red-600 dark:text-red-400">
              <Trash2 className="w-4 h-4" />
              <span>3. Delete Material Completely (सामग्री पूरी तरह हटाएं)</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            यदि आप इस सामग्री को पूरी तरह हटाना चाहते हैं, तो यह सामग्री और इसके सभी पुराने रिकॉर्ड्स सुरक्षित रूप से डेटाबेस से हट जाएंगे।
          </p>

          {!isConfirmingDelete ? (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-zinc-950 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete "{selectedItem?.name}" Completely</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 space-y-2">
              <div className="font-extrabold text-xs text-red-700 dark:text-red-300">
                क्या आप वाकई "{selectedItem?.name}" को हमेशा के लिए हटाना चाहते हैं?
              </div>
              <p className="text-[10px] text-red-600/90 dark:text-red-400/90">
                यह प्रक्रिया वापस नहीं ली जा सकती (This cannot be undone).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-black dark:text-white"
                >
                  रद्द करें (No, Keep)
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteItem}
                  className="px-3.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 btn-press"
                >
                  {isDeleting ? 'Deleting...' : 'हाँ, हमेशा के लिए हटाएं (Yes, Delete)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
