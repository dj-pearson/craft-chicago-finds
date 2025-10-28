/**
 * Live Region Component
 * For announcing dynamic content changes to screen readers
 */

import { useEffect, useRef, useState } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearOnUnmount?: boolean;
  atomic?: boolean;
}

export function LiveRegion({
  message,
  politeness = 'polite',
  clearOnUnmount = true,
  atomic = true,
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update announcement
    if (regionRef.current) {
      regionRef.current.textContent = message;
    }

    return () => {
      if (clearOnUnmount && regionRef.current) {
        regionRef.current.textContent = '';
      }
    };
  }, [message, clearOnUnmount]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    />
  );
}

/**
 * Hook for announcing messages
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear after announcement
    setTimeout(() => setAnnouncement(''), 1000);
  };

  return { announcement, announce };
}
