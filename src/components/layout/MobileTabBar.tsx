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

  // Exact geometric positioning calculation
  // Exact concentric iOS geometric positioning calculation
  const getTabGeometry = useCallback((index: number) => {
    const tabEl = tabsRef.current[index];
    if (tabEl && tabEl.offsetWidth > 0) {
      return {
        x: tabEl.offsetLeft,
        w: tabEl.offsetWidth,
      };
    }

    const container = containerRef.current;
    if (container) {
      const tabW = (container.clientWidth - 8) / TABS.length;
      return {
        x: 4 + index * tabW,
        w: tabW,
      };
    }

    return { x: 4 + index * 95.33, w: 95.33 };
  }, []);

  // Liquid wobble physics animation sequence (Coupled 2D: Side Wobble + Up/Down Bounce)
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

      const tl = gsap.timeline({ overwrite: 'auto' });

      // Horizontal Translation & Width tween with smooth iOS power3 curve
      tl.to(
        pill,
        {
          x: targetX,
          width: targetW,
          duration: fromDrag ? 0.48 : 0.44,
          ease: 'power3.out',
        },
        0
      );

      // Coupled 2D Liquid Wobble (Horizontal skew lean + Up/Down harmonic bounce)
      if (direction !== 0 || fromDrag) {
        const dir = direction !== 0 ? direction : 1;
        tl.to(
          pill,
          {
            y: 2.2, // Impact down against the glass bed
            scaleX: 1.16,
            scaleY: 0.86,
            skewX: -dir * 3.8,
            skewY: 0,
            duration: 0.16,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              y: -2.8, // Rebound upward into the air!
              scaleX: 0.90,
              scaleY: 1.12,
              skewX: dir * 2.2,
              duration: 0.16,
              ease: 'power2.inOut',
            },
            0.16
          )
          .to(
            pill,
            {
              y: 0.9, // Gentle secondary settle
              scaleX: 1.03,
              scaleY: 0.97,
              skewX: -dir * 0.7,
              duration: 0.12,
              ease: 'power1.out',
            },
            0.32
          )
          .to(
            pill,
            {
              y: 0, // Rest position
              scaleX: 1.0,
              scaleY: 1.0,
              skewX: 0,
              skewY: 0,
              duration: 0.08,
              ease: 'power1.inOut',
            },
            0.44
          );
      } else {
        // Subtle vertical liquid tap pulse
        tl.to(
          pill,
          {
            y: 1.8,
            scaleY: 0.92,
            scaleX: 1.06,
            duration: 0.12,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              y: -2.0,
              scaleY: 1.08,
              scaleX: 0.94,
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

  // Pointer Down: Grab pill with ZERO initial shift/jitter & tactile press squish
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
    prevTouchYRef.current = e.clientY;
    dragVelocityRef.current = 0;
    dragVelocityYRef.current = 0;

    // Measure visual position of pill right now to ensure 100% ZERO jump when finger touches
    const visualX = (gsap.getProperty(pillRef.current, 'x') as number) || currentPillXRef.current;
    currentPillXRef.current = visualX;
    dragOffsetXRef.current = touchX - visualX;

    setHoverOrDragIndex(touchedIdx);

    // Immediate tactile liquid indentation on press (Y-axis depth + volume squish)
    gsap.to(pillRef.current, {
      y: 1.8,
      scaleY: 0.91,
      scaleX: 1.05,
      duration: 0.12,
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
    const touchX = e.clientX - rect.left;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    // Calculate velocities for smooth directional wobble lean
    const vx = e.clientX - prevTouchXRef.current;
    const vy = e.clientY - prevTouchYRef.current;
    prevTouchXRef.current = e.clientX;
    prevTouchYRef.current = e.clientY;
    dragVelocityRef.current = vx;
    dragVelocityYRef.current = vy;

    // Smoothly enter dragging state past 3px threshold (either horizontal or vertical!)
    if (!isDraggingRef.current) {
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
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

    // Fluid rubber-band physics at horizontal boundaries
    let clampedX = targetX;
    if (targetX < minX) {
      clampedX = minX - Math.pow(minX - targetX, 0.70);
    } else if (targetX > maxX) {
      clampedX = maxX + Math.pow(targetX - maxX, 0.70);
    }

    // Up & Down elasticity: authentic rubber-band resistance
    let clampedY = 0;
    if (dy < 0) {
      // Dragged UP: stretches upwards with rubber-band damping (max ~-8px)
      clampedY = -Math.pow(Math.min(45, -dy), 0.65) * 1.6;
    } else if (dy > 0) {
      // Dragged DOWN: compresses downwards with rubber-band damping (max ~+6px)
      clampedY = Math.pow(Math.min(40, dy), 0.65) * 1.3;
    }

    // Directional liquid wobble lean:
    // Drag right (vx > 0) -> leans right (negative skew)
    // Drag left (vx < 0) -> leans left (positive skew)
    const dynamicSkew = Math.max(-6, Math.min(6, -vx * 0.45));
    const dynamicSkewY = Math.max(-3.5, Math.min(3.5, vy * 0.25));

    // Horizontal velocity expansion
    const dynamicScaleX = Math.min(1.18, 1.04 + Math.abs(vx) * 0.015);
    const dynamicScaleY = Math.max(0.88, 0.96 - Math.abs(vx) * 0.012);

    // Vertical stretch & squish volume preservation
    const verticalScaleY = dy < 0
      ? Math.min(1.18, 1.0 + (-dy * 0.008))
      : Math.max(0.85, 0.94 - (dy * 0.006));
    const verticalScaleX = dy < 0
      ? Math.max(0.88, 1.0 - (-dy * 0.006))
      : Math.min(1.16, 1.04 + (dy * 0.005));

    const combinedScaleX = Math.min(1.28, Math.max(0.82, dynamicScaleX * (verticalScaleX / 1.0)));
    const combinedScaleY = Math.min(1.25, Math.max(0.80, dynamicScaleY * (verticalScaleY / 1.0)));

    gsap.set(pillRef.current, {
      x: clampedX,
      y: clampedY,
      width: tabW,
      scaleX: combinedScaleX,
      scaleY: combinedScaleY,
      skewX: dynamicSkew,
      skewY: dynamicSkewY,
    });
    currentPillXRef.current = clampedX;
    currentPillYRef.current = clampedY;

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
      {/* iOS Bottom Atmospheric Dissolve Gradient */}
      <div
        aria-hidden="true"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none h-32 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-black dark:via-black/85 dark:to-transparent select-none"
      />

      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none"
      >
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative pointer-events-auto flex items-center p-1 rounded-full bg-white/75 dark:bg-zinc-900/80 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_-6px_rgba(0,0,0,0.75),0_2px_10px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.03] dark:ring-white/[0.05] w-[294px] h-[52px] touch-none select-none"
          style={{ willChange: 'transform' }}
        >
          {/* LIQUID FROSTED GLASS ACTIVE PILL (Concentric Inner Pill: 44px Height, 22px Radius) */}
          <div
            ref={pillRef}
            className="absolute top-1 bottom-1 rounded-full pointer-events-none z-0 backdrop-blur-2xl bg-zinc-900/[0.08] dark:bg-white/[0.10] border border-black/[0.10] dark:border-white/[0.16] shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.22)] overflow-hidden will-change-transform"
            style={{
              transformOrigin: '50% 50%',
              willChange: 'transform, width',
            }}
          >
            {/* 1. Meniscus Top Dome Flare Reflection */}
            <div
              className="absolute inset-x-1 top-0 h-[48%] rounded-t-full pointer-events-none opacity-90 dark:opacity-20"
              style={{
                background:
                  'radial-gradient(ellipse 75% 85% at 50% 0%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.25) 50%, transparent 80%)',
              }}
            />

            {/* 2. Angled Diagonal Light Sheen */}
            <div
              className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 35%, transparent 65%)',
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
              className="absolute inset-x-2.5 bottom-0 h-[1px] pointer-events-none opacity-75 dark:opacity-15"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,0.7), transparent)',
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
                className={`relative z-10 flex-1 h-full flex flex-col items-center justify-center gap-0.5 rounded-full outline-none transition-colors duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'text-black dark:text-white font-extrabold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium'
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isSelected ? 2.3 : 1.8}
                  className={`transition-all duration-200 ${
                    isSelected
                      ? 'scale-105 -translate-y-0.5'
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
