/**
 * Post Entry Point
 * Loads post-specific features. Site features come from site.js,
 * which default.hbs loads on every page.
 */

import { onReady, qs, doc } from '../core/index.js';
import { wrapEmbeds } from '../features/embeds.js';
import { highlightCode } from '../features/code-highlight.js';
import { setupShare, setupSharePopups } from '../features/share.js';
import { setupDisqus, setupLazyComments } from '../features/comments.js';
import { setupCoverBrightnessDetection } from '../features/cover-detect.js';
import { setupPortraitVideos, setupPortraitImages } from '../features/portrait-media.js';
import { setupFootnotes } from '../features/footnotes.js';
import { initTOC } from '../features/toc.js';
import { initPoemCards } from '../features/poem-cards.js';
import { detectContentLanguage } from '../features/lang-detect.js';
import { initToggleCards } from '../features/toggle-cards.js';

onReady(() => {
  const postContent = qs<HTMLElement>('.post-content');
  if (!postContent) return;

  detectContentLanguage(postContent);

  // Runs first and synchronously: unlike the other features below it needs
  // no external script, so doing it first cuts the flash of raw `[!poem]`
  // bracket syntax before the card renders.
  initPoemCards();

  // Get highlight.js URL from script tag. Valid here because this file loads
  // as a deferred classic script: `currentScript` is only reliable during a
  // script's own synchronous run.
  const currentScript = doc.currentScript || null;
  const highlightUrl = currentScript ? (currentScript.getAttribute('data-highlight') || '') : '';

  // Core post features
  wrapEmbeds(postContent);
  highlightCode(postContent, highlightUrl);
  setupShare();
  setupSharePopups();
  setupDisqus();
  setupLazyComments();
  setupCoverBrightnessDetection();
  setupPortraitVideos();
  setupPortraitImages();
  setupFootnotes(postContent);
  initToggleCards(postContent);

  // Initialize TOC (uses tocbot from external script)
  initTOC();
});
