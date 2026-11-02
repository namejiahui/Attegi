/**
 * Internationalization Helper
 * Retrieves translated strings from data attributes on body element
 */

/**
 * Get internationalized string from body data attribute
 */
export function getI18n(key: string, fallback: string): string {
  const body = document.body;
  if (!body) return fallback;
  const value = body.getAttribute(`data-i18n-${key}`);
  return value || fallback;
}
