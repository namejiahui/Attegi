/**
 * Table of Contents Feature
 * Auto-generates TOC from post headings with scroll spy using tocbot
 */

import { doc, qs } from '../core/index.js';
import { getI18n } from '../core/i18n.js';
import { onScroll, getReadingProgress, getFooterAvoidingBottom } from '../core/scroll.js';
import { openDialog, closeDialog, isPointerClick, type DialogElement } from '../core/dialog.js';

interface TocLabels {
  tocLabel: string;
  onThisPage: string;
  openToc: string;
  closeToc: string;
  toggleSubsections: string;
}

const config = { minHeadings: 2 };
const state = {
  isOpen: false,
  isVisible: false,
  articleTop: 0,
  articleBottom: 0,
  lastScrollTop: 0,
  isScrollingDown: false
};

const elements: {
  sidebar: HTMLElement | null;
  mobileTrigger: HTMLButtonElement | null;
  mobileOverlay: HTMLElement | null;
  mobileDrawer: DialogElement | null;
  mobileList: HTMLElement | null;
} = {
  sidebar: null,
  mobileTrigger: null,
  mobileOverlay: null,
  mobileDrawer: null,
  mobileList: null
};

let footer: HTMLElement | null = null;
const triggerSafeMargin = 16;
let triggerDefaultBottom: number | null = null;

function getTocLabels(): TocLabels {
  return {
    tocLabel: getI18n('toc-label', 'Table of Contents'),
    onThisPage: getI18n('on-this-page', 'On this page'),
    openToc: getI18n('open-toc', 'Open table of contents'),
    closeToc: getI18n('close-toc', 'Close table of contents'),
    toggleSubsections: getI18n('toggle-subsections', 'Toggle subsections')
  };
}

function createDesktopTOC(labels: TocLabels): void {
  const sidebar = doc.createElement('aside');
  sidebar.className = 'toc-sidebar';
  sidebar.setAttribute('aria-label', labels.tocLabel);

  const container = doc.createElement('div');
  container.className = 'toc-container';

  const header = doc.createElement('div');
  header.className = 'toc-header';
  const title = doc.createElement('h3');
  title.className = 'toc-title';
  title.textContent = labels.onThisPage;
  header.appendChild(title);

  const list = doc.createElement('nav');
  list.className = 'toc-list';
  list.setAttribute('aria-label', labels.tocLabel);

  container.appendChild(header);
  container.appendChild(list);
  sidebar.appendChild(container);
  doc.body.appendChild(sidebar);

  elements.sidebar = sidebar;
}

function createMobileTOC(labels: TocLabels): void {
  const circumference = 2 * Math.PI * 20;

  const trigger = doc.createElement('button');
  trigger.className = 'toc-mobile-trigger';
  trigger.setAttribute('aria-label', labels.openToc);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.innerHTML =
    '<svg class="toc-progress-ring" viewBox="0 0 44 44">' +
      '<circle class="toc-progress-ring__bg" cx="22" cy="22" r="20"></circle>' +
      '<circle class="toc-progress-ring__progress" cx="22" cy="22" r="20" ' +
        `stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"></circle>` +
    '</svg>' +
    '<svg class="toc-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line>' +
      '<line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line>' +
      '<line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>' +
    '</svg>';

  const overlay = doc.createElement('div');
  overlay.className = 'toc-mobile-overlay';

  const drawer = doc.createElement('div') as DialogElement;
  drawer.className = 'toc-mobile-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', 'toc-mobile-title');

  const header = doc.createElement('div');
  header.className = 'toc-mobile-header';
  const mobileTitle = doc.createElement('h3');
  mobileTitle.className = 'toc-mobile-title';
  mobileTitle.id = 'toc-mobile-title';
  mobileTitle.textContent = labels.onThisPage;
  header.appendChild(mobileTitle);

  const closeBtn = doc.createElement('button');
  closeBtn.className = 'toc-mobile-close';
  closeBtn.setAttribute('aria-label', labels.closeToc);
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  header.appendChild(closeBtn);

  const content = doc.createElement('div');
  content.className = 'toc-mobile-content';
  const list = doc.createElement('nav');
  list.className = 'toc-mobile-list';
  list.setAttribute('aria-label', labels.tocLabel);
  content.appendChild(list);

  drawer.appendChild(header);
  drawer.appendChild(content);

  doc.body.appendChild(trigger);
  doc.body.appendChild(overlay);
  doc.body.appendChild(drawer);

  elements.mobileTrigger = trigger;
  elements.mobileOverlay = overlay;
  elements.mobileDrawer = drawer;
  elements.mobileList = list;
}

