/**
 * Visually Hidden Component
 * Content visible to screen readers but hidden visually
 */

import { ReactNode } from 'react';

interface VisuallyHiddenProps {
  children: ReactNode;
  /**
   * Show on focus (useful for skip links)
   */
  focusable?: boolean;
}

export function VisuallyHidden({ children, focusable = false }: VisuallyHiddenProps) {
  return (
    <span className={focusable ? 'sr-only-focusable' : 'sr-only'}>
      {children}
    </span>
  );
}
