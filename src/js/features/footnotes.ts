/**
 * Footnotes Feature
 * Fixes footnote navigation links and IDs
 */

import { doc } from '../core/index.js';

interface FootnoteRef {
  element: HTMLElement;
  number: number;
}

/**
 * Setup footnote navigation
 * @param container - Post content container
 */
export function setupFootnotes(container: Element | null): void {
  if (!container) return;

  const sups = container.querySelectorAll<HTMLElement>('sup');
  const footnoteRefs: FootnoteRef[] = [];

  Array.prototype.forEach.call(sups, (sup: HTMLElement) => {
    const text = sup.textContent?.trim() || '';
    const match = text.match(/^\[(\d+)\]$/);
    if (match) {
      footnoteRefs.push({ element: sup, number: parseInt(match[1], 10) });
    }
  });

  if (!footnoteRefs.length) return;

  const lists = container.querySelectorAll<HTMLOListElement>('ol');
  let footnoteList: HTMLOListElement | null = null;

  Array.prototype.forEach.call(lists, (list: HTMLOListElement) => {
    const items = list.querySelectorAll('li');
    Array.prototype.forEach.call(items, (item: HTMLElement) => {
      if ((item.textContent || '').indexOf('↩︎') !== -1) {
        footnoteList = list;
      }
    });
  });

  if (!footnoteList) return;

  const footnoteItems = (footnoteList as HTMLOListElement).querySelectorAll<HTMLLIElement>('li');
  if (footnoteItems.length !== footnoteRefs.length) return;

  // Hide redundant HR before footnotes
  let prev = (footnoteList as HTMLOListElement).previousElementSibling;
  let hrCount = 0;
  while (prev && prev.tagName === 'HR' && hrCount < 2) {
    prev.classList.add('footnote-separator');
    prev = prev.previousElementSibling;
    hrCount++;
  }

  // Add IDs and fix back-reference links
  Array.prototype.forEach.call(footnoteItems, (item: HTMLLIElement, index: number) => {
    const number = index + 1;
    if (!item.id) item.id = `fn${number}`;

    const backLink = item.querySelector<HTMLAnchorElement>('a');
    if (backLink && (backLink.textContent || '').indexOf('↩︎') !== -1) {
      backLink.href = `#fnref${number}`;
      backLink.setAttribute('aria-label', `Back to reference ${number}`);
    }
  });

  // Convert references to links
  footnoteRefs.forEach((ref) => {
    const number = ref.number;
    ref.element.id = `fnref${number}`;

    const wrapperLink = ref.element.parentElement;
    if (wrapperLink && wrapperLink.tagName === 'A') {
      (wrapperLink as HTMLAnchorElement).href = `#fn${number}`;
      wrapperLink.setAttribute('aria-label', `Footnote ${number}`);
      return;
    }

    const existingLink = ref.element.querySelector<HTMLAnchorElement>('a');
    if (existingLink) {
      existingLink.href = `#fn${number}`;
      existingLink.setAttribute('aria-label', `Footnote ${number}`);
      return;
    }

    const link = doc.createElement('a');
    link.href = `#fn${number}`;
    link.textContent = `[${number}]`;
    link.setAttribute('aria-label', `Footnote ${number}`);
    ref.element.textContent = '';
    ref.element.appendChild(link);
  });
}
