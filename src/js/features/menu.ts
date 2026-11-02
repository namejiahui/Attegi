/**
 * Menu Toggle Feature
 * Handles the mobile navigation sheet: open/close, focus trap, Escape.
 */

import { qs, qsa, docEl } from '../core/index.js';
import { openDialog, closeDialog, isPointerClick, type DialogElement } from '../core/dialog.js';

/**
 * Initialize menu toggle functionality
 */
export function initMenu(): void {
  const trigger = qs<HTMLElement>('.nav-menu');
  const closeButton = qs<HTMLElement>('.site-menu-close');
  const sheet = qs<DialogElement>('#site-menu');
  if (!trigger || !sheet) return;

  // The TOC's mobile trigger and drawer live on <body>, outside the page
  // wrapper, and are created later by post.js; query them on each open.
  function setBackgroundInert(isInert: boolean): void {
    const background = qsa('.nav-header, .page-wrapper, .toc-mobile-trigger, .toc-mobile-overlay, .toc-mobile-drawer');
    Array.prototype.forEach.call(background, (el: HTMLElement) => {
      if (isInert) {
        el.setAttribute('inert', '');
      } else {
        el.removeAttribute('inert');
      }
    });
  }

  function open(pointer?: boolean): void {
    docEl.classList.add('menu-active');
    trigger!.setAttribute('aria-expanded', 'true');
    setBackgroundInert(true);
    openDialog(sheet!, { trigger, onClose: () => close(), pointer });
  }

  function close(pointer?: boolean): void {
    docEl.classList.remove('menu-active');
    trigger!.setAttribute('aria-expanded', 'false');
    setBackgroundInert(false);
    closeDialog(sheet!, { pointer });
  }

  trigger.addEventListener('click', (event: MouseEvent) => {
    event.preventDefault();
    if (docEl.classList.contains('menu-active')) {
      close(isPointerClick(event));
    } else {
      open(isPointerClick(event));
    }
  });

  if (closeButton) {
    closeButton.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault();
      close(isPointerClick(event));
    });
  }

  // Close on navigation (a link inside the sheet was followed) and on
  // viewport changes that make the mobile sheet no longer applicable.
  sheet.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a')) close(isPointerClick(event));
  });

  window.addEventListener('resize', () => {
    if (docEl.classList.contains('menu-active')) close();
  });

  // Coming back through the back/forward cache restores the page frozen
  // with the sheet still open.
  window.addEventListener('pageshow', (event: PageTransitionEvent) => {
    if (event.persisted && docEl.classList.contains('menu-active')) close(true);
  });
}
