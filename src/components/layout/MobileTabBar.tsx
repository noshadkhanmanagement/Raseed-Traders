import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  NavStock,
  NavAnalytics,
  NavSettings,
} from '../common/Icons';

interface TabItem {
  to: string;
  label: string;
  icon: React.FC<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
}

const TABS: TabItem[] = [
  { to: '/', label: 'Stock', icon: NavStock },
  { to: '/analytics', label: 'Hisab', icon: NavAnalytics },
  { to: '/settings', label: 'Settings', icon: NavSettings },
];

export const MobileTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Find active index
  const getActiveIndex = useCallback((pathname: string) => {
    if (pathname === '/' || pathname === '/inventory' || pathname === '/purchases' || pathname === '/sales') {
      return 0;
    }
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
    const inset = 4; // Capsule inset padding

    if (tabEl && tabEl.offsetWidth > 0) {
      const w = Math.max(48, tabEl.offsetWidth - inset * 2);
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

    return { x: 0, w: 64 };
  }, []);

  // Liquid wobble physics animation sequence (iOS smooth, slightly slowed harmonic timing)
  const triggerWobble = useCallback(
    (targetIndex: number, immediate = false, fromDrag = false) => {
      const pill = pillRef.current;
      if (!pill) return;

      // Kill any in-flight tweens for buttery smooth transition
      gsap.killTweensOf(pill);

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

      const tl = gsap.timeline({ overwrite: 'auto' });

      // Translation & Width tween with smooth iOS power3 curve
      tl.to(
        pill,
        {
          x: targetX,
          width: targetW,
          skewX: 0,
          duration: fromDrag ? 0.48 : 0.44,
          ease: 'power3.out',
        },
        0
      );

      // Smooth slightly slowed iOS harmonic wobble (2 natural damped cycles)
      if (direction !== 0 || fromDrag) {
        const dir = direction !== 0 ? direction : 1;
        tl.to(
          pill,
          {
            scaleX: 1.15,
            scaleY: 0.88,
            skewX: -dir * 3.5,
            duration: 0.16,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              scaleX: 0.92,
              scaleY: 1.08,
              skewX: dir * 2.0,
              duration: 0.16,
              ease: 'power2.inOut',
            },
            0.16
          )
          .to(
            pill,
            {
              scaleX: 1.03,
              scaleY: 0.98,
              skewX: -dir * 0.8,
              duration: 0.12,
              ease: 'power1.out',
            },
            0.32
          )
          .to(
            pill,
            {
              scaleX: 1.0,
              scaleY: 1.0,
              skewX: 0,
              duration: 0.08,
              ease: 'power1.inOut',
            },
            0.44
          );
      }
    },
    [getTabGeometry]
  );

  // Sync pill geometry on active index or layout resize
  useEffect(() => {
    setHoverOrDragIndex(activeIndex);
    triggerWobble(activeIndex, false, false);
  }, [activeIndex, triggerWobble]);

  useEffect(() => {
    const handleResize = () => triggerWobble(activeIndex, true);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex, triggerWobble]);

  // Pointer Down: Grab pill with ZERO initial shift/jitter
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current || !pillRef.current) return;

    // Immediately stop any active animations to eliminate fight/jitter
    gsap.killTweensOf(pillRef.current);

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;

    // Detect touched tab
    let touchedIdx = -1;
    tabsRef.current.forEach((t, i) => {
      if (!t) return;
      if (touchX >= t.offsetLeft && touchX <= t.offsetLeft + t.offsetWidth) {
        touchedIdx = i;
      }
    });

    if (touchedIdx === -1) {
      touchedIdx = Math.max(
        0,
        Math.min(TABS.length - 1, Math.floor((touchX / rect.width) * TABS.length))
      );
    }

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

    // Measure visual position of pill right now to ensure 100% ZERO jump when finger touches
    const visualX = (gsap.getProperty(pillRef.current, 'x') as number) || currentPillXRef.current;
    currentPillXRef.current = visualX;
    dragOffsetXRef.current = touchX - visualX;

    setHoverOrDragIndex(touchedIdx);

    try {
      containerRef.current.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !pointerStartRef.current || !containerRef.current || !pillRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const dx = e.clientX - pointerStartRef.current.x;

    // Calculate drag velocity for smooth directional wobble lean
    const vx = e.clientX - prevTouchXRef.current;
    prevTouchXRef.current = e.clientX;
    dragVelocityRef.current = vx;

    // Smoothly enter dragging state past 3px threshold
    if (!isDraggingRef.current) {
      if (Math.abs(dx) > 3) {
        isDraggingRef.current = true;
      } else {
        return;
      }
    }

    const numTabs = TABS.length;
    const { w: tabW } = getTabGeometry(0);

    // Target X computed directly relative to touch offset (Zero Initial Jump!)
    const targetX = touchX - dragOffsetXRef.current;

    const minX = (tabsRef.current[0]?.offsetLeft ?? 6) + 4;
    const lastTab = tabsRef.current[numTabs - 1];
    const maxX = lastTab
      ? lastTab.offsetLeft + lastTab.offsetWidth - tabW - 4
      : rect.width - tabW - 10;

    // Fluid rubber-band physics at boundaries
    let clampedX = targetX;
    if (targetX < minX) {
      clampedX = minX - Math.pow(minX - targetX, 0.70);
    } else if (targetX > maxX) {
      clampedX = maxX + Math.pow(targetX - maxX, 0.70);
    }

    // Directional liquid wobble lean:
    // Drag right (vx > 0) -> leans right (negative skew)
    // Drag left (vx < 0) -> leans left (positive skew)
    const dynamicSkew = Math.max(-6, Math.min(6, -vx * 0.45));
    const dynamicScaleX = Math.min(1.18, 1.04 + Math.abs(vx) * 0.015);
    const dynamicScaleY = Math.max(0.88, 0.96 - Math.abs(vx) * 0.012);

    gsap.set(pillRef.current, {
      x: clampedX,
      width: tabW,
      scaleX: dynamicScaleX,
      scaleY: dynamicScaleY,
      skewX: dynamicSkew,
    });
    currentPillXRef.current = clampedX;

    // Real-time active tab detection under pill center
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
    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    pointerStartRef.current = null;

    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }

    const { w: tabW } = getTabGeometry(0);

    if (wasDragging) {
      // Find destination with momentum spring
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
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      return;
    }

    // Tapped: Smoothly animate to tapped index
    const targetIdx = hoverOrDragIndex;
    triggerWobble(targetIdx, false, false);

    const targetRoute = TABS[targetIdx].to;
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handleTabClick = (to: string, idx: number) => {
    if (isDraggingRef.current) return;
    setHoverOrDragIndex(idx);
    triggerWobble(idx, false, false);
    if (location.pathname !== to) {
      navigate(to);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* iOS Top Ambient Fade */}
      <div
        aria-hidden="true"
        className="md:hidden fixed top-0 left-0 right-0 h-10 pointer-events-none z-30 bg-gradient-to-b from-white/90 dark:from-black/90 to-transparent backdrop-blur-[2px]"
      />

      {/* iOS Bottom Ambient Fade Up */}
      <div
        aria-hidden="true"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none h-28 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-black dark:via-black/85 dark:to-transparent select-none"
      />

      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-auto select-none"
      >
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative pointer-events-auto flex items-center p-1.5 rounded-full bg-white/75 dark:bg-zinc-900/80 backdrop-blur-3xl border border-zinc-200/85 dark:border-zinc-800 shadow-[0_12px_40px_rgba(0,0,0,0.12),0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] ring-1 ring-black/[0.03] dark:ring-white/[0.04] w-full max-w-sm h-14 touch-none select-none"
          style={{ willChange: 'transform' }}
        >
          {/* LIQUID FROSTED GLASS ACTIVE PILL (With Specular Optical Highlights) */}
          <div
            ref={pillRef}
            className="absolute top-1.5 bottom-1.5 rounded-full pointer-events-none z-0 backdrop-blur-2xl bg-zinc-900/[0.08] dark:bg-zinc-700/35 border border-black/[0.12] dark:border-white/[0.12] shadow-[0_4px_18px_rgba(0,0,0,0.1),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.18)] overflow-hidden will-change-transform"
            style={{
              transformOrigin: '50% 50%',
              willChange: 'transform, width',
            }}
          >
            {/* 1. Meniscus Top Dome Flare Reflection */}
            <div
              className="absolute inset-x-1 top-0 h-[48%] rounded-t-full pointer-events-none opacity-90 dark:opacity-15"
              style={{
                background:
                  'radial-gradient(ellipse 75% 85% at 50% 0%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 45%, transparent 80%)',
              }}
            />

            {/* 2. Angled Diagonal Light Sheen */}
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

          {/* Tab Options */}
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isSelected = hoverOrDragIndex === idx;

            return (
              <button
                key={tab.to}
                ref={(el) => {
                  tabsRef.current[idx] = el;
                }}
                type="button"
                onClick={() => handleTabClick(tab.to, idx)}
                aria-label={tab.label}
                aria-current={isSelected ? 'page' : undefined}
                className={`relative z-10 flex-1 h-full flex flex-col items-center justify-center gap-0.5 rounded-full outline-none transition-colors duration-200 cursor-pointer ${
                  isSelected
                    ? 'text-black dark:text-white font-extrabold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={isSelected ? 2.4 : 1.8}
                  className={`transition-all duration-200 ${
                    isSelected
                      ? 'scale-110 -translate-y-0.5'
                      : 'scale-100 opacity-80 group-hover:opacity-100'
                  }`}
                />
                <span
                  className={`text-[10px] tracking-tight leading-none font-sans transition-all duration-200 ${
                    isSelected ? 'font-black' : 'font-semibold'
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
