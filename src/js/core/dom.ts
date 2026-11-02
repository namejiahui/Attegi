/**
 * DOM Utilities
 * Shared DOM helper functions used across all modules
 */

/**
 * Execute callback when DOM is ready
 */
export function onReady(fn: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/**
 * Query selector shorthand
 */
export function qs<T extends Element = HTMLElement>(selector: string, context: ParentNode = document): T | null {
  return context.querySelector<T>(selector);
}

/**
 * Query selector all shorthand
 */
export function qsa<T extends Element = HTMLElement>(selector: string, context: ParentNode = document): NodeListOf<T> {
  return context.querySelectorAll<T>(selector);
}

/**
 * Iterate over NodeList with callback
 */
export function each<T extends Node>(nodes: NodeList | ArrayLike<T>, callback: (item: T, index: number) => void): void {
  Array.prototype.forEach.call(nodes, callback as (value: unknown, index: number) => void);
}

/**
 * Document element reference
 */
export const docEl = document.documentElement;

/**
 * Document reference
 */
export const doc = document;
