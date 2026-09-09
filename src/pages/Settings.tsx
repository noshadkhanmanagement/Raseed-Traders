import React, { useState, useEffect } from 'react';
import { Save, Download, Upload, RotateCcw, Lock, ShieldCheck, Building2, Sliders, Database, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { api } from '../services/api';
import { ScrapUnit } from '../types';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { logout } = useAuth();

  const [name, setName] = useState('Raseed Traders');
  const [phone, setPhone] = useState('+91 744 061 9649');
  const [address, setAddress] = useState('Behind Masjid, Bus Stand, Lakhnadon 480886');

  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultUnit, setDefaultUnit] = useState<ScrapUnit>('KG');

  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
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
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateBusiness({ name, phone, address });
      await api.updateSettings({
        allow_negative_stock: allowNegativeStock,
        default_unit: defaultUnit,
      });

      setIsSaved(true);
      setSaveMessage('Settings updated successfully (सेटिंग्स सहेजी गईं)!');
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
    a.download = `Raseed_Traders_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
        alert('Backup imported successfully (डेटा रीस्टोर हो गया)!');
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
      'Are you sure you want to reset all data and restore the clean 25 default items with ₹0 counts?\n(क्या आप सभी डेटा रीसेट करके 25 मुख्य सामानों की साफ़ सूची वापस लाना चाहते हैं?)'
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

  return (
    <div className="space-y-5 max-w-3xl mx-auto page-enter">
      <PageHeader
        title="Settings (सेटिंग्स)"
        subtitle="Shop details, business rules, and database management"
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

      {/* 1. iOS Inset Group: Business Profile */}
      <form onSubmit={handleSave} className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-black dark:text-white tracking-tight">
              Business Profile (व्यापार विवरण)
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Printed on bills, purchase slips, and invoices
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

          <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80">
            <div>
              <span className="text-xs font-bold text-black dark:text-white block">
                Negative Stock Allowance
              </span>
              <span className="text-[11px] text-zinc-500">Allow selling items even if stock is 0</span>
            </div>
            <input
              type="checkbox"
              checked={allowNegativeStock}
              onChange={(e) => setAllowNegativeStock(e.target.checked)}
              className="w-5 h-5 rounded-md accent-black dark:accent-white cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 btn-press shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings (सहेजें)</span>
          </button>
        </div>
      </form>

      {/* 2. iOS Inset Group: Data Backup & Management */}
      <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-3.5">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-black dark:text-white tracking-tight">
              Data Backup & Restore (डेटा बैकअप)
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Download complete database file or restore onto another device
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white text-xs font-bold btn-press shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (डाउनलोड बैकअप)</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white text-xs font-bold btn-press shadow-2xs cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restore Backup (बैकअप लोड करें)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 3. iOS Inset Group: Security & Logout */}
      <div className="rounded-[26px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-3.5">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Lock className="w-4 h-4" />
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

      {/* 4. iOS Inset Group: Danger Zone */}
      <div className="rounded-[26px] border border-red-200/80 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-3.5">
        <div className="flex items-center gap-3 pb-3 border-b border-red-200/60 dark:border-red-900/40">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-red-600 dark:text-red-400 tracking-tight">
              Factory Data Reset (डेटा रीसेट)
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Permanently clear all bills, zero all counts, and restore 25 clean items
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
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset All to 0 (रीसेट करें)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
