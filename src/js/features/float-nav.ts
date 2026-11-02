/**
 * Floating Site Menu
 * The popover opens and closes itself (Popover API). This only closes it
 * when one of its items is used, so Ghost's search and portal overlays are
 * not covered by a panel sitting in the top layer.
 */

import { qs } from '../core/index.js';

export function initFloatNav(): void {
  const panel = qs<HTMLElement>('#float-nav-panel');
  if (!panel || typeof (panel as any).hidePopover !== 'function') return;

  panel.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button')) {
      (panel as any).hidePopover();
    }
  });
}
