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
      const vy = dragVelocityYRef.current || 0;

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

      // Coupled 2D Liquid Wobble (Equal Side Jiggle + Up/Down Harmonic Bounce)
      if (direction !== 0 || fromDrag) {
        const dir = direction !== 0 ? direction : 1;
        // Dynamic Y snap depending on release state
        let yPhase1 = 3.6;
        let yPhase2 = -4.2;
        let yPhase3 = 1.4;

        if (fromDrag && Math.abs(currentY) > 1.5) {
          if (currentY < -1.5) {
            // Dragged UP: energetic launch downwards, then upward rebound
            yPhase1 = Math.min(6.5, -currentY * 0.45 + Math.max(0, vy * 0.2));
            yPhase2 = -3.8;
            yPhase3 = 1.2;
          } else {
            // Dragged DOWN: energetic launch upwards, then downward rebound
            yPhase1 = Math.max(-6.5, -currentY * 0.45 + Math.min(0, vy * 0.2));
            yPhase2 = 3.8;
            yPhase3 = -1.2;
          }
        }

        tl.to(
          pill,
          {
            // Phase 1: Impact & Primary Jiggle (Equal ~4.4px lateral and vertical energy)
            x: targetX + dir * 4.4,
            y: yPhase1,
            scaleX: 1.18,
            scaleY: 0.82,
            skewX: -dir * 5.2,
            skewY: 0,
            duration: 0.16,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              // Phase 2: Recoil & Launch
              x: targetX - dir * 3.0,
              y: yPhase2,
              scaleX: 0.86,
              scaleY: 1.16,
              skewX: dir * 3.6,
              duration: 0.16,
              ease: 'power2.inOut',
            },
            0.16
          )
          .to(
            pill,
            {
              // Phase 3: Secondary Jiggle
              x: targetX + dir * 1.0,
              y: yPhase3,
              scaleX: 1.05,
              scaleY: 0.95,
              skewX: -dir * 1.4,
              duration: 0.12,
              ease: 'power1.out',
            },
            0.32
          )
          .to(
            pill,
            {
              // Phase 4: Rest & Relaxation
              x: targetX,
              y: 0,
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
        // Balanced 2D Liquid Tap Pulse (Side Ripple + Up/Down Dip & Pop)
        tl.to(
          pill,
          {
            y: 3.2,
            scaleY: 0.86,
            scaleX: 1.10,
            skewX: 2.2,
            duration: 0.12,
            ease: 'power2.out',
          },
          0
        )
          .to(
            pill,
            {
              y: -3.6,
              scaleY: 1.14,
              scaleX: 0.90,
              skewX: -1.8,
              duration: 0.14,
              ease: 'power2.inOut',
            },
            0.12
          )
          .to(
            pill,
            {
              y: 1.2,
              scaleY: 0.96,
              scaleX: 1.03,
              skewX: 0.6,
              duration: 0.10,
              ease: 'power1.out',
            },
            0.26
          )
          .to(
            pill,
            {
              y: 0,
              scaleY: 1.0,
              scaleX: 1.0,
              skewX: 0,
              duration: 0.08,
              ease: 'power1.inOut',
            },
            0.36
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

    // Immediate tactile liquid indentation on press (Y-axis depth + volume squish)
    gsap.to(pillRef.current, {
      y: 2.0,
      scaleY: 0.90,
      scaleX: 1.06,
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
    const borderLeft = containerRef.current.clientLeft || 0;
    const touchX = e.clientX - rect.left - borderLeft;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    // Calculate velocities for smooth directional wobble lean
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

    // Fluid rubber-band physics at horizontal boundaries
    let clampedX = targetX;
    if (targetX < minX) {
      clampedX = minX - Math.pow(minX - targetX, 0.72) * 1.2;
    } else if (targetX > maxX) {
      clampedX = maxX + Math.pow(targetX - maxX, 0.72) * 1.2;
    }

    // Up & Down draggability: whole authentic Apple rubber-band resistance
    let clampedY = 0;
    if (dy < 0) {
      // Dragged UP: stretches upwards into screen (up to -16px)
      clampedY = -Math.pow(Math.min(65, -dy), 0.72) * 1.5;
    } else if (dy > 0) {
      // Dragged DOWN: compresses downwards toward bottom edge (up to +14px)
      clampedY = Math.pow(Math.min(60, dy), 0.72) * 1.4;
    }

    // Directional liquid wobble lean:
    const dynamicSkew = Math.max(-6.5, Math.min(6.5, -vx * 0.45));
    const dynamicSkewY = Math.max(-4.0, Math.min(4.0, vy * 0.25));

    // Horizontal velocity expansion
    const dynamicScaleX = Math.min(1.18, 1.04 + Math.abs(vx) * 0.015);
    const dynamicScaleY = Math.max(0.88, 0.96 - Math.abs(vx) * 0.012);

    // Vertical stretch & squish volume preservation
    const verticalScaleY = dy < 0
      ? Math.min(1.26, 1.0 + (-dy * 0.006))
      : Math.max(0.78, 0.94 - (dy * 0.005));
    const verticalScaleX = dy < 0
      ? Math.max(0.86, 1.0 - (-dy * 0.004))
      : Math.min(1.24, 1.04 + (dy * 0.005));

    const combinedScaleX = Math.min(1.28, Math.max(0.80, dynamicScaleX * verticalScaleX));
    const combinedScaleY = Math.min(1.28, Math.max(0.78, dynamicScaleY * verticalScaleY));

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

