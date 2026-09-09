import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures that navigating to any page, route, or link
 * instantly resets the viewport to the top of the page.
 * If the link contains an anchor hash (e.g. #section-id), it smoothly
 * scrolls directly to that specific section.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const elementId = hash.replace('#', '');
      const targetElement = document.getElementById(elementId) || document.querySelector(hash);
      if (targetElement) {
        // Allow DOM to settle, then scroll to the exact target section
        requestAnimationFrame(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
    }

    // Immediate zero-lag scroll to absolute top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Also reset any scrollable main containers
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  // Intercept anchor clicks pointing to #hashes or data-scroll-to within current page
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a[href^="#"], [data-scroll-to]');
      if (!target) return;

      const targetId =
        target.getAttribute('data-scroll-to') ||
        target.getAttribute('href')?.replace(/^#/, '');

      if (!targetId) {
        // Empty hash like href="#" -> scroll to top
        e.preventDefault();
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        return;
      }

      const dest = document.getElementById(targetId);
      if (dest) {
        e.preventDefault();
        dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    document.addEventListener('click', handleAnchorClick, { passive: false });
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return null;
};
