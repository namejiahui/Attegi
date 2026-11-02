/**
 * Excerpt Cleanup
 * Ghost's excerpt helper falls back to stripped post HTML when no custom
 * excerpt is set, which can leak raw content directives (e.g. "[!poem]")
 * into feed and card excerpts. Strip them client-side rather than
 * post-processing every place `{{excerpt}}` is called.
 */

import { qsa, each } from '../core/index.js';

const DIRECTIVE_PATTERN = /\[\/?!?[a-z0-9_-]+\]/gi;

export function initExcerptClean(): void {
  each(qsa('.post-excerpt, .post-nav-excerpt'), (el: HTMLElement) => {
    const text = el.textContent || '';
    if (!DIRECTIVE_PATTERN.test(text)) return;
    DIRECTIVE_PATTERN.lastIndex = 0;
    el.textContent = text.replace(DIRECTIVE_PATTERN, '').replace(/\s{2,}/g, ' ').trim();
  });
}
