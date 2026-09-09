import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  NavHome,
  NavBuy,
  NavStock,
  NavSell,
  NavAnalytics,
  NavSettings,
} from '../common/Icons';

interface TabItem {
  to: string;
  label: string;
  icon: React.FC<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
}

const TABS: TabItem[] = [
  { to: '/', label: 'Home', icon: NavHome },
  { to: '/purchases', label: 'Buy', icon: NavBuy },
  { to: '/inventory', label: 'Stock', icon: NavStock },
  { to: '/sales', label: 'Sell', icon: NavSell },
  { to: '/analytics', label: 'Hisab', icon: NavAnalytics },
  { to: '/settings', label: 'Settings', icon: NavSettings },
];

export const MobileTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Find active index
  const getActiveIndex = useCallback((pathname: string) => {
    if (pathname === '/') return 0;
    const idx = TABS.findIndex((t) => t.to !== '/' && pathname.startsWith(t.to));
    return idx !== -1 ? idx : 0;
  }, []);

  const activeIndex = getActiveIndex(location.pathname);
  const [hoverOrDragIndex, setHoverOrDragIndex] = useState<number>(activeIndex);

  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const isDraggingRef = useRef(false);
  const currentPillXRef = useRef(0);
  const tabWidthRef = useRef(0);

  // Sync pill position with active index via GSAP
  const updatePillPosition = useCallback(
    (index: number, immediate = false) => {
      const container = containerRef.current;
      const pill = pillRef.current;
      if (!container || !pill) return;

      const numTabs = TABS.length;
      const padding = 6;
      const containerWidth = container.clientWidth;
      const usableWidth = containerWidth - padding * 2;
      const tabWidth = usableWidth / numTabs;
      tabWidthRef.current = tabWidth;

      const targetX = padding + index * tabWidth;
      currentPillXRef.current = targetX;

      if (immediate) {
        gsap.set(pill, { x: targetX, width: tabWidth });
      } else {
        gsap.to(pill, {
          x: targetX,
          width: tabWidth,
          duration: 0.38,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!isDraggingRef.current) {
      setHoverOrDragIndex(activeIndex);
      updatePillPosition(activeIndex);
    }
  }, [activeIndex, updatePillPosition]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updatePillPosition(activeIndex, true);
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => updatePillPosition(activeIndex, true), 50);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeIndex, updatePillPosition]);

  // Drag to slide gesture system
  const handlePointerDown = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;

    try {
      container.setPointerCapture(e.pointerId);
    } catch {}

    isDraggingRef.current = true;

    const rect = container.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const numTabs = TABS.length;
    const tabWidth = (rect.width - 12) / numTabs;
    tabWidthRef.current = tabWidth;

    const touchedIndex = Math.min(
      numTabs - 1,
      Math.max(0, Math.floor((touchX - 6) / tabWidth))
    );
    setHoverOrDragIndex(touchedIndex);

    if (pillRef.current) {
      gsap.to(pillRef.current, {
        scaleY: 0.94,
        scaleX: 1.04,
        duration: 0.15,
        ease: 'power1.out',
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current || !pillRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const numTabs = TABS.length;
    const tabWidth = tabWidthRef.current || (rect.width - 12) / numTabs;

    // Center pill on touch while clamping inside container
    const rawPillX = touchX - tabWidth / 2;
    const clampedX = Math.max(6, Math.min(rect.width - tabWidth - 6, rawPillX));

    gsap.set(pillRef.current, { x: clampedX, width: tabWidth });
    currentPillXRef.current = clampedX;

    const currentIndex = Math.min(
      numTabs - 1,
      Math.max(0, Math.round((clampedX - 6) / tabWidth))
    );

    if (currentIndex !== hoverOrDragIndex) {
      setHoverOrDragIndex(currentIndex);
      try {
        navigator.vibrate?.(8);
      } catch {}
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    isDraggingRef.current = false;

    try {
      containerRef.current.releasePointerCapture(e.pointerId);
    } catch {}

    const rect = containerRef.current.getBoundingClientRect();
    const numTabs = TABS.length;
    const tabWidth = tabWidthRef.current || (rect.width - 12) / numTabs;

    // Find nearest tab index on release
    const finalIndex = Math.min(
      numTabs - 1,
      Math.max(0, Math.round((currentPillXRef.current - 6) / tabWidth))
    );

    setHoverOrDragIndex(finalIndex);

    // Spring snap to nearest tab with GSAP
    if (pillRef.current) {
      const targetX = 6 + finalIndex * tabWidth;
      gsap.to(pillRef.current, {
        x: targetX,
        scaleX: 1,
        scaleY: 1,
        duration: 0.42,
        ease: 'back.out(1.2)',
        overwrite: 'auto',
      });
    }

    const targetRoute = TABS[finalIndex].to;
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
  };

  const handleTabClick = (to: string, idx: number) => {
    setHoverOrDragIndex(idx);
    updatePillPosition(idx);
    if (location.pathname !== to) {
      navigate(to);
    }
  };

  return (
    <>
      {/* iOS Bottom Ambient Fade Up (down below nav bar pill like exact iPhone) */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none h-28 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-black dark:via-black/85 dark:to-transparent select-none"
        aria-hidden="true"
      />

      {/* iOS Floating Pill Navigation Bar */}
      <nav className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-0 right-0 z-40 px-3 pointer-events-none select-none flex justify-center">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative pointer-events-auto w-full max-w-md h-[64px] p-1.5 rounded-full bg-white/75 dark:bg-zinc-900/75 backdrop-blur-3xl border border-zinc-200/85 dark:border-zinc-800/85 shadow-[0_12px_40px_rgba(0,0,0,0.12),0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.65),0_2px_10px_rgba(0,0,0,0.35)] flex items-center justify-between touch-none select-none ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
        >
          {/* LIQUID FROSTED GLASS BLURRED ACTIVE PILL */}
          <div
            ref={pillRef}
            className="absolute top-1.5 bottom-1.5 rounded-full pointer-events-none backdrop-blur-2xl bg-black/[0.08] dark:bg-white/[0.16] border border-black/[0.09] dark:border-white/[0.24] shadow-[0_4px_18px_rgba(0,0,0,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45),inset_0_1px_1.5px_rgba(255,255,255,0.35)] overflow-hidden"
          >
            {/* Specular reflection line across the top of the pill */}
            <div className="absolute inset-x-2 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/60 to-transparent pointer-events-none" />
          </div>

          {/* TAB BUTTONS */}
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = idx === hoverOrDragIndex;

            return (
              <button
                key={tab.to}
                type="button"
                ref={(el) => {
                  tabsRef.current[idx] = el;
                }}
                onClick={() => handleTabClick(tab.to, idx)}
                className={`group relative z-10 flex flex-col items-center justify-center flex-1 h-full py-1 rounded-full cursor-pointer transition-colors duration-200 active:scale-[0.92] ${
                  isActive
                    ? 'text-black dark:text-white font-extrabold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={`transition-all duration-200 ${
                    isActive ? 'scale-110' : 'scale-100 opacity-80 group-hover:opacity-100'
                  }`}
                />
                <span
                  className={`text-[10px] leading-tight mt-0.5 tracking-tight truncate max-w-full text-center transition-all duration-200 ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
