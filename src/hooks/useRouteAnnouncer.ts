/**
 * Route Change Announcer Hook
 *
 * Manages focus and screen reader announcements on route changes.
 * WCAG 2.4.3 Focus Order - ensures focus moves to main content on navigation.
 * WCAG 4.1.3 Status Messages - announces page changes to screen readers.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useRouteAnnouncer() {
  const location = useLocation();
  const previousPathname = useRef(location.pathname);
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create the announcer element once
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.id = 'route-announcer';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current === location.pathname) return;
    previousPathname.current = location.pathname;

    // Short delay to let the new page render and set its title
    const timer = setTimeout(() => {
      // Announce the page change
      const pageTitle = document.title;
      if (announcerRef.current) {
        announcerRef.current.textContent = '';
        // Use requestAnimationFrame to ensure the empty text is processed first
        requestAnimationFrame(() => {
          if (announcerRef.current) {
            announcerRef.current.textContent = `Navigated to ${pageTitle}`;
          }
        });
      }

      // Move focus to main content area
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus({ preventScroll: false });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);
}
