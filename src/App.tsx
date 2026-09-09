import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { ScrollToTop } from './components/common/ScrollToTop';

// Zero-lag route code-splitting for 1000/1000 performance
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const AnalyticsPage = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

// Sleek instant route fallback indicator
const PageFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[40vh] w-full" aria-busy="true">
    <div className="flex flex-col items-center gap-2">
      <div className="w-5 h-5 rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-black dark:border-t-white animate-spin" />
      <span className="text-[10px] font-bold text-zinc-400 font-sans tracking-wide">Loading...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Navigate to="/" replace />} />
            <Route path="purchases" element={<Navigate to="/" replace />} />
            <Route path="sales" element={<Navigate to="/" replace />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="hisab" element={<AnalyticsPage />} />
            <Route path="reports" element={<Navigate to="/analytics" replace />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
