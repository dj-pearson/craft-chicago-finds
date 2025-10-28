/**
 * Focus Trap Component
 * Traps focus within modal dialogs and popovers
 */

import { useEffect, useRef, ReactNode } from 'react';
import { trapFocus } from '@/lib/accessibility';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  returnFocusOnDeactivate?: boolean;
}

export function FocusTrap({
  children,
  active = true,
  returnFocusOnDeactivate = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Set up focus trap
    const cleanup = trapFocus(containerRef.current);

    return () => {
      cleanup();

      // Return focus to previously focused element
      if (returnFocusOnDeactivate && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [active, returnFocusOnDeactivate]);

  return <div ref={containerRef}>{children}</div>;
}
