/**
 * Comments Feature
 * Lazy loading for Disqus and Ghost native comments
 */

import { doc, qs } from '../core/index.js';

function sanitizeDisqusShortname(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  return /^[a-z0-9_-]+$/i.test(trimmed) ? trimmed : '';
}

/**
 * Initialize Disqus lazy loading
 */
export function setupDisqus(): void {
  const thread = doc.getElementById('disqus_thread');
  const rawShortname = thread && thread.dataset ? thread.dataset.disqusShortname : '';
  const shortname = sanitizeDisqusShortname(rawShortname);
  if (!thread || !shortname) return;

  let loaded = false;

  function loadDisqus(): void {
    if (loaded) return;
    loaded = true;
    const script = doc.createElement('script');
    script.src = `https://${shortname}.disqus.com/embed.js`;
    script.async = true;
    script.setAttribute('data-timestamp', String(Date.now()));
    doc.body.appendChild(script);
  }

  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadDisqus();
          observer.disconnect();
        }
      });
    }, { rootMargin: '400px 0px' });
    observer.observe(thread);
  } else {
    window.addEventListener('scroll', loadDisqus, { passive: true });
    window.addEventListener('touchstart', loadDisqus, { passive: true });
  }
}

/**
 * Initialize Ghost native comments lazy loading
 */
export function setupLazyComments(): void {
  const template = doc.getElementById('ghost-comments-template') as HTMLTemplateElement | null;
  const placeholder = qs<HTMLElement>('[data-comments-placeholder]');
  const trigger = qs<HTMLElement>('.js-load-comments');
  if (!template || !placeholder || !trigger) return;

  let hasLoaded = false;

  function cloneTemplateContent(node: HTMLTemplateElement): Node | null {
    if (!node) return null;
    if (node.content && node.content.cloneNode) {
      return node.content.cloneNode(true);
    }
    if (!node.childNodes || !node.childNodes.length) return null;
    const fragment = doc.createDocumentFragment();
    Array.prototype.forEach.call(node.childNodes, (child: Node) => {
      fragment.appendChild(child.cloneNode(true));
    });
    return fragment.childNodes.length ? fragment : null;
  }

  function activateScripts(container: HTMLElement, scripts: HTMLScriptElement[]): void {
    scripts.forEach((original) => {
      const replacement = doc.createElement('script');
      Array.prototype.forEach.call(original.attributes, (attr: Attr) => {
        if (attr.name === 'type') {
          const normalized = /text\/javascript/i.test(attr.value) ? 'text/javascript' : attr.value;
          if (normalized) replacement.setAttribute('type', normalized);
          return;
        }
        replacement.setAttribute(attr.name, attr.value);
      });
      replacement.textContent = original.textContent;
      if (original.src) replacement.src = original.src;
      container.appendChild(replacement);
    });
  }

  function loadComments(): void {
    if (hasLoaded) return;
    hasLoaded = true;
    trigger!.setAttribute('aria-busy', 'true');
    trigger!.classList.add('is-loading');

    // Wait for the loading state to actually paint before the synchronous
    // clone/insert work below, instead of guessing at a timeout.
    requestAnimationFrame(() => {
      try {
        const content = cloneTemplateContent(template!);
        if (!content) {
          hasLoaded = false;
          trigger!.classList.remove('is-loading');
          trigger!.removeAttribute('aria-busy');
          return;
        }

        const fragmentScripts = (content as HTMLElement).querySelectorAll
          ? (content as HTMLElement).querySelectorAll('script')
          : [];
        const storedScripts: HTMLScriptElement[] = [];
        Array.prototype.forEach.call(fragmentScripts, (script: HTMLScriptElement) => {
          storedScripts.push(script);
          if (script.parentNode) script.parentNode.removeChild(script);
        });

        // appendChild is synchronous, so the content is already in the DOM
        // by the next line -- no need to wait before activating scripts.
        placeholder!.appendChild(content);
        activateScripts(placeholder!, storedScripts);

        trigger!.classList.add('is-loaded');
        trigger!.setAttribute('aria-expanded', 'true');
        trigger!.setAttribute('hidden', 'true');
        trigger!.removeAttribute('aria-busy');

        // The trigger is now hidden and unfocusable; move focus into the
        // loaded comments instead of dropping it back to <body>.
        placeholder!.setAttribute('tabindex', '-1');
        placeholder!.focus();
      } catch {
        hasLoaded = false;
        trigger!.classList.remove('is-loading');
        trigger!.removeAttribute('aria-busy');
      }
    });
  }

  trigger.addEventListener('click', loadComments);

  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadComments();
          observer.disconnect();
        }
      });
    }, { rootMargin: '200px 0px' });
    observer.observe(placeholder);
  }
}
