/**
 * Accessible Button Component
 * Example of properly accessible interactive component
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { announceToScreenReader } from '@/lib/accessibility';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Announce action to screen readers when clicked
   */
  announceOnClick?: string;
  
  /**
   * Loading state - shows spinner and disables interaction
   */
  isLoading?: boolean;
  
  /**
   * Screen reader text for loading state
   */
  loadingText?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    children, 
    announceOnClick, 
    isLoading, 
    loadingText = 'Loading',
    onClick,
    disabled,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (announceOnClick && !isLoading) {
        announceToScreenReader(announceOnClick, 'polite');
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-label={isLoading ? loadingText : ariaLabel}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="sr-only">{loadingText}</span>
            <span aria-hidden="true">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
