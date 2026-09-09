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
  const isPointerDownRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; id: number; time: number } | null>(null);
  const dragOffsetXRef = useRef<number>(0);
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
          duration: fromDrag ? 0.44 : 0.40,
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
            skewX: -dir * 3.2,
            duration: 0.12,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              scaleX: 0.88,
              scaleY: 1.14,
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
              duration: 0.08,
              ease: 'power1.out',
            },
            0.41
          );
      } else {
        // Tapped active tab: joyful bubble wobble & expand bounce
        tl.to(
          pill,
          {
            scaleX: 1.18,
            scaleY: 0.85,
            duration: 0.10,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              scaleX: 0.88,
              scaleY: 1.14,
              duration: 0.12,
              ease: 'power2.inOut',
            },
            0.10
          )
          .to(
            pill,
            {
              scaleX: 1.06,
              scaleY: 0.96,
              duration: 0.09,
              ease: 'power1.out',
            },
            0.22
          )
          .to(
            pill,
            {
              scaleX: 1.0,
              scaleY: 1.0,
              duration: 0.18,
              ease: 'elastic.out(1.3, 0.35)',
            },
            0.31
          );
      }
    },
    [getTabGeometry]
  );

  // Sync on route change
  useEffect(() => {
    if (!isDraggingRef.current && !isPointerDownRef.current) {
      setHoverOrDragIndex(activeIndex);
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

  // Touch Down / Hold Physics
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current || !pillRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      time: Date.now(),
    };
    prevTouchXRef.current = e.clientX;
    dragVelocityRef.current = 0;

    // Record offset from current pill position so drag begins with ZERO jumping
    dragOffsetXRef.current = touchX - currentPillXRef.current;

    // Capture pointer immediately for seamless gesture tracking
    try {
      containerRef.current.setPointerCapture(e.pointerId);
    } catch {}

    // INSTANT TOUCH-DOWN RESPONSE:
    // Compress and expand bubble into active lifted draggable state
    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      scaleX: 1.14,
      scaleY: 0.88,
      duration: 0.12,
      ease: 'power2.out',
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !pointerStartRef.current || !containerRef.current || !pillRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const dx = e.clientX - pointerStartRef.current.x;

    // Calculate drag velocity for fluid physics
    const vx = e.clientX - prevTouchXRef.current;
    prevTouchXRef.current = e.clientX;
    dragVelocityRef.current = vx;

    // Enter dragging state smoothly as finger moves > 3px
    if (!isDraggingRef.current) {
      if (Math.abs(dx) > 3) {
        isDraggingRef.current = true;
      } else {
        return;
      }
    }

    const numTabs = TABS.length;
    const { w: tabW } = getTabGeometry(0);

    // Target X computed directly relative to grab position (Zero Initial Jump!)
    const targetX = touchX - dragOffsetXRef.current;

    const minX = (tabsRef.current[0]?.offsetLeft ?? 6) + 3;
    const lastTab = tabsRef.current[numTabs - 1];
    const maxX = lastTab
      ? lastTab.offsetLeft + lastTab.offsetWidth - tabW - 3
      : rect.width - tabW - 9;

    // Rubber-band resistance at boundaries (iOS fluid scroll physics)
    let clampedX = targetX;
    if (targetX < minX) {
      clampedX = minX - Math.pow(minX - targetX, 0.72);
    } else if (targetX > maxX) {
      clampedX = maxX + Math.pow(targetX - maxX, 0.72);
    }

    // Dynamic liquid stretch & lean in direction of drag
    const dynamicSkew = Math.max(-6, Math.min(6, -vx * 0.45));
    const dynamicScaleX = Math.min(1.22, 1.08 + Math.abs(vx) * 0.02);
    const dynamicScaleY = Math.max(0.85, 0.94 - Math.abs(vx) * 0.015);

    gsap.set(pillRef.current, {
      x: clampedX,
      width: tabW,
      scaleX: dynamicScaleX,
      scaleY: dynamicScaleY,
      skewX: dynamicSkew,
    });
    currentPillXRef.current = clampedX;

    // Real-time tab highlight under dragged pill center
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
        navigator.vibrate?.(6);
      } catch {}
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const wasDragging = isDraggingRef.current;
    const pointerStart = pointerStartRef.current;
    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    pointerStartRef.current = null;

    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }

    const { w: tabW } = getTabGeometry(0);

    // If dragged: calculate destination with momentum spring
    if (wasDragging) {
      const projectedCenter = currentPillXRef.current + tabW / 2 + dragVelocityRef.current * 0.08;

      let finalIndex = 0;
      let closestDist = Infinity;
      tabsRef.current.forEach((t, i) => {
        if (!t) return;
        const center = t.offsetLeft + t.offsetWidth / 2;
        const dist = Math.abs(center - projectedCenter);
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
      return;
    }

    // If tapped (press & release without dragging):
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !pointerStart) return;

    const touchX = pointerStart.x - rect.left;
    let tappedIdx = -1;
    tabsRef.current.forEach((t, i) => {
      if (!t) return;
      if (touchX >= t.offsetLeft && touchX <= t.offsetLeft + t.offsetWidth) {
        tappedIdx = i;
      }
    });

    if (tappedIdx !== -1) {
      const isAlreadyActive = tappedIdx === activeIndex;
      setHoverOrDragIndex(tappedIdx);
      triggerWobble(tappedIdx, false, false);

      if (!isAlreadyActive) {
        navigate(TABS[tappedIdx].to);
      }
    } else {
      // Settle back to active index
      triggerWobble(activeIndex, false, false);
    }
  };

  const handleTabClick = (to: string, idx: number) => {
    // Fallback click handler if not intercepted by pointer gesture
    if (isDraggingRef.current) return;
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
          className="relative pointer-events-auto w-full max-w-md h-[64px] p-1.5 rounded-full bg-white/75 dark:bg-zinc-900/80 backdrop-blur-3xl border border-zinc-200/85 dark:border-zinc-800 shadow-[0_12px_40px_rgba(0,0,0,0.12),0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] flex items-center justify-between touch-none select-none ring-1 ring-black/[0.03] dark:ring-white/[0.04]"
        >
          {/* LIQUID FROSTED GLASS ACTIVE PILL (Refined Subtle Dark Mode with NO Overpowering Glow) */}
          <div
            ref={pillRef}
            className="absolute left-0 top-1.5 bottom-1.5 rounded-full pointer-events-none backdrop-blur-2xl bg-zinc-900/[0.08] dark:bg-zinc-700/35 border border-black/[0.12] dark:border-white/[0.12] shadow-[0_4px_18px_rgba(0,0,0,0.1),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.18)] overflow-hidden will-change-transform"
          >
            {/* 1. Meniscus Top Dome Flare Reflection (Subtle in Dark Mode) */}
            <div
              className="absolute inset-x-1 top-0 h-[48%] rounded-t-full pointer-events-none opacity-90 dark:opacity-15"
              style={{
                background:
                  'radial-gradient(ellipse 75% 85% at 50% 0%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 45%, transparent 80%)',
              }}
            />

            {/* 2. Angled Diagonal Light Sheen (Subtle in Dark Mode) */}
            <div
              className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 35%, transparent 65%)',
              }}
            />

            {/* 3. Top Arc Specular Highlight Rim Line */}
            <div
              className="absolute inset-x-2 top-0 h-[1.5px] pointer-events-none opacity-95 dark:opacity-20"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 65%, transparent)',
              }}
            />

            {/* 4. Bottom Refractive Caustic Rim */}
            <div
              className="absolute inset-x-2.5 bottom-0 h-[1px] pointer-events-none opacity-75 dark:opacity-10"
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