function copyTocToMobile(): void {
  const desktopList = qs('.toc-sidebar .toc-list');
  if (!desktopList || !elements.mobileList) return;

  const clone = desktopList.cloneNode(true) as HTMLElement;
  clone.className = 'toc-mobile-list';

  const items = clone.querySelectorAll('.toc-item');
  Array.prototype.forEach.call(items, (item: HTMLElement) => {
    item.className = item.className.replace('toc-item', 'toc-mobile-item');
  });

  const links = clone.querySelectorAll<HTMLAnchorElement>('.toc-link');
  Array.prototype.forEach.call(links, (link: HTMLAnchorElement) => {
    link.className = link.className.replace('toc-link', 'toc-mobile-link');
    link.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href) return;
      const targetId = href.substring(1);
      const target = doc.getElementById(targetId);
      if (target) {
        requestCloseMobileTOC();
        setTimeout(() => {
          window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' });
        }, 300);
      }
    });
  });

  Array.prototype.forEach.call(clone.querySelectorAll('.toc-fold'), (btn: HTMLElement) => {
    btn.remove();
  });

  const nestedLists = clone.querySelectorAll('.toc-list');
  Array.prototype.forEach.call(nestedLists, (list: HTMLElement) => {
    list.className = list.className.replace('toc-list', 'toc-mobile-list');
  });

  elements.mobileList.innerHTML = '';
  while (clone.firstChild) {
    elements.mobileList.appendChild(clone.firstChild);
  }
}

function syncMobileActiveState(): void {
  if (!elements.mobileList) return;
  const activeDesktopLink = qs('.toc-sidebar .toc-link.is-active');
  const activeHref = activeDesktopLink ? activeDesktopLink.getAttribute('href') : null;

  const mobileLinks = elements.mobileList.querySelectorAll<HTMLAnchorElement>('.toc-mobile-link');
  Array.prototype.forEach.call(mobileLinks, (link: HTMLAnchorElement) => {
    if (activeHref && link.getAttribute('href') === activeHref) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'location');
    } else {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    }
  });
}

// Sections with folded sub-headings get a chevron. tocbot folds and unfolds
// them on scroll via .is-collapsed; the chevron adds a reader override on the
// item (data-fold="open" | "closed") that CSS honors over tocbot's state.
function isFoldOpen(item: HTMLElement): boolean {
  if (item.dataset.fold) return item.dataset.fold === 'open';
  const sub = item.querySelector(':scope > .toc-list');
  return sub ? !sub.classList.contains('is-collapsed') : false;
}

function syncFoldButton(item: HTMLElement): void {
  const btn = item.querySelector(':scope > .toc-fold');
  if (btn) btn.setAttribute('aria-expanded', String(isFoldOpen(item)));
}

function addFoldToggles(labels: TocLabels): void {
  if (!elements.sidebar) return;
  const items = elements.sidebar.querySelectorAll<HTMLElement>('.toc-item');
  Array.prototype.forEach.call(items, (item: HTMLElement) => {
    const sub = item.querySelector(':scope > .toc-list');
    if (!sub) return;
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'toc-fold';
    btn.setAttribute('aria-label', labels.toggleSubsections);
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    btn.addEventListener('click', () => {
      item.dataset.fold = isFoldOpen(item) ? 'closed' : 'open';
      syncFoldButton(item);
    });
    // Appended, not placed after the link: tocbot finds the sub-list through
    // link.nextSibling. CSS grid puts the chevron back on the first row.
    item.appendChild(btn);
    syncFoldButton(item);
  });
}

// Keep the active link centered in the desktop sidebar, which scrolls with a hidden scrollbar
function scrollSidebarToActiveLink(activeLink: HTMLElement): void {
  const sidebar = elements.sidebar;
  if (!sidebar) return;
  const sidebarRect = sidebar.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  const linkTop = linkRect.top - sidebarRect.top + sidebar.scrollTop;
  const targetScroll = linkTop - sidebarRect.height / 2 + linkRect.height / 2;
  const maxScroll = sidebar.scrollHeight - sidebarRect.height;

  sidebar.scrollTo({ top: Math.max(0, Math.min(targetScroll, maxScroll)), behavior: 'smooth' });
}

// tocbot has no active-change callback, so watch for its class toggles
function setupSidebarAutoScroll(): void {
  const tocList = qs('.toc-sidebar .toc-list');
  if (!tocList || !elements.sidebar) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const target = mutation.target as HTMLElement;
      if (target.classList.contains('toc-list') && target.parentElement?.classList.contains('toc-item')) {
        syncFoldButton(target.parentElement);
        return;
      }
      if (!target.classList.contains('toc-link')) return;
      const isActive = target.classList.contains('is-active');
      if (isActive) {
        target.setAttribute('aria-current', 'location');
        scrollSidebarToActiveLink(target);
        syncMobileActiveState();
      } else {
        target.removeAttribute('aria-current');
      }
    });
  });

  observer.observe(tocList, { attributes: true, subtree: true, attributeFilter: ['class'] });
}

