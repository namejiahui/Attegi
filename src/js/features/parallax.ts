/**
 * Parallax Cover Feature
 * Applies parallax effect to cover images on scroll. Also owns the one
 * site-wide scroll listener that toggles `.nav-offscreen` once the nav
 * header has scrolled out of view (shows the floating menu), so nothing else
 * needs to register its own.
 */

import { qs, docEl } from '../core/index.js';
import { onScroll } from '../core/scroll.js';

const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Initialize parallax effect for cover images
 */
export function initParallax(): void {
  const cover = qs<HTMLElement>('.cover');
  const coverImage = cover ? cover.querySelector('img') : null;
  let coverPosition = 0;
  let coverHeight = cover ? cover.offsetHeight : 0;
  const coverPreActive = docEl.classList.contains('cover-active');
  const header = qs<HTMLElement>('.nav-header');
  const prefersReducedMotion = window.matchMedia && window.matchMedia(REDUCE_MOTION_QUERY).matches;

  function updateCoverMetrics(): void {
    if (!cover) return;
    coverHeight = cover.offsetHeight || 0;
  }

  function prlx(): void {
    const headerHeight = header ? header.offsetHeight : 0;
    docEl.classList.toggle('nav-offscreen', window.pageYOffset > headerHeight);

    if (!cover) return;
    if (!coverHeight) updateCoverMetrics();
    const windowPosition = window.pageYOffset;
    // Kill the transform entirely under reduced motion; the cover still
    // needs its scroll-position class kept in sync.
    coverPosition = (!prefersReducedMotion && windowPosition > 0) ? Math.floor(windowPosition * 0.25) : 0;
    cover.style.transform = `translate3d(0, ${coverPosition}px, 0)`;
    // The header stays in its over-cover style only while its bottom edge
    // is still over the image; past that its white text would sit on the page.
    const withinCover = coverHeight ? window.pageYOffset < coverHeight - headerHeight : coverPreActive;
    docEl.classList.toggle('cover-active', withinCover);
  }

  if (coverImage) {
    coverImage.addEventListener('load', () => {
      updateCoverMetrics();
      prlx();
    });
  }

  // core/scroll.js batches scroll/resize/orientationchange with one
  // rAF-throttled listener and calls back immediately on subscribe.
  onScroll(() => {
    updateCoverMetrics();
    prlx();
  });
}
