/**
 * Progress Bar Feature
 * Shows reading progress based on scroll position
 */

import { qs } from '../core/index.js';
import { onScroll, getReadingProgress } from '../core/scroll.js';

/**
 * Initialize reading progress bar
 * @param content - Post content element
 */
export function setupProgress(content: Element | null): void {
  const progressBar = qs<HTMLElement>('.progress-bar');
  const progressContainer = qs<HTMLElement>('.progress-container');
  if (!progressBar || !progressContainer || !content) return;

  onScroll(() => {
    const progress = getReadingProgress(content);
    progressBar.style.width = `${Math.min(progress, 1) * 100}%`;
    progressContainer.classList.toggle('complete', progress > 1);
  });
}
