/**
 * Poem Cards Feature
 * Converts specially formatted blockquotes into poem cards
 */

import { qsa, doc } from '../core/index.js';

interface PoemData {
  title: string;
  verses: string[];
  author: string;
  centered: boolean;
  plain: boolean;
}

/**
 * Parse poem blockquote content
 */
function parsePoemBlockquote(blockquote: HTMLElement): PoemData | null {
  const lines: string[] = [];
  const paragraphs = blockquote.querySelectorAll('p');

  if (paragraphs.length > 0) {
    Array.prototype.forEach.call(paragraphs, (p: HTMLElement) => {
      const text = p.textContent?.trim() || '';
      if (text) lines.push(text);
    });
  } else {
    const clone = blockquote.cloneNode(true) as HTMLElement;
    const brs = clone.querySelectorAll('br');
    Array.prototype.forEach.call(brs, (br: HTMLElement) => {
      br.replaceWith('\n');
    });
    const parts = (clone.textContent || '').split(/\r?\n/);
    parts.forEach((part) => {
      const text = part.trim();
      if (text) lines.push(text);
    });
  }

  if (lines.length === 0) return null;

  // The marker must open the quote; a quote that merely mentions `[!poem]`
  // in its prose stays a plain blockquote.
  const poemMatch = lines[0].match(/^\[!poem\](.*)$/);
  if (!poemMatch) return null;

  const title = poemMatch[1].trim();
  const contentLines = lines.slice(1);
  let author = '';
  let verses = contentLines;

  // Only the LAST line can be the author credit, and only if it reads like
  // one (short) -- a legitimate poem line that happens to start with a dash
  // is usually longer than a "-- Name" credit and shouldn't be misread.
  const AUTHOR_LINE_MAX_LENGTH = 40;
  const lastLine = contentLines[contentLines.length - 1];
  if (lastLine && lastLine.length <= AUTHOR_LINE_MAX_LENGTH &&
      (lastLine.startsWith('—') || lastLine.startsWith('--') || lastLine.startsWith('- '))) {
    author = lastLine.replace(/^--/, '—').replace(/^- /, '— ');
    verses = contentLines.slice(0, contentLines.length - 1);
  }

  const centered = title.includes('[center]') || title.includes('[居中]');
  const plain = title.includes('[plain]') || title.includes('[非斜体]');

  const cleanTitle = title
    .replace(/\[center\]/gi, '')
    .replace(/\[居中\]/g, '')
    .replace(/\[plain\]/gi, '')
    .replace(/\[非斜体\]/g, '')
    .trim();

  return {
    title: cleanTitle,
    verses: verses.filter((v) => v.length > 0),
    author,
    centered,
    plain
  };
}

/**
 * Create poem card HTML element
 */
function createPoemCard(data: PoemData): HTMLElement {
  // <figure>/<blockquote>/<figcaption> keeps native quotation semantics;
  // a plain <p> for the title avoids skipping a heading level depending on
  // where the poem lands in the post's own h1-h6 outline.
  const card = doc.createElement('figure');
  card.className = 'kg-poem-card';

  if (data.centered) card.classList.add('kg-poem-centered');
  if (data.plain) card.classList.add('kg-poem-plain');

  if (data.title) {
    const header = doc.createElement('div');
    header.className = 'kg-poem-header';
    const titleEl = doc.createElement('p');
    titleEl.className = 'kg-poem-title';
    titleEl.textContent = data.title;
    header.appendChild(titleEl);
    card.appendChild(header);

    const divider1 = doc.createElement('div');
    divider1.className = 'kg-poem-divider';
    card.appendChild(divider1);
  }

  if (data.verses.length > 0) {
    const content = doc.createElement('blockquote');
    content.className = 'kg-poem-content';
    data.verses.forEach((verse) => {
      const line = doc.createElement('p');
      line.className = 'kg-poem-line';
      line.textContent = verse;
      content.appendChild(line);
    });
    card.appendChild(content);
  }

  if (data.author) {
    const authorEl = doc.createElement('figcaption');
    authorEl.className = 'kg-poem-author';
    authorEl.textContent = data.author;
    card.appendChild(authorEl);
  }

  return card;
}

/**
 * Initialize poem cards
 */
export function initPoemCards(): void {
  const blockquotes = qsa<HTMLElement>('.post-content blockquote');

  Array.prototype.forEach.call(blockquotes, (blockquote: HTMLElement) => {
    if (!/^\s*\[!poem\]/.test(blockquote.textContent || '')) return;

    const poemData = parsePoemBlockquote(blockquote);
    if (poemData) {
      const poemCard = createPoemCard(poemData);
      blockquote.parentNode?.replaceChild(poemCard, blockquote);
    } else {
      // Not a parsable poem after all: show the plain blockquote again.
      blockquote.classList.remove('kg-poem-pending');
    }
  });
}
