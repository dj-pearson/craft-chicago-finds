/**
 * useKeyboardNavigation Hook
 * Provides keyboard navigation utilities for accessible components
 * WCAG 2.1 AA - Keyboard Accessible
 */

import { useCallback, useEffect, useRef } from 'react';

export const Keys = {
  TAB: 'Tab',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export type KeyType = typeof Keys[keyof typeof Keys];

interface UseKeyboardNavigationOptions {
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Callback when enter is pressed */
  onEnter?: () => void;
  /** Whether keyboard events are enabled */
  enabled?: boolean;
  /** Element to attach listeners to (defaults to document) */
  targetRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook for handling common keyboard navigation patterns
 */
export function useKeyboardNavigation({
  onEscape,
  onEnter,
  enabled = true,
  targetRef,
}: UseKeyboardNavigationOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    const target = targetRef?.current || document;

    const handleKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;

      switch (e.key) {
        case Keys.ESCAPE:
          onEscape?.();
          break;
        case Keys.ENTER:
          onEnter?.();
          break;
      }
    };

    target.addEventListener('keydown', handleKeyDown);
    return () => target.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape, onEnter, targetRef]);
}

interface UseArrowNavigationOptions {
  /** List of focusable items */
  items: HTMLElement[] | NodeListOf<HTMLElement> | null;
  /** Current focused index */
  currentIndex: number;
  /** Callback when index changes */
  onIndexChange: (index: number) => void;
  /** Whether navigation wraps around */
  wrap?: boolean;
  /** Orientation of the list */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Whether to prevent default on arrow keys */
  preventDefault?: boolean;
}

/**
 * Hook for arrow key navigation in lists
 */
export function useArrowNavigation({
  items,
  currentIndex,
  onIndexChange,
  wrap = true,
  orientation = 'vertical',
  preventDefault = true,
}: UseArrowNavigationOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!items || items.length === 0) return;

      const itemCount = items.length;
      let newIndex = currentIndex;
      let handled = false;

      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      switch (event.key) {
        case Keys.ARROW_DOWN:
          if (isVertical) {
            handled = true;
            newIndex = wrap
              ? (currentIndex + 1) % itemCount
              : Math.min(currentIndex + 1, itemCount - 1);
          }
          break;
        case Keys.ARROW_UP:
          if (isVertical) {
            handled = true;
            newIndex = wrap
              ? (currentIndex - 1 + itemCount) % itemCount
              : Math.max(currentIndex - 1, 0);
          }
          break;
        case Keys.ARROW_RIGHT:
          if (isHorizontal) {
            handled = true;
            newIndex = wrap
              ? (currentIndex + 1) % itemCount
              : Math.min(currentIndex + 1, itemCount - 1);
          }
          break;
        case Keys.ARROW_LEFT:
          if (isHorizontal) {
            handled = true;
            newIndex = wrap
              ? (currentIndex - 1 + itemCount) % itemCount
              : Math.max(currentIndex - 1, 0);
          }
          break;
        case Keys.HOME:
          handled = true;
          newIndex = 0;
          break;
        case Keys.END:
          handled = true;
          newIndex = itemCount - 1;
          break;
      }

      if (handled) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (newIndex !== currentIndex) {
          onIndexChange(newIndex);
          // Focus the new item
          const itemArray = Array.from(items);
          itemArray[newIndex]?.focus();
        }
      }
    },
    [items, currentIndex, onIndexChange, wrap, orientation, preventDefault]
  );

  return { handleKeyDown };
}

interface UseFocusTrapOptions {
  /** Whether the trap is active */
  enabled: boolean;
  /** The container element */
  containerRef: React.RefObject<HTMLElement>;
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Whether to return focus to trigger on close */
  returnFocus?: boolean;
  /** Initial focus element selector */
  initialFocusSelector?: string;
}

/**
 * Hook for trapping focus within a container (modals, dialogs)
 */
export function useFocusTrap({
  enabled,
  containerRef,
  onEscape,
  returnFocus = true,
  initialFocusSelector,
}: UseFocusTrapOptions) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Store the previously focused element
    previousFocus.current = document.activeElement as HTMLElement;

    const container = containerRef.current;

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => el.offsetParent !== null); // Filter out hidden elements
    };

    // Set initial focus
    if (initialFocusSelector) {
      const initialElement = container.querySelector<HTMLElement>(
        initialFocusSelector
      );
      initialElement?.focus();
    } else {
      const focusable = getFocusableElements();
      focusable[0]?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === Keys.ESCAPE && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key !== Keys.TAB) return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      // Shift + Tab from first element goes to last
      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
        return;
      }

      // Tab from last element goes to first
      if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
        return;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Return focus to the previously focused element
      if (returnFocus && previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [enabled, containerRef, onEscape, returnFocus, initialFocusSelector]);
}

interface UseRovingTabIndexOptions {
  /** Container ref */
  containerRef: React.RefObject<HTMLElement>;
  /** Selector for items */
  itemSelector: string;
  /** Whether roving tabindex is enabled */
  enabled?: boolean;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical' | 'both';
}

/**
 * Hook for implementing roving tabindex pattern
 */
export function useRovingTabIndex({
  containerRef,
  itemSelector,
  enabled = true,
  orientation = 'horizontal',
}: UseRovingTabIndexOptions) {
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const items = container.querySelectorAll<HTMLElement>(itemSelector);

    // Initialize tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === currentIndexRef.current ? '0' : '-1');
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = container.querySelectorAll<HTMLElement>(itemSelector);
      if (items.length === 0) return;

      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      let newIndex = currentIndexRef.current;
      let handled = false;

      switch (event.key) {
        case Keys.ARROW_RIGHT:
          if (isHorizontal) {
            newIndex = (currentIndexRef.current + 1) % items.length;
            handled = true;
          }
          break;
        case Keys.ARROW_LEFT:
          if (isHorizontal) {
            newIndex = (currentIndexRef.current - 1 + items.length) % items.length;
            handled = true;
          }
          break;
        case Keys.ARROW_DOWN:
          if (isVertical) {
            newIndex = (currentIndexRef.current + 1) % items.length;
            handled = true;
          }
          break;
        case Keys.ARROW_UP:
          if (isVertical) {
            newIndex = (currentIndexRef.current - 1 + items.length) % items.length;
            handled = true;
          }
          break;
        case Keys.HOME:
          newIndex = 0;
          handled = true;
          break;
        case Keys.END:
          newIndex = items.length - 1;
          handled = true;
          break;
      }

      if (handled) {
        event.preventDefault();

        // Update tabindex
        items[currentIndexRef.current].setAttribute('tabindex', '-1');
        items[newIndex].setAttribute('tabindex', '0');
        items[newIndex].focus();

        currentIndexRef.current = newIndex;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [enabled, containerRef, itemSelector, orientation]);

  return {
    getCurrentIndex: () => currentIndexRef.current,
    setCurrentIndex: (index: number) => {
      currentIndexRef.current = index;
    },
  };
}

/**
 * Check if an event is an Enter or Space key press
 */
export function isEnterOrSpace(event: React.KeyboardEvent): boolean {
  return event.key === Keys.ENTER || event.key === Keys.SPACE;
}

/**
 * Handle click-like keyboard events
 */
export function handleClickKeyboard(
  event: React.KeyboardEvent,
  callback: () => void
): void {
  if (isEnterOrSpace(event)) {
    event.preventDefault();
    callback();
  }
}
