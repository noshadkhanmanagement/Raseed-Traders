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
  const pointerStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const currentPillXRef = useRef(0);
  const prevIndexRef = useRef<number>(activeIndex);
  const prevTouchXRef = useRef<number>(0);
  const dragVelocityRef = useRef<number>(0);

  // Exact geometric positioning calculation
  const getTabGeometry = useCallback((index: number) => {
    const tabEl = tabsRef.current[index];
    const container = containerRef.current;
    const inset = 3; // 3px breathing margin creates a perfect capsule

    if (tabEl && tabEl.offsetWidth > 0) {
      const w = Math.max(36, tabEl.offsetWidth - inset * 2);
      const x = tabEl.offsetLeft + inset;
      return { x, w };
    }

    if (container) {
      const numTabs = TABS.length;
      const tabW = (container.clientWidth - 12) / numTabs;
      return {
        x: 6 + index * tabW + inset,
        w: tabW - inset * 2,
      };
    }

    return { x: 0, w: 52 };
  }, []);

  // Liquid wobble physics animation sequence
  const triggerWobble = useCallback(
    (targetIndex: number, immediate = false, fromDrag = false) => {
      const pill = pillRef.current;
      if (!pill) return;

      const { x: targetX, w: targetW } = getTabGeometry(targetIndex);
      currentPillXRef.current = targetX;

      if (immediate) {
        gsap.set(pill, { x: targetX, width: targetW, scaleX: 1, scaleY: 1, skewX: 0 });
        prevIndexRef.current = targetIndex;
        return;
      }

      const prevIndex = prevIndexRef.current;
      const direction = targetIndex > prevIndex ? 1 : targetIndex < prevIndex ? -1 : 0;
      prevIndexRef.current = targetIndex;

      // Animate with liquid jelly physics
      const tl = gsap.timeline({ overwrite: 'auto' });

      // Translation & Width tween
      tl.to(
        pill,
        {
          x: targetX,
          width: targetW,
          skewX: 0,
          duration: fromDrag ? 0.44 : 0.42,
          ease: 'power3.out',
        },
        0
      );

      // Liquid Wobble / Squash & Stretch Rebound
      if (direction !== 0 || fromDrag) {
        const dir = direction !== 0 ? direction : 1;
        tl.to(
          pill,
          {
            scaleX: 1.20,
            scaleY: 0.84,
            skewX: -dir * 3.5,
            duration: 0.12,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              scaleX: 0.89,
              scaleY: 1.13,
              skewX: dir * 2,
              duration: 0.13,
              ease: 'power2.inOut',
            },
            0.12
          )
          .to(
            pill,
            {
              scaleX: 1.05,
              scaleY: 0.96,
              skewX: 0,
              duration: 0.09,
              ease: 'power1.out',
            },
            0.25
          )
          .to(
            pill,
            {
              scaleX: 0.98,
              scaleY: 1.02,
              duration: 0.07,
              ease: 'power1.out',
            },
            0.34
          )
          .to(
            pill,
            {
              scaleX: 1.0,
              scaleY: 1.0,
              duration: 0.07,
              ease: 'power1.out',
            },
            0.41
          );
      } else {
        // Subtle organic settling bounce
        tl.to(
          pill,
          {
            scaleX: 1.06,
            scaleY: 0.94,
            duration: 0.12,
            ease: 'power1.out',
          },
          0
        ).to(
          pill,
          {
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 0.3,
            ease: 'elastic.out(1.4, 0.4)',
          },
          0.12
        );
      }
    },
    [getTabGeometry]
  );

  // Sync on route change
  useEffect(() => {
    if (!isDraggingRef.current) {
      setHoverOrDragIndex(activeIndex);
      // Small frame delay ensures DOM button layout has resolved
      const raf = requestAnimationFrame(() => {
        triggerWobble(activeIndex);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [activeIndex, triggerWobble]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => triggerWobble(activeIndex, true);
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => triggerWobble(activeIndex, true), 60);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeIndex, triggerWobble]);

  // Drag to slide gesture system
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    isDraggingRef.current = false;
    prevTouchXRef.current = e.clientX;
    dragVelocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || !containerRef.current || !pillRef.current) return;

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    // Check if dragging threshold (4px) exceeded horizontally
    if (!isDraggingRef.current) {
      if (Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(dy)) {
        isDraggingRef.current = true;
        try {
          containerRef.current.setPointerCapture(pointerStartRef.current.id);
        } catch {}
        // Fluid gel compression response under finger
        gsap.to(pillRef.current, {
          scaleY: 0.91,
          scaleX: 1.08,
          duration: 0.12,
          ease: 'power1.out',
        });
      } else {
        return;
      }
    }

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const numTabs = TABS.length;
    const { w: tabW } = getTabGeometry(0);

    const vx = e.clientX - prevTouchXRef.current;
    prevTouchXRef.current = e.clientX;
    dragVelocityRef.current = vx;

    // Center pill on touch while clamping inside container
    const rawPillX = touchX - tabW / 2;
    const minX = (tabsRef.current[0]?.offsetLeft ?? 6) + 3;
    const lastTab = tabsRef.current[numTabs - 1];
    const maxX = lastTab
      ? lastTab.offsetLeft + lastTab.offsetWidth - tabW - 3
      : rect.width - tabW - 9;
    const clampedX = Math.max(minX, Math.min(maxX, rawPillX));

    // Dynamic liquid stretch & lean during finger drag
    const dynamicSkew = Math.max(-7, Math.min(7, -vx * 0.7));
    const dynamicScaleX = Math.min(1.22, 1.02 + Math.abs(vx) * 0.02);
    const dynamicScaleY = Math.max(0.84, 0.98 - Math.abs(vx) * 0.015);

    gsap.set(pillRef.current, {
      x: clampedX,
      width: tabW,
      scaleX: dynamicScaleX,
      scaleY: dynamicScaleY,
      skewX: dynamicSkew,
    });
    currentPillXRef.current = clampedX;

    // Detect closest tab under dragged pill center
    const pillCenter = clampedX + tabW / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    tabsRef.current.forEach((t, i) => {
      if (!t) return;
      const center = t.offsetLeft + t.offsetWidth / 2;
      const dist = Math.abs(center - pillCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    if (closestIdx !== hoverOrDragIndex) {
      setHoverOrDragIndex(closestIdx);
      try {
        navigator.vibrate?.(8);
      } catch {}
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;
    pointerStartRef.current = null;

    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (!wasDragging) {
      return; // Regular click will fire directly on the tab button
    }

    // If was dragging, snap to nearest tab and navigate
    const { w: tabW } = getTabGeometry(0);
    const pillCenter = currentPillXRef.current + tabW / 2;

    let finalIndex = 0;
    let closestDist = Infinity;
    tabsRef.current.forEach((t, i) => {
      if (!t) return;
      const center = t.offsetLeft + t.offsetWidth / 2;
      const dist = Math.abs(center - pillCenter);
      if (dist < closestDist) {
        closestDist = dist;
        finalIndex = i;
      }
    });

    setHoverOrDragIndex(finalIndex);
    triggerWobble(finalIndex, false, true);

    const targetRoute = TABS[finalIndex].to;
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
  };

  const handleTabClick = (to: string, idx: number) => {
    setHoverOrDragIndex(idx);
    triggerWobble(idx, false, false);
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
          {/* LIQUID FROSTED GLASS BLURRED ACTIVE PILL WITH SPECULAR REFLECTION */}
          <div
            ref={pillRef}
            className="absolute left-0 top-1.5 bottom-1.5 rounded-full pointer-events-none backdrop-blur-2xl bg-zinc-900/[0.08] dark:bg-white/[0.16] border border-black/[0.12] dark:border-white/[0.28] shadow-[0_4px_18px_rgba(0,0,0,0.1),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_26px_rgba(0,0,0,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.65),inset_0_-1px_2px_rgba(255,255,255,0.15)] overflow-hidden will-change-transform"
          >
            {/* 1. Meniscus Top Dome Flare Reflection */}
            <div
              className="absolute inset-x-1 top-0 h-[52%] rounded-t-full pointer-events-none opacity-90 dark:opacity-85"
              style={{
                background:
                  'radial-gradient(ellipse 75% 85% at 50% 0%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 45%, transparent 80%)',
              }}
            />

            {/* 2. Angled Diagonal Light Sheen */}
            <div
              className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-50"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 35%, transparent 65%)',
              }}
            />

            {/* 3. Top Arc Specular Highlight Rim Line */}
            <div
              className="absolute inset-x-2 top-0 h-[1.5px] pointer-events-none"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 65%, transparent)',
              }}
            />

            {/* 4. Bottom Refractive Caustic Rim */}
            <div
              className="absolute inset-x-2.5 bottom-0 h-[1px] pointer-events-none opacity-75 dark:opacity-40"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent)',
              }}
            />
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
                    isActive
                      ? 'scale-110 -translate-y-0.5'
                      : 'scale-100 opacity-80 group-hover:opacity-100'
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
