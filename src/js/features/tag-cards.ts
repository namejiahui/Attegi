/**
 * Tags Index Page
 * Powers the /tags/ tag-card grid: custom icons from a tag's code
 * injection, a dominant-color sample for image cards, and a scrollable
 * post-preview list when a card has more posts than fit.
 */

import { qs, qsa, each } from '../core/index.js';

const VISIBLE_POST_COUNT = 3;

/**
 * Swap the default tag icon for one supplied via the tag's code
 * injection (<template data-tag-icon>...</template> or an inline SVG).
 */
function applyCustomIcons(): void {
  each(qsa('.tag-card'), (card: HTMLElement) => {
    const codeInjection = card.querySelector<HTMLTemplateElement>('.tag-code-injection');
    const iconContainer = card.querySelector<HTMLElement>('.tag-card-icon');
    if (!codeInjection || !iconContainer) return;

    const source = (codeInjection.content || codeInjection) as ParentNode;
    const iconTemplate = source.querySelector<HTMLElement>('[data-tag-icon]');
    if (iconTemplate) {
      const defaultIcon = iconContainer.querySelector<HTMLElement>('.tag-icon-default');
      if (defaultIcon) {
        defaultIcon.outerHTML = iconTemplate.tagName === 'TEMPLATE'
          ? (iconTemplate as HTMLTemplateElement).innerHTML
          : iconTemplate.outerHTML;
      }
    }
    codeInjection.remove();
  });
}

/**
 * Sample a dominant color from an image for the card border/shadow.
 * Loads a detached copy with crossOrigin set so a CORS failure only
 * skips the color sample instead of breaking the visible <img>.
 */
function sampleDominantColor(card: HTMLElement, srcImg: HTMLImageElement): void {
  const probe = new Image();
  probe.crossOrigin = 'anonymous';

  probe.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 50;
    canvas.width = size;
    canvas.height = size;

    try {
      ctx.drawImage(probe, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 16) {
        const pr = data[i];
        const pg = data[i + 1];
        const pb = data[i + 2];
        const brightness = (pr + pg + pb) / 3;
        if (brightness > 30 && brightness < 220) {
          r += pr;
          g += pg;
          b += pb;
          count++;
        }
      }
      if (!count) return;

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max !== min) {
        const mid = (max + min) / 2;
        const boost = 1.2;
        r = Math.min(255, Math.round(mid + (r - mid) * boost));
        g = Math.min(255, Math.round(mid + (g - mid) * boost));
        b = Math.min(255, Math.round(mid + (b - mid) * boost));
      }

      card.style.setProperty('--tag-image-color', `rgb(${r}, ${g}, ${b})`);
    } catch {
      // Canvas read blocked (CORS or otherwise) — keep the fallback color.
    }
  };

  probe.src = srcImg.currentSrc || srcImg.src;
}

function applyDominantColors(): void {
  each(qsa<HTMLElement>('.tag-card.has-image'), (card: HTMLElement) => {
    const img = card.querySelector<HTMLImageElement>('.tag-card-bg > img');
    if (img) sampleDominantColor(card, img);
  });
}

/**
 * Move a card's post previews into a scrollable wrapper once there are
 * more than fit in the visible area.
 */
function setupScrollablePosts(): void {
  each(qsa<HTMLElement>('.tag-card-posts'), (container: HTMLElement) => {
    const posts = qsa<HTMLElement>('.tag-post-preview', container);
    if (posts.length <= VISIBLE_POST_COUNT) return;

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'tag-posts-scroll';
    each(posts, (post: HTMLElement) => {
      scrollWrapper.appendChild(post);
    });
    container.insertBefore(scrollWrapper, container.firstChild);
    container.classList.add('is-scrollable');
  });
}

export function initTagCards(): void {
  if (!qs('.tags-grid')) return;

  applyCustomIcons();
  applyDominantColors();
  setupScrollablePosts();
}
