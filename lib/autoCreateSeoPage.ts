/**
 * Auto-create SEO page in background when user searches any keyword.
 * Fire-and-forget — never blocks UI or throws errors.
 * Creates a page at /k/[keyword] for Google to index.
 *
 * Junk keywords (long token salads, year stacks, repeated tokens) are
 * dropped client-side so they never even hit the API — that's how the
 * SeoPage collection grew to 457k mostly-rejected rows.
 */
import { sanitizeSeoKeyword } from './seoKeywordSanitizer';

export function autoCreateSeoPage(keyword: string) {
  if (typeof window === 'undefined') return;

  const verdict = sanitizeSeoKeyword(keyword);
  if (!verdict.ok || !verdict.cleaned) return;

  fetch(`/api/seo-pages?keyword=${encodeURIComponent(verdict.cleaned)}`)
    .catch(() => {}); // Silent — never show errors
}
