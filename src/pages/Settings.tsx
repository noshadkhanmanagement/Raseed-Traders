import React, { useState, useEffect, useCallback } from 'react';
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
  const [quickRate, setQuickRate] = useState('');
  const [isAddingQuickItem, setIsAddingQuickItem] = useState(false);
  const [itemMessage, setItemMessage] = useState('');

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
      setSaveMessage('Settings updated successfully!');
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
        default_purchase_rate: parseFloat(quickRate) || 0,
        default_sale_rate: 0,
        current_stock: 0,
        is_active: true,
      });
      const createdUnit = quickUnit;
      setQuickName('');
      setQuickLocalName('');
      setQuickRate('');
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
    <div className="space-y-5 max-w-3xl mx-auto page-enter">
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

      {/* 1. MANAGE MATERIAL NAMES & UNITS */}
      <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs">
              <IconLayers size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-black dark:text-white tracking-tight">
                Manage Material Names (सामग्री नाम प्रबंधन)
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Add materials, set unit as KG or PIECE, and manage items ({items.length} total)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedItemToEdit(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 btn-press shadow-xs"
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
        <form onSubmit={handleQuickAddItem} className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/60 space-y-3.5">
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
            {/* Unit Selector (KG or PIECE) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Item Unit (सामान की इकाई)
                </label>
                <span className="text-[10px] font-extrabold text-black dark:text-white">
                  {quickUnit === 'KG' ? 'Kilogram (किलो)' : 'Piece (नग / पीस)'}
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

            {/* Spot Rate & Submit */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Spot Rate (₹ / {quickUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={quickRate}
                  onChange={(e) => setQuickRate(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingQuickItem || !quickName.trim() || !quickLocalName.trim()}
                className="h-[38px] px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black hover:opacity-90 disabled:opacity-40 transition-all btn-press shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <IconPlus size={14} strokeWidth={2.5} />
                <span>{isAddingQuickItem ? 'Saving...' : 'Add Material'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Materials List with Inline KG / PIECE Switcher */}
        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/70 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40">
          {items.map((it) => {
            const isPermanent = isDefaultScrapItem(it.name);
            return (
              <div
                key={it.id}
                className="p-3 flex items-center justify-between gap-2 hover:bg-white dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-black dark:text-white truncate">
                      {it.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      ({it.local_name})
                    </span>
                    {isPermanent && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                        Permanent
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Stock: {it.current_stock.toLocaleString('en-IN')} {it.default_unit} · Rate: ₹{it.default_purchase_rate || 0}/{it.default_unit}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Inline Unit Toggle: KG or PIECE */}
                  <div className="inline-flex p-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => handleUpdateItemUnit(it, 'KG')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all ${
                        it.default_unit === 'KG'
                          ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                          : 'text-zinc-500 hover:text-black dark:hover:text-white'
                      }`}
                      title="Set unit to KG"
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
                      title="Set unit to PIECE"
                    >
                      PIECE
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItemToEdit(it);
                      setIsItemModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1"
                    title="Edit Name & Rates"
                  >
                    <IconEdit size={12} />
                    <span>Edit</span>
                  </button>

                  {!isPermanent && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomItem(it)}
                      className="p-1 rounded-full text-zinc-400 hover:text-red-600 icon-press"
                      title="Delete Custom Material"
                    >
                      <IconDelete size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Business Profile */}
      <form onSubmit={handleSave} className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <IconBuilding size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-black dark:text-white tracking-tight">
              Business Profile (व्यापार विवरण)
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Printed on header and reports
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-1">
              Shop Name (व्यापार का नाम)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1">
                Contact Phone (मोबाइल नंबर)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1">
                Default Unit (डिफ़ॉल्ट इकाई)
              </label>
              <select
                value={defaultUnit}
                onChange={(e) => setDefaultUnit(e.target.value as ScrapUnit)}
                className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              >
                <option value="KG">KG (किलो)</option>
                <option value="PIECE">PIECE (नग)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-1">
              Shop Address (दुकान का पता)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-5 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 btn-press shadow-xs"
          >
            <IconSave size={14} />
            <span>Save Profile (सेव करें)</span>
          </button>
        </div>
      </form>

      {/* 3. Data Backup & Restore */}
      <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-3.5">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <IconDatabase size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-black dark:text-white tracking-tight">
              Data Backup & Restore (डेटा बैकअप)
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Safeguard all transactions, materials, and records offline
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press"
          >
            <IconDownload size={14} />
            <span>Download Backup JSON</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer">
            <IconUpload size={14} />
            <span>Restore Backup JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* 4. App Security & Logout */}
      <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-3.5">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0 shadow-xs">
            <IconLock size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-black dark:text-white tracking-tight">
              App Security & Access (सुरक्षा)
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Lock the application session on this device
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Require password on next launch
          </span>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-full border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 btn-press"
          >
            Lock App Now (लॉग आउट)
          </button>
        </div>
      </div>

      {/* 5. Factory Reset */}
      <div className="rounded-[26px] border border-red-200/80 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-3.5">
        <div className="flex items-center gap-3 pb-3 border-b border-red-200/60 dark:border-red-900/40">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <IconAlert size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-red-600 dark:text-red-400 tracking-tight">
              Factory Data Reset (डेटा रीसेट)
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Zero all counts and restore 25 clean items
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Resets all scrap items to exactly the 25 default materials with 0 stock & ₹0 rates.
          </span>
          <button
            type="button"
            onClick={handleResetData}
            disabled={isResetting}
            className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 btn-press shadow-xs shrink-0 flex items-center justify-center gap-1.5"
          >
            <IconReset size={14} className={isResetting ? 'animate-spin' : ''} />
            <span>{isResetting ? 'Resetting...' : 'Reset All to 0 (रीसेट करें)'}</span>
          </button>
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
