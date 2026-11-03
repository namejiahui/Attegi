/**
 * Multilingual Language Selector Feature
 * Scales to arbitrary languages (2, 3, 4+) configured via Ghost Admin
 * (@custom.multilingual_locales, e.g. "zh:中文, en:English, ja:日本語").
 */

import { qs, qsa } from '../core/dom.js';

export interface LocaleItem {
  code: string;
  name: string;
  isRoot: boolean;
  prefix: string;
}

export function parseLocales(raw: string): LocaleItem[] {
  if (!raw) return [];
  const entries = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return entries.map((entry, index) => {
    const [rawCode, ...rest] = entry.split(':');
    const code = rawCode.trim().toLowerCase();
    const name = rest.join(':').trim() || code.toUpperCase();
    return {
      code,
      name,
      isRoot: index === 0,
      prefix: index === 0 ? '' : `/${code}`,
    };
  });
}

function resolveTargetUrl(item: LocaleItem, basePath: string): string {
  const queryAndHash = window.location.search + window.location.hash;
  if (item.isRoot) {
    return `${basePath}${queryAndHash}`;
  }
  const cleanBase = basePath === '/' ? '' : basePath;
  const path = `${item.prefix}${cleanBase}/`.replace(/\/+/g, '/');
  return `${path}${queryAndHash}`;
}

export function initLangSwitcher(): void {
  const container = qs<HTMLElement>('.lang-selector');
  const floatContainer = qs<HTMLElement>('.float-nav-lang');

  const rawConfig = container?.dataset.locales || floatContainer?.dataset.locales || '';
  const locales = parseLocales(rawConfig);
  if (locales.length === 0) return;

  const pathname = window.location.pathname;

  // Determine active locale
  let currentLocale = locales[0];
  for (let i = 1; i < locales.length; i++) {
    const loc = locales[i];
    const prefixRegex = new RegExp(`^${loc.prefix}(/|$)`, 'i');
    if (prefixRegex.test(pathname)) {
      currentLocale = loc;
      break;
    }
  }

  // Sync <html lang="...">
  document.documentElement.lang = currentLocale.code;

  // Compute canonical base path (without secondary language prefix)
  let basePath = pathname;
  if (!currentLocale.isRoot) {
    const curRegex = new RegExp(`^${currentLocale.prefix}(/|$)`, 'i');
    basePath = pathname.replace(curRegex, '/') || '/';
  }

  // Populate desktop header language selector
  if (container) {
    const labelEl = qs<HTMLElement>('.lang-current-label', container);
    if (labelEl) {
      labelEl.textContent = currentLocale.name;
    }

    const menuEl = qs<HTMLUListElement>('.lang-menu', container);
    const trigger = qs<HTMLButtonElement>('.lang-trigger', container);
    const popover = qs<HTMLElement>('.lang-popover', container);

    if (menuEl) {
      menuEl.innerHTML = locales
        .map((loc) => {
          const isActive = loc.code === currentLocale.code;
          const href = resolveTargetUrl(loc, basePath);
          const activeClass = isActive ? ' is-active' : '';
          const checkSvg = isActive
            ? '<i class="icon icon-check" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>'
            : '';
          return `<li role="none"><a href="${href}" class="lang-menu-item${activeClass}" role="menuitem"><span>${loc.name}</span>${checkSvg}</a></li>`;
        })
        .join('');
    }

    // Position popover under the trigger on open
    if (trigger && popover) {
      const positionMenu = () => {
        const rect = trigger.getBoundingClientRect();
        popover.style.top = `${rect.bottom + 8}px`;
        popover.style.right = `${Math.max(16, window.innerWidth - rect.right)}px`;
        popover.style.left = 'auto';
      };

      popover.addEventListener('toggle', (e: Event) => {
        const toggleEvent = e as ToggleEvent;
        if (toggleEvent.newState === 'open') {
          positionMenu();
        }
      });

      window.addEventListener('resize', () => {
        if (popover.matches(':popover-open')) {
          positionMenu();
        }
      }, { passive: true });
    }
  }

  // Populate mobile floating nav language pills
  if (floatContainer) {
    const pillsEl = qs<HTMLElement>('.float-nav-lang-pills', floatContainer);
    if (pillsEl) {
      pillsEl.innerHTML = locales
        .map((loc) => {
          const isActive = loc.code === currentLocale.code;
          const href = resolveTargetUrl(loc, basePath);
          const activeClass = isActive ? ' is-active' : '';
          return `<a href="${href}" class="float-nav-lang-pill${activeClass}">${loc.name}</a>`;
        })
        .join('');
    }
  }
}
