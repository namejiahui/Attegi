/**
 * Performance Utilities
 * Throttle, debounce, and RAF wrappers for optimized event handling
 */

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Request animation frame with ticking guard
 */
export function raf(fn: () => void): () => void {
  let ticking = false;

  return function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      fn();
      ticking = false;
    });
  };
}
