import React, { useState, useEffect } from 'react';
import { Tag, TrendingUp, PackagePlus, AlertCircle } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { api } from '../../services/api';
import { ScrapItem, ScrapUnit } from '../../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: ScrapItem | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}) => {
  const [name, setName] = useState('');
  const [localName, setLocalName] = useState('');
  const [defaultUnit, setDefaultUnit] = useState<ScrapUnit>('KG');
  const [spotPurchaseRate, setSpotPurchaseRate] = useState('');
  const [spotSaleRate, setSpotSaleRate] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '');
      setLocalName(editItem.local_name || '');
      setDefaultUnit(editItem.default_unit || 'KG');
      setSpotPurchaseRate(editItem.default_purchase_rate > 0 ? String(editItem.default_purchase_rate) : '');
      setSpotSaleRate(editItem.default_sale_rate > 0 ? String(editItem.default_sale_rate) : '');
      setInitialStock(editItem.current_stock > 0 ? String(editItem.current_stock) : '');
    } else {
      setName('');
      setLocalName('');
      setDefaultUnit('KG');
      setSpotPurchaseRate('');
      setSpotSaleRate('');
      setInitialStock('');
    }
    setErrorMessage('');
  }, [editItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Kripya English naam bharein (Please enter English name).');
      return;
    }

    if (!localName.trim()) {
      setErrorMessage('Kripya Hindi naam bharein (Please enter Hindi name).');
      return;
    }

    const purchaseRateNum = parseFloat(spotPurchaseRate) || 0;
    const saleRateNum = parseFloat(spotSaleRate) || 0;
    const initialStockNum = parseFloat(initialStock) || 0;

    setIsSubmitting(true);
    try {
      if (editItem) {
        await api.updateItem(editItem.id, {
          name: name.trim().toUpperCase(),
          local_name: localName.trim(),
          default_unit: defaultUnit,
          default_purchase_rate: purchaseRateNum,
          default_sale_rate: saleRateNum,
        });
      } else {
        await api.createItem({
          name: name.trim().toUpperCase(),
          local_name: localName.trim(),
          default_unit: defaultUnit,
          default_purchase_rate: purchaseRateNum,
          default_sale_rate: saleRateNum,
          current_stock: initialStockNum,
          is_active: true,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Samaan save karne me samasya aayi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? 'Edit Material (सामग्री बदलें)' : 'Add Scrap Material (नया सामान जोड़ें)'}
      subtitle="Enter details, spot purchase rate, and unit"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Dynamic Rate Guidance Banner */}
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            <span className="font-bold text-black dark:text-white">फ्लोटिंग रेट (Spot Pricing): </span>
            स्क्रैप के दाम हर दिन व गाड़ी के अनुसार बदलते हैं। इस समय की सटीक खरीद दर (Spot Purchase Rate) यहाँ सेट करें ताकि खरीद बिल में यह अपने आप आ जाए।
          </div>
        </div>

        {/* Names Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* English Name */}
          <div>
            <label htmlFor="item-name" className="block font-medium text-black dark:text-white mb-1">
              Material Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. COPPER WIRE, LOHA"
              className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white uppercase outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>

          {/* Hindi Name */}
          <div>
            <label htmlFor="item-local-name" className="block font-medium text-black dark:text-white mb-1">
              Material Name (हिन्दी) <span className="text-red-500">*</span>
            </label>
            <input
              id="item-local-name"
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="उदा: ताँबा तार, लोहा"
              className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>
        </div>

        {/* Measurement Unit */}
        <div>
          <label className="block font-medium text-black dark:text-white mb-1">
            Measurement Unit (मापने की इकाई) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['KG', 'PIECE'] as ScrapUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setDefaultUnit(u)}
                className={`py-2 px-3 rounded-lg border text-center font-bold transition-colors ${
                  defaultUnit === u
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {u === 'KG' ? 'Kilogram (KG / किलो)' : 'Piece (PIECE / नग)'}
              </button>
            ))}
          </div>
        </div>

        {/* Spot Purchase Rate Section */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-black dark:text-white">
            <Tag className="w-3.5 h-3.5" />
            <span>Spot Pricing & Valuation (दाम व मूल्य दर)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Spot Purchase Rate */}
            <div>
              <label className="block font-semibold text-black dark:text-white mb-1">
                Spot Purchase Rate (इस समय की खरीद दर ₹ / {defaultUnit})
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={spotPurchaseRate}
                  onChange={(e) => setSpotPurchaseRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 pl-7 pr-12 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-extrabold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-semibold">
                  /{defaultUnit}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">इस समय की चालू खरीद दर (Purchase bill me pre-fill hogi)</p>
            </div>

            {/* Target Sale Rate */}
            <div>
              <label className="block font-medium text-black dark:text-white mb-1">
                Target Sale Rate (अपेक्षित बिक्री दर ₹ / {defaultUnit})
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={spotSaleRate}
                  onChange={(e) => setSpotSaleRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 pl-7 pr-12 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-semibold">
                  /{defaultUnit}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">ऐच्छिक (Optional: बिक्री बिल हेतु)</p>
            </div>
          </div>

          {!editItem && (
            <div>
              <label className="block font-medium text-black dark:text-white mb-1">
                Opening Stock in Godown (शुरुआती स्टॉक - यदि गोदाम में पहले से हो)
              </label>
              <div className="relative">
                <PackagePlus className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 pl-8 pr-12 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-semibold">
                  {defaultUnit}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-lg transition-colors"
          >
            Cancel (रद्द करें)
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 font-bold text-white bg-black dark:bg-white dark:text-black rounded-lg disabled:opacity-50 transition-opacity shadow-xs"
          >
            {isSubmitting ? 'Saving...' : editItem ? 'Update Material (बदलाव सहेजें)' : 'Save Material (सामान जोड़ें)'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
