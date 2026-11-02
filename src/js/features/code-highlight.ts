/**
 * Code Highlight Feature
 * Syntax highlighting with copy button using highlight.js
 */

import { doc } from '../core/index.js';
import { getI18n } from '../core/i18n.js';

// Language display name mapping
const languageNames: Record<string, string> = {
  javascript: 'JavaScript', js: 'JavaScript',
  typescript: 'TypeScript', ts: 'TypeScript',
  python: 'Python', py: 'Python',
  java: 'Java', c: 'C', cpp: 'C++',
  csharp: 'C#', cs: 'C#', go: 'Go',
  rust: 'Rust', ruby: 'Ruby', rb: 'Ruby',
  php: 'PHP', swift: 'Swift', kotlin: 'Kotlin',
  sql: 'SQL', html: 'HTML', xml: 'XML',
  css: 'CSS', scss: 'SCSS', json: 'JSON',
  yaml: 'YAML', yml: 'YAML', markdown: 'Markdown',
  md: 'Markdown', bash: 'Bash', shell: 'Shell',
  sh: 'Shell', dockerfile: 'Dockerfile',
  powershell: 'PowerShell', ps1: 'PowerShell',
  ocaml: 'OCaml', fsharp: 'F#', matlab: 'MATLAB',
  objectivec: 'Objective-C', objc: 'Objective-C',
  asm: 'Assembly', vb: 'Visual Basic', vbnet: 'VB.NET',
  graphql: 'GraphQL', toml: 'TOML', ini: 'INI',
  cmake: 'CMake', plaintext: 'Plain Text', text: 'Plain Text'
};

function getLanguageDisplayName(langClass?: string | null): string | null {
  if (!langClass) return null;
  const match = langClass.match(/language-(\w+)/i);
  if (!match) return null;
  const lang = match[1].toLowerCase();
  return languageNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

function legacyCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const textarea = doc.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      doc.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      // iOS Safari ignores select() on textareas
      textarea.setSelectionRange(0, textarea.value.length);
      const successful = doc.execCommand && doc.execCommand('copy');
      doc.body.removeChild(textarea);
      successful ? resolve() : reject(new Error('Copy failed'));
    } catch (err) {
      reject(err);
    }
  });
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return legacyCopy(text);
}

function createCodeHeader(pre: HTMLElement, code: HTMLElement, langName: string | null): void {
  const copyLabel = getI18n('copy', 'Copy');
  const copiedLabel = getI18n('copied', 'Copied!');
  const copyAria = getI18n('copy-code', 'Copy code');
  const copyIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const copiedIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  const header = doc.createElement('div');
  header.className = 'code-header';

  const lang = doc.createElement('span');
  lang.className = 'code-lang';
  lang.textContent = langName || '';
  header.appendChild(lang);

  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = 'code-copy-btn';
  btn.setAttribute('aria-label', copyAria);

  function setCopyButtonState(isCopied: boolean): void {
    btn.innerHTML = isCopied ? copiedIcon : copyIcon;
    const label = doc.createElement('span');
    label.textContent = isCopied ? copiedLabel : copyLabel;
    btn.appendChild(label);
    // Keep the announced state in sync so screen-reader users get
    // confirmation the copy succeeded (WCAG 4.1.3 Status Messages).
    btn.setAttribute('aria-label', isCopied ? copiedLabel : copyAria);
  }

  setCopyButtonState(false);

  btn.addEventListener('click', () => {
    const text = code.textContent || (code as HTMLElement).innerText || '';
    copyToClipboard(text).then(() => {
      btn.classList.add('copied');
      setCopyButtonState(true);
      setTimeout(() => {
        btn.classList.remove('copied');
        setCopyButtonState(false);
      }, 2000);
    }).catch(() => {});
  });

  header.appendChild(btn);
  pre.insertBefore(header, pre.firstChild);
}

/**
 * Initialize code highlighting
 * @param container - Container element
 * @param highlightUrl - URL to highlight.js script
 */
export function highlightCode(container: Element | null, highlightUrl: string): void {
  if (!container) return;
  const blocks = container.querySelectorAll<HTMLElement>('pre code');
  if (!blocks.length) return;

  function sanitizeHighlightUrl(url: string): string {
    if (!url) return '';
    try {
      const parsed = new URL(url, doc.baseURI);
      return parsed.origin === location.origin ? parsed.href : '';
    } catch {
      return '';
    }
  }

  function applyHighlight(): void {
    if (!window.hljs) return;
    // Safe only because Ghost's Koenig editor always pre-escapes code-card
    // output before it reaches this container.
    window.hljs.configure({ ignoreUnescapedHTML: true });
    Array.prototype.forEach.call(blocks, (code: HTMLElement) => {
      window.hljs!.highlightElement(code);
      const pre = code.parentElement;
      if (pre && !pre.querySelector('.code-header')) {
        const langName = getLanguageDisplayName(code.className);
        createCodeHeader(pre, code, langName);
      }
    });
  }

  if (window.hljs) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(applyHighlight, { timeout: 300 });
    } else {
      setTimeout(applyHighlight, 0);
    }
    return;
  }

  const cleanUrl = sanitizeHighlightUrl(highlightUrl);
  if (!cleanUrl) return;

  const script = doc.createElement('script');
  script.src = cleanUrl;
  script.defer = true;
  script.onload = applyHighlight;

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      doc.body.appendChild(script);
    }, { timeout: 500 });
  } else {
    setTimeout(() => {
      doc.body.appendChild(script);
    }, 0);
  }
}
