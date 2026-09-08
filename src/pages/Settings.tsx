import React, { useState, useEffect } from 'react';
import { Save, Download, Upload, RotateCcw, Laptop, Sun, Moon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { api } from '../services/api';
import { ScrapUnit, PaymentMethod } from '../types';
import { useTheme, ThemeMode } from '../context/ThemeContext';

export const Settings: React.FC = () => {
  const { theme, resolvedTheme, setTheme, logoSrc } = useTheme();

  const [name, setName] = useState('Raseed Traders');
  const [phone, setPhone] = useState('+91 744 061 9649');
  const [address, setAddress] = useState('Behind Masjid, Bus Stand, Lakhnadon 480886');

  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultUnit, setDefaultUnit] = useState<ScrapUnit>('KG');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethod>('CASH');

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
      setDefaultPaymentMethod(biz.settings?.default_payment_method ?? 'CASH');
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
        default_payment_method: defaultPaymentMethod,
      });

      setIsSaved(true);
      setSaveMessage('सेटिंग्स सफलतापूर्वक सहेज ली गई हैं! (Settings updated successfully)');
      setTimeout(() => {
        setIsSaved(false);
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage('सेटिंग्स सेव करने में त्रुटि हुई।');
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
        alert('डेटा सफलतापूर्वक रीस्टोर हो गया! (Backup imported)');
        window.location.reload();
      } catch (err: any) {
        alert('बैकअप फ़ाइल लोड करने में त्रुटि: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('क्या आप सभी डेटा रीसेट करके 25 मुख्य सामानों की साफ़ सूची वापस लाना चाहते हैं? (Reset to 25 items clean state)')) {
      api.resetData();
      alert('डेटा साफ़ कर दिया गया है।');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl page-enter">
      <PageHeader
        title="Settings & Themes (सेटिंग्स व थीम)"
        subtitle="Theme switcher (System, Light, Dark), shop contact, and offline backup"
      />

      {saveMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            isSaved
              ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700'
              : 'bg-red-500/10 text-red-600 border border-red-500/30'
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* 1. Appearance & Theme Modes */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-black dark:text-white">
            Color Theme Mode (थीम रंग मोड)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Switch instantly between System default, Light, and Dark modes (no page reload)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* System Mode */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between btn-press ${
              theme === 'system'
                ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-900 shadow-xs'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <Laptop className="w-5 h-5 text-black dark:text-white" />
              {theme === 'system' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black dark:bg-white text-white dark:text-black">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="mt-4">
              <div className="text-xs font-bold text-black dark:text-white">System (डिफ़ॉल्ट)</div>
              <div className="text-[11px] text-zinc-500">Auto match OS</div>
            </div>
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              theme === 'light'
                ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-900 shadow-xs'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-5 h-5 text-black dark:text-white" />
              {theme === 'light' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black dark:bg-white text-white dark:text-black">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="mt-4">
              <div className="text-xs font-bold text-black dark:text-white">Light (लाइट मोड)</div>
              <div className="text-[11px] text-zinc-500">White background</div>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              theme === 'dark'
                ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-900 shadow-xs'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-5 h-5 text-black dark:text-white" />
              {theme === 'dark' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black dark:bg-white text-white dark:text-black">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="mt-4">
              <div className="text-xs font-bold text-black dark:text-white">Dark (डार्क मोड)</div>
              <div className="text-[11px] text-zinc-500">Pure Black theme</div>
            </div>
          </button>
        </div>

        {/* Active Logo Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
          <img
            src={logoSrc}
            alt="Mode Logo Preview"
            className="w-10 h-10 object-contain rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
          />
          <div>
            <div className="text-xs font-bold text-black dark:text-white">
              Active Logo: {resolvedTheme === 'dark' ? 'logodarkmode.svg' : 'logolightmode.svg'}
            </div>
            <div className="text-[11px] text-zinc-500">
              Changes dynamically based on light/dark mode
            </div>
          </div>
        </div>
      </div>

      {/* 2. Business Profile Settings */}
      <form onSubmit={handleSave} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-black dark:text-white">
            Business Details (दुकान व संपर्क विवरण)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Displayed on purchase bills, sale invoices, and reports
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-black dark:text-white mb-1">
              Business Name (व्यापार का नाम)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-black dark:text-white mb-1">
                Mobile Number (मोबाइल नंबर)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-black dark:text-white mb-1">
                Default Payment Method
              </label>
              <select
                value={defaultPaymentMethod}
                onChange={(e) => setDefaultPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-black dark:text-white outline-none"
              >
                <option value="CASH">Cash (नकद)</option>
                <option value="ONLINE">UPI / Online</option>
                <option value="CHEQUE">Bank / Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-black dark:text-white mb-1">
              Address (पता)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                className="rounded border-zinc-300 text-black focus:ring-0 w-4 h-4"
              />
              <span className="text-xs text-black dark:text-white font-medium">
                Allow Negative Stock (स्टॉक 0 होने पर भी बिक्री की अनुमति दें)
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings (सहेजें)</span>
          </button>
        </div>
      </form>

      {/* 3. Backup & Reset Section */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-black dark:text-white">
            Data Backup & Restore (डेटा बैकअप व रीसेट)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Export all records to JSON file or restore from a previous backup
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup JSON (डाउनलोड बैकअप)</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup JSON (रीस्टोर करें)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 dark:border-red-900/60 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Database (डेटा रीसेट)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
