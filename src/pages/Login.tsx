import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { resolvedTheme, setTheme, logoSrc } = useTheme();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsSubmitting(true);

    setTimeout(() => {
      const success = login(password, rememberMe);
      if (!success) {
        setError(true);
        setIsSubmitting(false);
      }
    }, 150);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">
      {/* Top Bar with Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors btn-press shadow-xs"
          title="Toggle Dark / Light Theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-zinc-300" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm sm:max-w-md page-enter">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-xl space-y-6">
          {/* Logo & Branding */}
          <div className="text-center space-y-3">
            <div className="inline-block p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <img
                src={logoSrc}
                alt="Raseed Traders Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white uppercase font-sans">
                Raseed Traders
              </h1>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                Scrap Management System (कबाड़ व्यापार प्रबंधन)
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें (Invalid password).</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-black dark:text-white"
              >
                Security Password (प्रवेश पासवर्ड)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter password (पासवर्ड दर्ज करें)"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm font-medium text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:ring-0 accent-black dark:accent-white"
                />
                <span>Remember on this device (याद रखें)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm font-bold hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md btn-press"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Login (प्रवेश करें)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure Footer Notice */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 text-center flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span>Encrypted System — Lakhnadon, Madhya Pradesh</span>
          </div>
        </div>
      </div>
    </div>
  );
};
