import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { IconClose } from './Icons';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      // GSAP 100% native iOS spring entrance
      if (modalRef.current && backdropRef.current) {
        gsap.killTweensOf([backdropRef.current, modalRef.current]);
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.22, ease: 'power2.out' }
        );
        gsap.fromTo(
          modalRef.current,
          { scale: 0.94, opacity: 0, y: 12 },
          { scale: 1, opacity: 1, y: 0, duration: 0.32, ease: 'back.out(1.15)' }
        );
      }
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-auto">
      {/* Dimmed Clean Backdrop (covers 100% of visible screen) */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Sheet Content Container (Overlaps visible area directly, zero fixed window trap) */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.32)] z-10 my-auto max-h-[calc(100dvh-1.5rem)] flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm sm:text-base font-bold text-black dark:text-white tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors btn-press shrink-0"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Body Area */}
        <div className="overflow-y-auto px-5 py-4 pb-safe flex-1 space-y-4 text-black dark:text-white overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