function smoothScrollContainer(container: HTMLElement, target: number, duration: number): void {
  const start = container.scrollTop;
  const change = target - start;
  if (Math.abs(change) < 1) return;

  let startTime: number | null = null;
  const easeInOut = (t: number) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };

  function step(timestamp: number): void {
    if (!startTime) startTime = timestamp;
    const elapsed = Math.min((timestamp - startTime) / duration, 1);
    const eased = easeInOut(elapsed);
    container.scrollTop = start + change * eased;
    if (elapsed < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function scrollMobileTOCToActiveItem(): void {
  if (!elements.mobileDrawer || !elements.mobileList) return;
  const content = elements.mobileDrawer.querySelector<HTMLElement>('.toc-mobile-content');
  const activeLink = elements.mobileList.querySelector<HTMLElement>('.toc-mobile-link.is-active');
  if (!content || !activeLink) return;

  requestAnimationFrame(() => {
    const contentRect = content.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const isVisible = linkRect.top >= contentRect.top + 8 && linkRect.bottom <= contentRect.bottom - 8;
    if (isVisible) return;

    const linkTop = linkRect.top - contentRect.top + content.scrollTop;
    const targetScroll = linkTop - contentRect.height * 0.3;
    const maxScroll = content.scrollHeight - contentRect.height;
    const clamped = Math.max(0, Math.min(targetScroll, maxScroll));

    smoothScrollContainer(content, clamped, 220);
  });
}

function openMobileTOC(event?: Event): void {
  if (event && event.preventDefault) {
    event.preventDefault();
  }
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }

  syncMobileActiveState();
  suppressHoverOnce();
  state.isOpen = true;

  if (elements.mobileTrigger && elements.mobileOverlay && elements.mobileDrawer) {
    // Blur the trigger before hiding it: hiding a still-focused element makes
    // the browser move focus to <body> on its own, which can race with (and
    // undo) the focus we set into the drawer just below.
    elements.mobileTrigger.blur();
    elements.mobileTrigger.classList.add('is-hidden');
    elements.mobileTrigger.setAttribute('aria-expanded', 'true');
    elements.mobileOverlay.classList.add('is-open');
    elements.mobileDrawer.classList.add('is-open');

    openDialog(elements.mobileDrawer, {
      trigger: elements.mobileTrigger,
      onClose: closeMobileTOC,
      pointer: isPointerClick(event)
    });
  }

  setTimeout(() => {
    scrollMobileTOCToActiveItem();
  }, 200);
}

// Visual/state close only. Callers pair this with `closeDialog` themselves
// (see `requestCloseMobileTOC` below) so the trigger is un-hidden — and
// focusable again — before focus is restored to it.
function closeMobileTOC(): void {
  if (!state.isOpen) return;
  state.isOpen = false;
  if (elements.mobileTrigger) {
    elements.mobileTrigger.classList.remove('is-hidden');
    elements.mobileTrigger.setAttribute('aria-expanded', 'false');
  }
  elements.mobileOverlay?.classList.remove('is-open');
  elements.mobileDrawer?.classList.remove('is-open');
  doc.body.classList.remove('toc-suppress-hover');
}

function requestCloseMobileTOC(event?: Event): void {
  closeMobileTOC();
  if (elements.mobileDrawer) {
    closeDialog(elements.mobileDrawer, { pointer: isPointerClick(event) });
  }
}

function updateProgressRing(): void {
  if (!elements.mobileTrigger) return;
  const progressCircle = elements.mobileTrigger.querySelector<SVGCircleElement>('.toc-progress-ring__progress');
  const postContent = qs('.post-content');
  if (!progressCircle || !postContent) return;

  const progress = Math.min(getReadingProgress(postContent), 1);
  const circumference = 2 * Math.PI * 20;
  progressCircle.style.strokeDashoffset = String(circumference * (1 - progress));
}

function setTriggerDefaultBottom(): void {
  if (triggerDefaultBottom !== null || !elements.mobileTrigger) return;
  const style = window.getComputedStyle(elements.mobileTrigger);
  const value = parseFloat(style.bottom);
  triggerDefaultBottom = isNaN(value) ? 32 : value;
}

function getTriggerDefaultBottom(): number {
  return triggerDefaultBottom !== null ? triggerDefaultBottom : 32;
}

function updateTriggerPosition(): void {
  if (!elements.mobileTrigger || !footer) return;
  setTriggerDefaultBottom();

  const defaultBottom = getTriggerDefaultBottom();
  const btnHeight = elements.mobileTrigger.getBoundingClientRect().height || 0;

  elements.mobileTrigger.style.bottom =
    `${getFooterAvoidingBottom(footer, defaultBottom, btnHeight, triggerSafeMargin)}px`;
}

function updateMobileTriggerVisibility(scrollTop: number): void {
  if (!elements.mobileTrigger) return;
  const shouldShow = scrollTop >= 200;
  elements.mobileTrigger.classList.toggle('is-visible', shouldShow);
}

function updateTOCVisibility(): void {
  if (!elements.sidebar) return;
  const scrollTop = window.pageYOffset || doc.documentElement.scrollTop;
  const viewportHeight = window.innerHeight;

  // Detect scroll direction
  const scrollDelta = scrollTop - state.lastScrollTop;
  if (Math.abs(scrollDelta) > 5) {
    state.isScrollingDown = scrollDelta > 0;
  }

  state.lastScrollTop = scrollTop;
  updateMobileTriggerVisibility(scrollTop);

  const postContent = qs('.post-content');
  if (postContent) {
    const rect = postContent.getBoundingClientRect();
    state.articleTop = rect.top + scrollTop;
    state.articleBottom = rect.bottom + scrollTop;
  }

  const showStart = state.articleTop - 100;
  const showEnd = state.articleBottom - viewportHeight + 100;
  const shouldShow = scrollTop >= showStart && scrollTop <= showEnd;

  if (shouldShow !== state.isVisible) {
    state.isVisible = shouldShow;
    elements.sidebar.classList.toggle('is-visible', shouldShow);
  }
}

function suppressHoverOnce(): void {
  doc.body.classList.add('toc-suppress-hover');

  function clear(): void {
    doc.body.classList.remove('toc-suppress-hover');
    doc.removeEventListener('mousemove', clear);
    doc.removeEventListener('touchstart', clear);
  }

  doc.addEventListener('mousemove', clear, { once: true });
  doc.addEventListener('touchstart', clear, { once: true, passive: true });
}

/**
 * Initialize Table of Contents
 */
export function initTOC(): void {
  const postContent = qs('.post-content');
  if (!postContent || postContent.classList.contains('no-toc')) return;

  const headings = postContent.querySelectorAll('h2, h3, h4');
  const tocHeadings = Array.prototype.filter.call(headings, (h: Element) => {
    return !h.closest('.kg-poem-card');
  });
  if (tocHeadings.length < config.minHeadings) return;

  const labels = getTocLabels();
  createDesktopTOC(labels);
  createMobileTOC(labels);
  footer = qs<HTMLElement>('.nav-footer');
  setTriggerDefaultBottom();

  if (typeof tocbot !== 'undefined') {
    tocbot.init({
      tocSelector: '.toc-list',
      contentSelector: '.post-content',
      headingSelector: 'h2, h3, h4',
      ignoreSelector: '.js-toc-ignore, .kg-poem-card h2, .kg-poem-card h3, .kg-poem-card h4, .gh-post-upgrade-cta h2',
      hasInnerContainers: true,
      linkClass: 'toc-link',
      activeLinkClass: 'is-active',
      listClass: 'toc-list',
      listItemClass: 'toc-item',
      // Show h2s only; tocbot expands the active section's h3s
      collapseDepth: 2,
      scrollSmooth: true,
      scrollSmoothOffset: -100,
      headingsOffset: 100,
      throttleTimeout: 50,
      orderedList: false,
      onClick: () => { if (state.isOpen) requestCloseMobileTOC(); }
    });
    addFoldToggles(labels);
    setupSidebarAutoScroll();
    setTimeout(() => {
      copyTocToMobile();
      syncMobileActiveState();
      updateTOCVisibility();
    }, 100);
  }

  // Shared scroll source: one listener drives TOC visibility, the trigger's
  // progress ring and its footer-avoidance position.
  onScroll(() => {
    updateTOCVisibility();
    updateProgressRing();
    updateTriggerPosition();
  });
  updateMobileTriggerVisibility(window.pageYOffset || doc.documentElement.scrollTop);

  elements.mobileTrigger?.addEventListener('click', openMobileTOC);
  elements.mobileOverlay?.addEventListener('click', requestCloseMobileTOC);
  elements.mobileDrawer?.querySelector('.toc-mobile-close')?.addEventListener('click', requestCloseMobileTOC);

  doc.body.classList.add('has-toc');
  setTimeout(() => { elements.mobileTrigger?.classList.add('is-visible'); }, 500);
}
