/**
 * Gallery Feature
 * Sets proper aspect ratios for Ghost gallery images
 */

import { qsa } from '../core/index.js';

/**
 * Initialize gallery image aspect ratio handling
 */
export function initGallery(): void {
  const images = qsa<HTMLImageElement>('.kg-gallery-image img');

  requestAnimationFrame(() => {
    Array.prototype.forEach.call(images, (image: HTMLImageElement) => {
      function getNumericValue(value: string | null): number | null {
        if (!value) return null;
        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) return null;
        return numberValue > 0 ? numberValue : null;
      }

      function getImageRatio(img: HTMLImageElement): number | null {
        const widthAttr = getNumericValue(img.getAttribute('width'));
        const heightAttr = getNumericValue(img.getAttribute('height'));
        if (widthAttr && heightAttr) return widthAttr / heightAttr;
        if (img.naturalWidth && img.naturalHeight) {
          return img.naturalWidth / img.naturalHeight;
        }
        return null;
      }

      function applyRatio(img: HTMLImageElement): void {
        const container = img.closest<HTMLElement>('.kg-gallery-image');
        if (!container) return;
        const ratio = getImageRatio(img);
        if (!ratio) return;
        container.style.flex = `${ratio} 1 0%`;
      }

      if (image.complete && image.naturalWidth > 0) {
        applyRatio(image);
      } else {
        const onLoad = () => {
          applyRatio(image);
          image.removeEventListener('load', onLoad);
        };
        image.addEventListener('load', onLoad);
      }
    });
  });
}
