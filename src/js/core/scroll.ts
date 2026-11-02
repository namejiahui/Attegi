/**
 * Shared Scroll Source
 * A single passive scroll/resize listener, batched with requestAnimationFrame
 * and fanned out to subscribers, so features don't each attach their own
 * listener and recompute layout independently.
 */
import { docEl } from './dom.js';

let callbacks: Array<() => void> = [];
let ticking = false;
let started = false;

function tick(): void {
  ticking = false;
  callbacks.forEach((callback) => { callback(); });
}

function requestTick(): void {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(tick);
}

function start(): void {
  if (started) return;
  started = true;
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  window.addEventListener('orientationchange', requestTick, { passive: true });
}

/**
 * Subscribe to the shared scroll/resize tick. Calls back immediately once,
 * then on every batched scroll/resize/orientation change.
 * @returns unsubscribe function
 */
export function onScroll(callback: () => void): () => void {
  start();
  callbacks.push(callback);
  callback();
  return function unsubscribe() {
    callbacks = callbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Reading progress of `content`, measured as how far the viewport's vertical
 * middle has crossed the element's top-to-bottom span. Shared by the
 * back-to-top ring and TOC trigger ring so they agree.
 *
 * Not clamped above 1: callers that only need "how far through" clamp to
 * `Math.min(progress, 1)` themselves; the progress bar uses the overshoot
 * past 1 to trigger its "complete" state.
 * @returns 0 at the top, 1 when the viewport middle reaches the
 *   content's bottom edge, and above 1 once scrolled past it.
 */
export function getReadingProgress(content: Element): number {
  const rect = content.getBoundingClientRect();
  const scrollY = window.pageYOffset || docEl.scrollTop;
  const contentTop = rect.top + scrollY;
  const contentHeight = rect.height;
  if (contentHeight <= 0) return 0;

  const viewportMiddle = scrollY + window.innerHeight / 2;
  return Math.max(0, (viewportMiddle - contentTop) / contentHeight);
}

/**
 * `bottom` offset (px) for a fixed floating button that should lift above
 * the footer instead of overlapping it once the footer scrolls into view.
 * Shared by the TOC mobile trigger and the back-to-top button.
 * @param footer
 * @param defaultBottom - resting `bottom` offset in px
 * @param btnHeight - button height in px
 * @param margin - gap to keep above the footer in px
 * @returns the `bottom` offset to apply, in px
 */
export function getFooterAvoidingBottom(
  footer: Element | null,
  defaultBottom: number,
  btnHeight: number,
  margin: number
): number {
  if (!footer) return defaultBottom;

  const footerTop = footer.getBoundingClientRect().top;
  const windowHeight = window.innerHeight;
  const btnTop = windowHeight - defaultBottom - btnHeight;

  if (footerTop < windowHeight && footerTop < btnTop + btnHeight + margin) {
    return windowHeight - footerTop + margin;
  }
  return defaultBottom;
}
