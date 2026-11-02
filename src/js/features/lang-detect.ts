/**
 * Content Language Detection
 * The site's <html lang> is a single site-wide locale, but posts are
 * bilingual (English/Chinese). Mark the actual language on the content
 * element so `:lang(zh)` CSS rules (tracking, line-height, no faux italics)
 * apply where the post is really Chinese.
 */

const CJK_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf]/g;

export function detectContentLanguage(content: HTMLElement | null): void {
  if (!content) return;

  const text = content.textContent || '';
  if (!text.trim()) return;

  const cjkCount = (text.match(CJK_PATTERN) || []).length;
  if (cjkCount / text.length > 0.15) {
    content.lang = 'zh';
  }
}
