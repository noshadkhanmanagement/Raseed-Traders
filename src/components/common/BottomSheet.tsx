import React, { useEffect, useRef } from 'react';
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
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power2.out' }
        );
        gsap.fromTo(
          modalRef.current,
          { scale: 0.93, opacity: 0, y: 14 },
          { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.2)' }
        );
      }
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 pt-3 sm:p-4 sm:pt-6 overflow-y-auto">
      {/* Dimmed Clean Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Sheet Content Container */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.24)] overflow-hidden z-10 max-h-[92dvh] md:max-h-[88vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
          <div>
            <h3 className="text-base font-bold text-black dark:text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors btn-press"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Body Scroll Area */}
        <div className="overflow-y-auto px-5 py-4 pb-safe flex-1 space-y-4 text-black dark:text-white">
          {children}
        </div>
      </div>
    </div>
  );
};
