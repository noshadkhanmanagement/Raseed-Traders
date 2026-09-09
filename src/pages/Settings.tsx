import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IconBuilding,
  IconSave,
  IconDatabase,
  IconDownload,
  IconUpload,
  IconLock,
  IconAlert,
  IconReset,
  IconPlus,
  IconEdit,
  IconDelete,
  IconLayers,
  IconCheck,
  IconSearch,
  IconClose,
} from '../components/common/Icons';
import { PageHeader } from '../components/layout/PageHeader';
import { ItemModal } from '../components/transactions/ItemModal';
import { api, isDefaultScrapItem } from '../services/api';
import { ScrapItem, ScrapUnit } from '../types';
import { useAuth } from '../context/AuthContext';
import { getLocalDateString } from '../utils/formatters';

export const Settings: React.FC = () => {
  const { logout } = useAuth();

  const [name, setName] = useState('Raseed Traders');
  const [phone, setPhone] = useState('+91 744 061 9649');
  const [address, setAddress] = useState('Behind Masjid, Bus Stand, Lakhnadon 480886');

  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultUnit, setDefaultUnit] = useState<ScrapUnit>('KG');

  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Manage Materials State
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<ScrapItem | null>(null);

  // Quick Add Material State
  const [quickName, setQuickName] = useState('');
  const [quickLocalName, setQuickLocalName] = useState('');
  const [quickUnit, setQuickUnit] = useState<ScrapUnit>('KG');
  const [isAddingQuickItem, setIsAddingQuickItem] = useState(false);
  const [itemMessage, setItemMessage] = useState('');

  // Inline Stock Edit State
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Catalog Search State
  const [catalogSearch, setCatalogSearch] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const biz = await api.getBusiness();
      setName(biz.name || 'Raseed Traders');
      setPhone(biz.phone || '+91 744 061 9649');
      setAddress(biz.address || 'Behind Masjid, Bus Stand, Lakhnadon 480886');
      setAllowNegativeStock(biz.settings?.allow_negative_stock ?? false);
      setDefaultUnit(biz.settings?.default_unit ?? 'KG');
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const all = await api.getItems();
      setItems(all);
      // Initialize stock inputs
      const initialStock: Record<string, string> = {};
      all.forEach((it) => {
        initialStock[it.id] = String(it.current_stock);
      });
      setStockEdits(initialStock);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadItems();
  }, [loadSettings, loadItems]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateBusiness({ name, phone, address });
      await api.updateSettings({
        allow_negative_stock: allowNegativeStock,
        default_unit: defaultUnit,
      });

      setIsSaved(true);
      setSaveMessage('Profile settings updated successfully!');
      setTimeout(() => {
        setIsSaved(false);
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage('Error updating settings.');
    }
  };

  const handleExportBackup = () => {
    const data = api.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Raseed_Traders_Backup_${getLocalDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        api.importBackup(json);
        alert('Backup imported successfully!');
        window.location.reload();
      } catch (err: any) {
        alert('Error importing backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all data and restore clean 25 default items with 0 stock & rates?'
    );
    if (!confirmed) return;

    setIsResetting(true);
    try {
      await api.resetData();
      alert('All transactions reset and 25 items restored cleanly.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error resetting data.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickLocalName.trim()) return;

    setIsAddingQuickItem(true);
    try {
      await api.createItem({
        name: quickName.trim().toUpperCase(),
        local_name: quickLocalName.trim(),
        default_unit: quickUnit,
        default_purchase_rate: 0,
        default_sale_rate: 0,
        current_stock: 0,
        is_active: true,
      });
      const createdUnit = quickUnit;
      setQuickName('');
      setQuickLocalName('');
      setQuickUnit('KG');
      setItemMessage(`Material added successfully as "${createdUnit}"!`);
      setTimeout(() => setItemMessage(''), 3000);
      await loadItems();
    } catch (err: any) {
      alert(err.message || 'Error adding material');
    } finally {
      setIsAddingQuickItem(false);
    }
  };

  const handleUpdateItemUnit = async (item: ScrapItem, newUnit: ScrapUnit) => {
    if (item.default_unit === newUnit) return;
    try {
      await api.updateItem(item.id, { default_unit: newUnit });
      setItemMessage(`Updated "${item.name}" unit to ${newUnit}`);
      setTimeout(() => setItemMessage(''), 2500);
      await loadItems();
    } catch (err: any) {
      alert(err.message || 'Error updating unit');
    }
  };

  const handleStockInputChange = (id: string, value: string) => {
    setStockEdits((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveStock = async (item: ScrapItem) => {
    const rawVal = stockEdits[item.id];
    if (rawVal === undefined || rawVal === '') return;
    const numVal = parseFloat(rawVal);
    if (isNaN(numVal) || numVal < 0) {
      alert('Please enter a valid non-negative number for stock count.');
      return;
    }

    setSavingStockId(item.id);
    try {
      await api.updateItem(item.id, { current_stock: numVal });
      setItemMessage(`Updated "${item.name}" stock count to ${numVal.toLocaleString('en-IN')} ${item.default_unit}!`);
      setTimeout(() => setItemMessage(''), 3000);
      await loadItems();
    } catch (err: any) {
      alert(err.message || 'Error updating stock');
    } finally {
      setSavingStockId(null);
    }
  };

  const handleQuickResetStock = async (item: ScrapItem) => {
    const confirmed = window.confirm(`Reset "${item.name}" stock count to 0 ${item.default_unit}?`);
    if (!confirmed) return;
    try {
      await api.resetItemStock(item.id);
      setItemMessage(`Reset "${item.name}" stock count to 0!`);
      setTimeout(() => setItemMessage(''), 3000);
      await loadItems();
    } catch (err: any) {
      alert(err.message || 'Error resetting stock');
    }
  };

  const handleDeleteCustomItem = async (it: ScrapItem) => {
    const confirmed = window.confirm(`Permanently remove material "${it.name}" from catalog?`);
    if (!confirmed) return;
    try {
      await api.deleteItem(it.id);
      await loadItems();
    } catch (err: any) {
      alert(err.message || 'Error deleting material');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto page-enter pb-16">
      <PageHeader
        title="Settings (सेटिंग्स)"
        subtitle="Shop profile, material catalog management, and database tools"
      />

      {saveMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold transition-all ${
            isSaved
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-500/10 text-red-600 border border-red-500/30'
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* 1. MANAGE MATERIAL NAMES, UNITS & STOCKS */}
      <div className="rounded-[24px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs">
              <IconLayers size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-black dark:text-white tracking-tight">
                Materials & Stock Manager (सामग्री व स्टॉक)
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Edit current stock, toggle KG/PIECE units, and manage items ({items.length} total)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedItemToEdit(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 btn-press shadow-xs shrink-0"
          >
            <IconPlus size={13} strokeWidth={2.5} />
            <span>Full Form</span>
          </button>
        </div>

        {itemMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            {itemMessage}
          </div>
        )}

        {/* INLINE QUICK ITEM ADDER WITH KG / PIECE OPTION */}
        <form onSubmit={handleQuickAddItem} className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-black dark:text-white flex items-center gap-1.5">
              <IconPlus size={14} strokeWidth={2.5} />
              <span>Add New Material (नया सामान जोड़ें)</span>
            </span>
            <span className="text-[10px] font-semibold text-zinc-400">KG या PIECE में सेट करें</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Name in English <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="e.g. BATTERY, DRUM, COPPER"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold uppercase text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Name in Hindi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={quickLocalName}
                onChange={(e) => setQuickLocalName(e.target.value)}
                placeholder="उदा: बैटरी, ड्रम, ताँबा"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Item Unit (सामान की इकाई)
                </label>
                <span className="text-[10px] font-extrabold text-black dark:text-white">
                  {quickUnit === 'KG' ? 'Kilogram (किलो)' : 'Piece (नग)'}
                </span>
              </div>
              <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setQuickUnit('KG')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all ${
                    quickUnit === 'KG'
                      ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  KG (किलो)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickUnit('PIECE')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all ${
                    quickUnit === 'PIECE'
                      ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  PIECE (नग)
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isAddingQuickItem || !quickName.trim() || !quickLocalName.trim()}
                className="w-full h-[38px] px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black hover:opacity-90 disabled:opacity-40 transition-all btn-press shadow-xs flex items-center justify-center gap-1.5"
              >
                <IconPlus size={14} strokeWidth={2.5} />
                <span>{isAddingQuickItem ? 'Saving...' : 'Add Material (सामान जोड़ें)'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* HORIZONTALLY SCROLLABLE ITEMS & STOCK TABLE */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium px-1">
            <span>Material Catalog & Current Stock</span>
            <span className="sm:hidden text-[10px] text-zinc-400 flex items-center gap-1">
              <span>← Swipe horizontally →</span>
            </span>
          </div>

          {/* Instant Search Bar */}
          <div className="relative">
            <IconSearch size={14} className="text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search materials (LOHA, लोहा, BATTERY...)"
              className="w-full pl-10 pr-9 py-2 rounded-[14px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900 text-black dark:text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
            />
            {catalogSearch && (
              <button
                type="button"
                onClick={() => setCatalogSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <IconClose size={12} />
              </button>
            )}
          </div>
          {catalogSearch.trim() && (
            <div className="text-[11px] text-zinc-400 font-medium px-1">
              Showing {items.filter((it) => {
                const q = catalogSearch.trim().toLowerCase();
                return it.name.toLowerCase().includes(q) || (it.local_name && it.local_name.toLowerCase().includes(q));
              }).length} of {items.length} materials
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs">
            <table className="w-full text-left border-collapse min-w-[660px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[190px]">Material (सामग्री)</th>
                  <th className="py-2.5 px-3 min-w-[130px] text-center">Unit (इकाई)</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Current Stock (वर्तमान स्टॉक)</th>
                  <th className="py-2.5 px-3 min-w-[140px] text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {items
                  .filter((it) => {
                    if (!catalogSearch.trim()) return true;
                    const q = catalogSearch.trim().toLowerCase();
                    return it.name.toLowerCase().includes(q) || (it.local_name && it.local_name.toLowerCase().includes(q));
                  })
                  .map((it, idx) => {
                  const isPermanent = isDefaultScrapItem(it.name);
                  const currentEditVal = stockEdits[it.id] ?? String(it.current_stock);
                  const isModified = currentEditVal !== String(it.current_stock);

                  return (
                    <tr
                      key={it.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-2.5 px-3 text-center text-[11px] font-bold text-zinc-400 tabular-nums font-sans">
                        {idx + 1}
                      </td>

                      {/* Material Name & Hindi */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-black dark:text-white">
                            {it.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-normal">
                            ({it.local_name})
                          </span>
                          {isPermanent && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Default
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit Selector Toggle */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemUnit(it, 'KG')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all ${
                              it.default_unit === 'KG'
                                ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                                : 'text-zinc-500 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            KG
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemUnit(it, 'PIECE')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all ${
                              it.default_unit === 'PIECE'
                                ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                                : 'text-zinc-500 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            PIECE
                          </button>
                        </div>
                      </td>

                      {/* Editable Current Stock */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="relative w-32">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={currentEditVal}
                              onChange={(e) => handleStockInputChange(it.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveStock(it);
                                }
                              }}
                              placeholder="0"
                              className={`w-full pl-2.5 pr-9 py-1 text-xs font-bold tabular-nums font-sans rounded-xl border outline-none transition-all ${
                                isModified
                                  ? 'border-black dark:border-white bg-white dark:bg-black text-black dark:text-white ring-1 ring-black dark:ring-white'
                                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-400'
                              }`}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-zinc-400 pointer-events-none">
                              {it.default_unit}
                            </span>
                          </div>

                          {isModified && (
                            <button
                              type="button"
                              onClick={() => handleSaveStock(it)}
                              disabled={savingStockId === it.id}
                              className="px-2 py-1 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[10px] font-black hover:opacity-90 transition-all shadow-xs flex items-center gap-1 shrink-0 btn-press"
                              title="Save updated stock"
                            >
                              <IconCheck size={11} strokeWidth={2.5} />
                              <span>Save</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right pr-4">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Reset Stock to 0 */}
                          <button
                            type="button"
                            onClick={() => handleQuickResetStock(it)}
                            disabled={it.current_stock === 0 && currentEditVal === '0'}
                            className="p-1 rounded-lg text-zinc-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors icon-press"
                            title="Reset Stock Count to 0"
                          >
                            <IconReset size={13} />
                          </button>

                          {/* Edit Details in Modal */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemToEdit(it);
                              setIsItemModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit Material Details"
                          >
                            Edit
                          </button>

                          {/* Delete if custom item */}
                          {!isPermanent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomItem(it)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-red-600 icon-press"
                              title="Delete Custom Material"
                            >
                              <IconDelete size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. COMPACT EXACT iOS STYLED OPTIONS BELOW */}

      {/* SECTION A: SHOP PROFILE (व्यापार विवरण) */}
      <div className="space-y-1.5">
        <div className="px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Shop Profile (व्यापार विवरण)
        </div>

        <form onSubmit={handleSave} className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
          {/* Shop Name Row */}
          <div className="p-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                <IconBuilding size={14} />
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Shop Name
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shop Name"
              className="text-right text-xs font-bold text-black dark:text-white bg-transparent outline-none flex-1 pl-4"
              required
            />
          </div>

          {/* Contact Phone Row */}
          <div className="p-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Phone Number
              </span>
            </div>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91..."
              className="text-right text-xs font-bold text-black dark:text-white bg-transparent outline-none flex-1 pl-4 tabular-nums font-sans"
              required
            />
          </div>

          {/* Address Row */}
          <div className="p-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Address
              </span>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              className="text-right text-xs font-bold text-black dark:text-white bg-transparent outline-none flex-1 pl-4"
              required
            />
          </div>

          {/* Default Unit Row */}
          <div className="p-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
                <IconLayers size={14} />
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Default Trade Unit
              </span>
            </div>
            <div className="inline-flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setDefaultUnit('KG')}
                className={`px-3 py-1 rounded-md text-xs font-extrabold transition-all ${
                  defaultUnit === 'KG'
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => setDefaultUnit('PIECE')}
                className={`px-3 py-1 rounded-md text-xs font-extrabold transition-all ${
                  defaultUnit === 'PIECE'
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                PIECE
              </button>
            </div>
          </div>

          {/* Save Profile Button Row */}
          <div className="p-2.5 sm:px-4 bg-zinc-50/50 dark:bg-zinc-900/40 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 btn-press shadow-xs"
            >
              <IconSave size={13} />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION B: DATA & BACKUP (डेटा बैकअप) */}
      <div className="space-y-1.5">
        <div className="px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Data & Backup (डेटा बैकअप)
        </div>

        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
          {/* Download JSON Backup */}
          <div className="p-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0">
                <IconDownload size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Export Offline Backup
                </div>
                <div className="text-[10px] text-zinc-400">
                  Save all materials & transactions to JSON
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 btn-press"
            >
              Download
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
                <IconUpload size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Restore Backup JSON
                </div>
                <div className="text-[10px] text-zinc-400">
                  Import previously saved JSON database
                </div>
              </div>
            </div>
            <label className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 btn-press cursor-pointer">
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* SECTION C: SECURITY & SESSION (सुरक्षा) */}
      <div className="space-y-1.5">
        <div className="px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Security & Access (सुरक्षा)
        </div>

        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
          <div className="p-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-700 text-white flex items-center justify-center shrink-0">
                <IconLock size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Lock App Session
                </div>
                <div className="text-[10px] text-zinc-400">
                  Require password login on next open
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 btn-press"
            >
              Lock App Now
            </button>
          </div>
        </div>
      </div>

      {/* SECTION D: FACTORY RESET (डेटा रीसेट) */}
      <div className="space-y-1.5">
        <div className="px-3 text-[11px] font-bold text-red-500 uppercase tracking-wider">
          Danger Zone (डेटा रीसेट)
        </div>

        <div className="rounded-2xl border border-red-200/80 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10 shadow-xs overflow-hidden">
          <div className="p-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <IconAlert size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-red-600 dark:text-red-400">
                  Factory Data Reset
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Zero all stock counts and restore clean 25 materials
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              disabled={isResetting}
              className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 btn-press shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <IconReset size={12} className={isResetting ? 'animate-spin' : ''} />
              <span>{isResetting ? 'Resetting...' : 'Reset to 0'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for adding/editing material names */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setSelectedItemToEdit(null);
        }}
        editItem={selectedItemToEdit}
        onSuccess={loadItems}
      />
    </div>
  );
};
