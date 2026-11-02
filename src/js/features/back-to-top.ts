/**
 * Back To Top Feature
 * Scroll-to-top button with a reading-progress ring.
 * Appears across all pages after scrolling past SHOW_AT (200px) and stays visible.
 */
import { qs, doc } from '../core/index.js';
import { onScroll, getReadingProgress, getFooterAvoidingBottom } from '../core/scroll.js';

const DEFAULT_BOTTOM = 32; // px
const BUTTON_HEIGHT = 48; // px
const FOOTER_MARGIN = 16; // px
const SHOW_AT = 200; // px scrolled before the button appears

export function setupBackToTop(): void {
  const btn = qs<HTMLButtonElement>('.back-to-top');
  if (!btn) return;

  const progress = btn.querySelector<SVGCircleElement>('.progress-ring__progress');
  const content = qs('.post-content') || qs('.content') || qs('main') || doc.body;
  const footer = qs('.nav-footer');

  const circumference = 2 * Math.PI * 20; // r=20
  let isVisible = false;

  function update(): void {
    const scrollY = window.pageYOffset;

    if (progress && content) {
      const readProgress = Math.min(getReadingProgress(content), 1);
      progress.style.strokeDashoffset = String(circumference * (1 - readProgress));
    }

    const shouldShow = scrollY > SHOW_AT;
    if (shouldShow !== isVisible) {
      isVisible = shouldShow;
      btn!.classList.toggle('is-visible', shouldShow);
    }

    if (footer) {
      btn!.style.bottom = `${getFooterAvoidingBottom(footer, DEFAULT_BOTTOM, BUTTON_HEIGHT, FOOTER_MARGIN)}px`;
    }
  }

  btn.addEventListener('click', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  onScroll(update);

  setTimeout(() => {
    if (window.pageYOffset > SHOW_AT) {
      isVisible = true;
      btn.classList.add('is-visible');
    }
  }, 500);
}
