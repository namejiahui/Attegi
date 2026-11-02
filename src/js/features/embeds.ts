/**
 * Embeds Feature
 * Wraps video/iframe embeds for responsive sizing
 */

import { doc } from '../core/index.js';

/**
 * Wrap embed elements for responsive behavior
 * @param container - Container element to search within
 */
export function wrapEmbeds(container: Element | null): void {
  if (!container) return;

  const selectors = [
    'iframe[src*="youtube.com"]',
    'iframe[src*="youtu.be"]',
    'iframe[src*="vimeo.com"]',
    'iframe[src*="bilibili.com"]',
    'iframe[src*="player.spotify.com"]',
    'iframe[src*="soundcloud.com"]',
    'iframe[src*="music.163.com"]',
    'iframe[src*="qq.com"]',
    'object',
    'embed',
    'video'
  ];

  function getNumericAttribute(node: Element, name: string): number | null {
    const value = node.getAttribute(name);
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed || /%$/.test(trimmed)) return null;
    const numberValue = parseFloat(trimmed);
    if (isNaN(numberValue)) return null;
    return numberValue > 0 ? numberValue : null;
  }

  function getEmbedRatio(node: Element): string | null {
    const width = getNumericAttribute(node, 'width');
    const height = getNumericAttribute(node, 'height');
    if (!width || !height) return null;
    return `${width} / ${height}`;
  }

  function applyWrapperRatio(wrapper: HTMLElement, ratio: string): void {
    if (!wrapper || !ratio) return;
    wrapper.style.aspectRatio = ratio;
  }

  function applyVideoRatio(video: HTMLVideoElement, wrapper: HTMLElement): void {
    if (!video || !wrapper) return;
    if (!video.videoWidth || !video.videoHeight) return;
    applyWrapperRatio(wrapper, `${video.videoWidth} / ${video.videoHeight}`);
  }

  // youtube-nocookie.com skips third-party cookies/tracking (doubleclick,
  // googleads) until the viewer actually presses play.
  function useNoCookieDomain(node: Element): void {
    const src = node.getAttribute('src') || '';
    if (src.indexOf('youtube.com/embed/') === -1) return;
    node.setAttribute('src', src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/'));
  }

  function wrapNode(node: Element): void {
    if (node.closest('.js-reframe')) return;
    if (node.tagName.toLowerCase() === 'video' && node.closest('.kg-video-card')) return;

    if (node.tagName.toLowerCase() === 'iframe') {
      useNoCookieDomain(node);
    }

    const wrapper = doc.createElement('div');
    wrapper.className = 'js-reframe';
    const ratio = getEmbedRatio(node);
    if (ratio) {
      applyWrapperRatio(wrapper, ratio);
    }
    node.parentNode?.insertBefore(wrapper, node);
    wrapper.appendChild(node);

    if (!ratio && node.tagName.toLowerCase() === 'video') {
      const video = node as HTMLVideoElement;
      const applyOnce = () => {
        applyVideoRatio(video, wrapper);
        video.removeEventListener('loadedmetadata', applyOnce);
      };
      if (video.readyState >= 1) {
        applyOnce();
      } else {
        video.addEventListener('loadedmetadata', applyOnce);
      }
    }
  }

  selectors.forEach((selector) => {
    const nodes = container.querySelectorAll(selector);
    Array.prototype.forEach.call(nodes, wrapNode);
  });
}
