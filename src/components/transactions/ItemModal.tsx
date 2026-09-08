import React, { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '');
      setLocalName(editItem.local_name || '');
      setDefaultUnit(editItem.default_unit || 'KG');
    } else {
      setName('');
      setLocalName('');
      setDefaultUnit('KG');
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

    setIsSubmitting(true);
    try {
      if (editItem) {
        await api.updateItem(editItem.id, {
          name: name.trim().toUpperCase(),
          local_name: localName.trim(),
          default_unit: defaultUnit,
          default_purchase_rate: 0,
          default_sale_rate: 0,
        });
      } else {
        await api.createItem({
          name: name.trim().toUpperCase(),
          local_name: localName.trim(),
          default_unit: defaultUnit,
          default_purchase_rate: 0,
          default_sale_rate: 0,
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
      title={editItem ? 'Edit Material (सामग्री बदलें)' : 'Add Custom Material (नया सामान)'}
      subtitle="Enter English and Hindi names and unit (KG / PIECE)"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* English Name */}
        <div>
          <label className="block font-medium text-black dark:text-white mb-1">
            Material Name in English (उदा: LOHA, COPPER WIRE)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. BRASS WIRE"
            className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white uppercase outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            required
          />
        </div>

        {/* Hindi Name */}
        <div>
          <label className="block font-medium text-black dark:text-white mb-1">
            Material Name in Hindi (उदा: लोहा, पीतल तार)
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="उदा: पीतल तार"
            className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            required
          />
        </div>

        {/* Measurement Unit */}
        <div>
          <label className="block font-medium text-black dark:text-white mb-1">
            Measurement Unit (इकाई)
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 font-bold text-white bg-black dark:bg-white dark:text-black rounded-lg disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Saving...' : 'Save Material (सामान जोड़ें)'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
