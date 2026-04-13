/**
 * Auto-create SEO page in background when user searches any keyword.
 * Fire-and-forget — never blocks UI or throws errors.
 * Creates a page at /k/[keyword] for Google to index.
 */
export function autoCreateSeoPage(keyword: string) {
  if (!keyword?.trim() || keyword.trim().length < 3) return;
  if (typeof window === 'undefined') return;

  // Fire and forget — don't await, don't block
  fetch(`/api/seo-pages?keyword=${encodeURIComponent(keyword.trim())}`)
    .catch(() => {}); // Silent — never show errors
}
