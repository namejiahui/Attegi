/**
 * Back To Top Feature
 * Scroll-to-top button with a reading-progress ring. Only shown on posts
 * without a TOC (the TOC's own floating trigger already shows progress and
 * `.has-toc .back-to-top` hides this button in CSS).
 */
import { qs, doc } from '../core/index.js';
import { onScroll, getReadingProgress, getFooterAvoidingBottom } from '../core/scroll.js';

const DEFAULT_BOTTOM = 32; // px
const BUTTON_HEIGHT = 48; // px
const FOOTER_MARGIN = 16; // px
const SHOW_AT = 200; // px scrolled before the button appears

export function setupBackToTop(): void {
  // The TOC already covers reading progress; skip attaching a second
  // scroll-driven RAF loop for a button that CSS keeps hidden anyway.
  if (doc.body.classList.contains('has-toc')) return;

  const btn = qs<HTMLButtonElement>('.back-to-top');
  const progress = btn ? btn.querySelector<SVGCircleElement>('.progress-ring__progress') : null;
  const content = qs('.post-content');
  const footer = qs('.nav-footer');
  if (!btn || !progress || !content) return;

  const circumference = 2 * Math.PI * 20; // r=20
  let isVisible = false;
  let isScrollingDown = false;
  let lastScrollY = 0;

  function update(): void {
    const scrollY = window.pageYOffset;

    const readProgress = Math.min(getReadingProgress(content!), 1);
    progress!.style.strokeDashoffset = String(circumference * (1 - readProgress));

    const delta = scrollY - lastScrollY;
    if (Math.abs(delta) > 5) {
      isScrollingDown = delta > 0;
    }
    lastScrollY = scrollY;
    btn!.classList.toggle('is-hidden-scroll', scrollY >= SHOW_AT && isScrollingDown);

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
