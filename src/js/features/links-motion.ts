/**
 * Links Page Reduced Motion
 * The Möbius header uses SMIL (<animate>/<animateMotion>) for its
 * sparkles and particles, which `prefers-reduced-motion` cannot stop via
 * CSS alone. Watch the media query in JS and freeze/hide the moving
 * pieces when the user asked for reduced motion.
 */

import { qs, qsa, each } from '../core/index.js';

function freezeSmil(svg: SVGElement): void {
  each(qsa('animate, animateMotion', svg), (anim: Element) => {
    anim.setAttribute('repeatCount', '0');
    if (typeof (anim as any).endElement === 'function') {
      try {
        (anim as any).endElement();
      } catch {
        // Some browsers throw if the animation hasn't started yet.
      }
    }
  });
}

export function initLinksMotion(): void {
  const svg = qs<SVGElement>('.links-symbol');
  if (!svg) return;

  const query = window.matchMedia('(prefers-reduced-motion: reduce)');

  function apply(reduced: boolean): void {
    each(qsa<SVGElement>('.sparkles, .particle-main, .particle-secondary', svg!), (el: SVGElement) => {
      el.style.display = reduced ? 'none' : '';
    });
    if (reduced) freezeSmil(svg!);
  }

  apply(query.matches);

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', (event: MediaQueryListEvent) => {
      apply(event.matches);
    });
  } else if (typeof (query as any).addListener === 'function') {
    (query as any).addListener((event: MediaQueryListEvent) => {
      apply(event.matches);
    });
  }
}
