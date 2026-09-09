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
  const currentPillYRef = useRef(0);
  const prevIndexRef = useRef<number>(activeIndex);
  const prevTouchXRef = useRef<number>(0);
  const prevTouchYRef = useRef<number>(0);
  const dragVelocityRef = useRef<number>(0);
  const dragVelocityYRef = useRef<number>(0);

  // Exact geometric positioning calculation (296px width, 4px inset, exactly 96px per tab)
  const getTabGeometry = useCallback((index: number) => {
    const tabEl = tabsRef.current[index];
    const container = containerRef.current;
    if (tabEl && container) {
      const cRect = container.getBoundingClientRect();
      const tRect = tabEl.getBoundingClientRect();
      const borderLeft = container.clientLeft || 0;
      // True padding-box coordinate of tab
      const x = tRect.left - cRect.left - borderLeft;
      const w = tRect.width;
      if (w > 0) {
        return { x, w };
      }
    }

    // Mathematical constant: 3px padding, exactly 96px per tab
    return { x: 3 + index * 96, w: 96 };
  }, []);

  // Liquid wobble physics animation sequence (Equal Side Jiggle + Up/Down Jiggle)
  const triggerWobble = useCallback(
    (targetIndex: number, immediate = false, fromDrag = false) => {
      const pill = pillRef.current;
      if (!pill) return;

      // Kill any in-flight tweens for buttery smooth transition
      gsap.killTweensOf(pill);

      const { x: targetX, w: targetW } = getTabGeometry(targetIndex);
      currentPillXRef.current = targetX;
      currentPillYRef.current = 0;

      if (immediate) {
        gsap.set(pill, { x: targetX, y: 0, width: targetW, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 });
        prevIndexRef.current = targetIndex;
        return;
      }

      const prevIndex = prevIndexRef.current;
      const direction = targetIndex > prevIndex ? 1 : targetIndex < prevIndex ? -1 : 0;
      prevIndexRef.current = targetIndex;

      const currentY = (gsap.getProperty(pill, 'y') as number) || 0;

      const tl = gsap.timeline({ overwrite: 'auto' });

      // Horizontal Translation & Width tween with smooth iOS power3 curve
      tl.to(
        pill,
        {
          x: targetX,
          width: targetW,
          duration: fromDrag ? 0.42 : 0.38,
          ease: 'power3.out',
        },
        0
      );

      // Coupled 2D Liquid Wobble (Equal Micro-Jiggle on Lateral & Vertical Axes)
      if (direction !== 0 || fromDrag) {
        const dir = direction !== 0 ? direction : 1;
        // Dynamic Y snap depending on release state (contained to ~2px)
        let yPhase1 = 1.8;
        let yPhase2 = -1.5;

        if (fromDrag && Math.abs(currentY) > 0.5) {
          if (currentY < 0) {
            yPhase1 = Math.min(2.5, -currentY * 0.6);
            yPhase2 = -1.2;
          } else {
            yPhase1 = Math.max(-2.5, -currentY * 0.6);
            yPhase2 = 1.2;
          }
        }

        tl.to(
          pill,
          {
            // Phase 1: Micro-Impact & Symmetrical Relaxation
            x: targetX + dir * 2.5,
            y: yPhase1,
            scaleX: 1.03,
            scaleY: 1.03,
            skewX: -dir * 2.5,
            skewY: 0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              // Phase 2: Recoil
              x: targetX - dir * 1.2,
              y: yPhase2,
              scaleX: 0.99,
              scaleY: 0.99,
              skewX: dir * 1.2,
              duration: 0.14,
              ease: 'power2.inOut',
            },
            0.14
          )
          .to(
            pill,
            {
              // Phase 3: Settle to exact 1.0 rest
              x: targetX,
              y: 0,
              scaleX: 1.0,
              scaleY: 1.0,
              skewX: 0,
              skewY: 0,
              duration: 0.10,
              ease: 'power1.out',
            },
            0.28
          );
      } else {
        // Balanced 2D Liquid Tap Pulse: uniform expansion & pop
        tl.to(
          pill,
          {
            y: 0,
            scaleY: 1.05,
            scaleX: 1.05,
            skewX: 0,
            duration: 0.12,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              y: 0,
              scaleY: 0.99,
              scaleX: 0.99,
              skewX: 0,
              duration: 0.14,
              ease: 'power2.inOut',
            },
            0.12
          )
          .to(
            pill,
            {
              y: 0,
              scaleY: 1.0,
              scaleX: 1.0,
              skewX: 0,
              duration: 0.10,
              ease: 'power1.out',
            },
            0.26
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

  // Pointer Down: Apple Uniform Omnidirectional Growth (All 4 sides expand equally by ~5%)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current || !pillRef.current) return;

    // Immediately stop any active animations to eliminate fight/jitter
    gsap.killTweensOf(pillRef.current);

    const rect = containerRef.current.getBoundingClientRect();
    const borderLeft = containerRef.current.clientLeft || 0;
    const touchX = e.clientX - rect.left - borderLeft;

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
    prevTouchYRef.current = e.clientY;
    dragVelocityRef.current = 0;
    dragVelocityYRef.current = 0;

    // Measure visual position of pill right now to ensure 100% ZERO jump when finger touches
    const visualX = (gsap.getProperty(pillRef.current, 'x') as number) || currentPillXRef.current;
    currentPillXRef.current = visualX;
    dragOffsetXRef.current = touchX - visualX;

    setHoverOrDragIndex(touchedIdx);

    // Apple Touch & Hold Physics: Omnidirectional Symmetrical Growth
    // Expands outward uniformly by 1.05 from center (50% 50%) on all four sides (top, bottom, left, right)
    gsap.to(pillRef.current, {
      y: 0,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 0.16,
      ease: 'power2.out',
    });

    try {
      containerRef.current.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !pointerStartRef.current || !containerRef.current || !pillRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const borderLeft = containerRef.current.clientLeft || 0;
    const touchX = e.clientX - rect.left - borderLeft;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    // Calculate velocities
    const vx = e.clientX - prevTouchXRef.current;
    const vy = e.clientY - prevTouchYRef.current;
    prevTouchXRef.current = e.clientX;
    prevTouchYRef.current = e.clientY;
    dragVelocityRef.current = vx;
    dragVelocityYRef.current = vy;

    // Smoothly enter dragging state past 3px threshold in any direction
    if (!isDraggingRef.current) {
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true;
      } else {
        return;
      }
    }

    const tabW = 96;

    // Target X computed directly relative to touch offset (Zero Initial Jump!)
    const targetX = touchX - dragOffsetXRef.current;

    const minX = 3;
    const maxX = 195; // 3 + 2 * 96

    // Strictly contained horizontal rubber-band bounds: asymptotic clamp to at most 4px outside
    let clampedX = targetX;
    if (targetX < minX) {
      const excess = minX - targetX;
      clampedX = minX - (1 - Math.exp(-excess / 25)) * 4.0;
    } else if (targetX > maxX) {
      const excess = targetX - maxX;
      clampedX = maxX + (1 - Math.exp(-excess / 25)) * 4.0;
    }

    // Strictly contained vertical draggability: asymptotic clamp to at most 4px outside (Up & Down equal)
    let clampedY = 0;
    if (dy < 0) {
      // Dragged UP: strictly clamped to at most -4.0px
      clampedY = -(1 - Math.exp(-Math.abs(dy) / 25)) * 4.0;
    } else if (dy > 0) {
      // Dragged DOWN: strictly clamped to at most +4.0px
      clampedY = (1 - Math.exp(-Math.abs(dy) / 25)) * 4.0;
    }

    // Directional micro-skew (subtle, max ±3 deg)
    const dynamicSkew = Math.max(-3.0, Math.min(3.0, -vx * 0.25));
    const dynamicSkewY = Math.max(-2.0, Math.min(2.0, vy * 0.15));

    // Maintain uniform touch growth during drag (scale: 1.05)
    const speed = Math.sqrt(vx * vx + vy * vy);
    const dynamicScale = Math.min(1.06, 1.05 + speed * 0.001);

    gsap.set(pillRef.current, {
      x: clampedX,
      y: clampedY,
      width: tabW,
      scaleX: dynamicScale,
      scaleY: dynamicScale,
      skewX: dynamicSkew,
      skewY: dynamicSkewY,
    });
    currentPillXRef.current = clampedX;
    currentPillYRef.current = clampedY;

    // Real-time active tab detection under pill center
    const pillCenter = clampedX + tabW / 2;
    let closestIdx = 0;
    if (pillCenter < 99) {
      closestIdx = 0;
    } else if (pillCenter < 195) {
      closestIdx = 1;
    } else {
      closestIdx = 2;
    }

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

    const tabW = 96;

    if (wasDragging) {
      // Find destination with momentum spring
      const projectedCenter = currentPillXRef.current + tabW / 2 + dragVelocityRef.current * 0.08;

      let finalIndex = 0;
      if (projectedCenter < 99) {
        finalIndex = 0;
      } else if (projectedCenter < 195) {
        finalIndex = 1;
      } else {
        finalIndex = 2;
      }

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
      {/* iOS Bottom Atmospheric Dissolve Gradient */}
      <div
        aria-hidden="true"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none h-32 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-black dark:via-black/85 dark:to-transparent select-none"
      />

      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom,20px))] z-50 flex justify-center pointer-events-none select-none"
      >
        {/* Apple iOS 26 GlassEffectContainer (Primary Capsule: 52pt Height, 26pt Radius, 296px Width) */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative pointer-events-auto flex items-center px-[3px] py-[3px] rounded-full bg-white/65 dark:bg-zinc-900/65 backdrop-blur-3xl backdrop-saturate-150 border border-black/[0.04] dark:border-white/[0.08] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.7),inset_0_-1px_1.5px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_-6px_rgba(0,0,0,0.75),0_2px_10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_-1px_1px_rgba(0,0,0,0.3)] w-[296px] h-[52px] touch-none select-none box-border"
          style={{ willChange: 'transform' }}
        >
          {/* Integrated Second Liquid Glass Shape (Concentric Active Capsule: 44pt Height, 22pt Radius, 96px Width) */}
          <div
            ref={pillRef}
            className="absolute left-0 top-[3px] bottom-[3px] rounded-full pointer-events-none z-0 backdrop-blur-xl bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.12] shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.85),inset_0_-1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_-1px_1px_rgba(0,0,0,0.25)] overflow-hidden will-change-transform"
            style={{
              left: 0,
              width: 96,
              transformOrigin: '50% 50%',
              willChange: 'transform, width',
            }}
          >
            {/* 1. Meniscus Top Dome Flare Lensing Reflection */}
            <div
              className="absolute inset-x-1 top-0 h-[48%] rounded-t-full pointer-events-none opacity-90 dark:opacity-20"
              style={{
                background:
                  'radial-gradient(ellipse 75% 85% at 50% 0%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.2) 50%, transparent 80%)',
              }}
            />

            {/* 2. Angled Diagonal Light Sheen */}
            <div
              className="absolute inset-0 pointer-events-none opacity-75 dark:opacity-10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 35%, transparent 65%)',
              }}
            />

            {/* 3. Top Arc Specular Highlight Rim Line */}
            <div
              className="absolute inset-x-2 top-0 h-[1.5px] pointer-events-none opacity-95 dark:opacity-25"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 65%, transparent)',
              }}
            />

            {/* 4. Bottom Refractive Caustic Rim */}
            <div
              className="absolute inset-x-2.5 bottom-0 h-[1px] pointer-events-none opacity-70 dark:opacity-15"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,0.65), transparent)',
              }}
            />
          </div>

          {/* Tab Options (Apple Minimum Hit Target: ≥44 × 44 pt, Visual Symbol: 20 pt) */}
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
                className={`relative z-10 w-[96px] flex-1 h-full min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-full outline-none transition-colors duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'text-black dark:text-white font-extrabold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isSelected ? 2.2 : 1.7}
                  className={`transition-all duration-200 ${
                    isSelected
                      ? 'scale-105 -translate-y-0.5'
                      : 'scale-100 opacity-80 group-hover:opacity-100'
                  }`}
                />
                <span
                  className={`text-[10px] tracking-tight leading-none transition-all duration-200 ${
                    isSelected ? 'font-black' : 'font-semibold'
                  }`}
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
                  }}
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

