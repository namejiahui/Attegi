/**
 * Dialog Focus Helper
 * Minimal open/close focus management for modal-style overlays (mobile menu,
 * TOC drawer): moves focus in, traps Tab inside, Escape closes, and restores
 * focus to the trigger on close.
 */

export interface DialogElement extends HTMLElement {
  _dialogTrigger?: HTMLElement | null;
  _dialogKeydown?: ((event: KeyboardEvent) => void) | null;
}

export interface DialogOptions {
  trigger?: HTMLElement | null;
  onClose?: () => void;
  pointer?: boolean;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(dialogEl: HTMLElement): HTMLElement[] {
  return Array.prototype.filter.call(
    dialogEl.querySelectorAll(FOCUSABLE),
    (el: HTMLElement) => el.offsetParent !== null
  ) as HTMLElement[];
}

const MAX_FOCUS_ATTEMPTS = 10;

// Retry `el.focus()` across a few frames until it actually takes. Needed
// because a caller-driven `visibility: hidden <-> visible` CSS transition
// makes `.focus()` a silent no-op until the browser applies the new style,
// and that can take a few frames longer than a single rAF deferral.
function retryFocus(el: HTMLElement, attempt: number): void {
  el.focus();
  if (document.activeElement === el || attempt >= MAX_FOCUS_ATTEMPTS) return;
  requestAnimationFrame(() => {
    retryFocus(el, attempt + 1);
  });
}

function focusFirstFocusable(dialogEl: HTMLElement, attempt: number): void {
  const focusable = getFocusable(dialogEl);
  if (focusable.length) {
    retryFocus(focusable[0], attempt);
    return;
  }
  if (attempt < MAX_FOCUS_ATTEMPTS) {
    requestAnimationFrame(() => {
      focusFirstFocusable(dialogEl, attempt + 1);
    });
  } else {
    // Give up waiting for a focusable child; focus the dialog itself.
    dialogEl.setAttribute('tabindex', '-1');
    dialogEl.focus();
  }
}

function trapTab(dialogEl: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const focusable = getFocusable(dialogEl);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === dialogEl)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * True when a click came from a mouse or touch rather than Enter/Space on a
 * focused button (keyboard activation reports `detail === 0`).
 */
export function isPointerClick(event?: Event): boolean {
  return Boolean(event && event.type === 'click' && (event as UIEvent).detail > 0);
}

/**
 * Open a dialog: moves focus in and starts trapping Tab/Escape. Keyboard
 * opens focus the first focusable element; pointer opens focus the dialog
 * itself, so screen readers still land inside but no focus ring flashes on
 * a control the user never tabbed to.
 */
export function openDialog(dialogEl: DialogElement, options?: DialogOptions): void {
  const opts = options || {};
  const trigger = opts.trigger || (document.activeElement as HTMLElement | null);

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Run the caller's close logic first: it typically un-hides the
      // trigger, which `closeDialog` then needs to be focusable again.
      if (opts.onClose) opts.onClose();
      closeDialog(dialogEl);
    } else {
      trapTab(dialogEl, event);
    }
  }

  dialogEl._dialogTrigger = trigger;
  dialogEl._dialogKeydown = onKeydown;
  dialogEl.addEventListener('keydown', onKeydown);

  // Callers typically add the "open" class in the same task that calls this,
  // and if that class transitions `visibility`, `.focus()` is a silent no-op
  // until the browser actually applies the new style. Neither a single
  // requestAnimationFrame nor a setTimeout(0) reliably lands after that:
  // retry across a few frames and confirm the focus actually landed, instead
  // of guessing how many frames the style flush takes.
  if (opts.pointer) {
    dialogEl.setAttribute('tabindex', '-1');
    retryFocus(dialogEl, 0);
  } else {
    focusFirstFocusable(dialogEl, 0);
  }
}

/**
 * Close a dialog opened with `openDialog`: stops the Tab trap and restores
 * focus to the element that opened it. Pointer closes drop focus instead:
 * a script-focused trigger shows a focus ring in WebKit after a tap.
 */
export function closeDialog(dialogEl: DialogElement, options?: { pointer?: boolean }): void {
  if (dialogEl._dialogKeydown) {
    dialogEl.removeEventListener('keydown', dialogEl._dialogKeydown);
    dialogEl._dialogKeydown = null;
  }
  const trigger = dialogEl._dialogTrigger;
  dialogEl._dialogTrigger = null;
  if (options && options.pointer) {
    if (dialogEl.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
    }
  } else if (trigger && typeof trigger.focus === 'function') {
    retryFocus(trigger, 0);
  }
}
