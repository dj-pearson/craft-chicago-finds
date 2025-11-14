/**
 * Animation utilities and presets for consistent microinteractions
 */

// Common animation durations
export const DURATION = {
  fast: 150,
  base: 250,
  slow: 400,
  slower: 600
} as const;

// Common easing functions
export const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
} as const;

// Animation classes for common interactions
export const ANIMATIONS = {
  // Hover effects
  scaleOnHover: 'transition-transform duration-200 hover:scale-105',
  scaleDownOnHover: 'transition-transform duration-200 hover:scale-95',
  liftOnHover: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',

  // Click/Active effects
  scaleOnClick: 'active:scale-95 transition-transform duration-150',
  bounceOnClick: 'active:scale-110 transition-transform duration-150',

  // Focus effects
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',

  // Fade effects
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-200',
  slideInFromTop: 'animate-in slide-in-from-top-2 duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom-2 duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left-2 duration-300',
  slideInFromRight: 'animate-in slide-in-from-right-2 duration-300',

  // Zoom effects
  zoomIn: 'animate-in zoom-in-95 duration-300',
  zoomOut: 'animate-out zoom-out-95 duration-200',

  // Success confirmation
  successPulse: 'animate-pulse bg-success/10',

  // Loading states
  shimmer: 'animate-shimmer',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',

  // Combinations
  cardHover: 'transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 hover:border-primary/20',
  buttonHover: 'transition-all duration-200 hover:shadow-md hover:bg-primary/90 active:scale-95',
  inputFocus: 'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
} as const;

/**
 * Returns a set of animation classes based on interaction type
 */
export function getInteractionClasses(type: keyof typeof ANIMATIONS) {
  return ANIMATIONS[type];
}

/**
 * Success feedback animation
 */
export function triggerSuccessFeedback(element: HTMLElement) {
  element.classList.add('scale-110', 'bg-success/20');
  setTimeout(() => {
    element.classList.remove('scale-110');
    setTimeout(() => {
      element.classList.remove('bg-success/20');
    }, 200);
  }, 150);
}

/**
 * Error shake animation
 */
export function triggerErrorShake(element: HTMLElement) {
  element.classList.add('animate-shake');
  setTimeout(() => {
    element.classList.remove('animate-shake');
  }, 500);
}

/**
 * Copy to clipboard with visual feedback
 */
export async function copyWithFeedback(text: string, element?: HTMLElement): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    if (element) {
      triggerSuccessFeedback(element);
    }
    return true;
  } catch (err) {
    if (element) {
      triggerErrorShake(element);
    }
    return false;
  }
}
