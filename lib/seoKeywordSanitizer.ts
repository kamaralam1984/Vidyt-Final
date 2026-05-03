// Reject junk keywords BEFORE they ever get persisted as a /k/<slug> SEO
// page. Used by both the client-side autoCreateSeoPage helper and the
// server-side /api/seo-pages route so junk searches can never land in the
// SeoPage collection (which is what blew the rejected count to 457k).

const STOP_PATTERNS: RegExp[] = [
  /\b(20\d{2}).*\b\1\b/,            // year repeated: "2026 ... 2026"
  /\b(\w+)\b(?:\s+\1\b){1,}/i,      // any token repeated 2+ times: "tutorial tutorial"
  /best.*best.*best/i,              // "best ... best ... best" doorway pattern
  /tutorial.*tutorial.*tutorial/i,  // "tutorial ... tutorial ... tutorial"
  /tips.*tips.*tips/i,
  /ideas.*ideas.*ideas/i,
];

export interface SanitizeResult {
  ok: boolean;
  reason?: string;
  cleaned?: string;
}

/**
 * Decide whether a search keyword should be persisted as an SEO page.
 *  - 3 ≤ length ≤ 50 chars
 *  - 1 ≤ token-count ≤ 4
 *  - At most one occurrence of any year (no 2024-2026-2026 stacks)
 *  - No repeated tokens
 *  - No doorway patterns (best-best-best, tutorial-tutorial-tutorial)
 *  - Letters/digits/spaces only — no quote/punctuation soup
 */
export function sanitizeSeoKeyword(input: string): SanitizeResult {
  const raw = String(input || '').trim();
  if (!raw) return { ok: false, reason: 'empty' };

  // Strip everything except letters / digits / spaces / hyphens.
  const cleaned = raw.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  if (cleaned.length < 3) return { ok: false, reason: 'too short' };
  if (cleaned.length > 50) return { ok: false, reason: 'too long (max 50 chars)' };

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { ok: false, reason: 'no tokens' };
  if (tokens.length > 4) return { ok: false, reason: 'too many tokens (max 4)' };

  for (const re of STOP_PATTERNS) {
    if (re.test(cleaned)) return { ok: false, reason: 'junk pattern' };
  }

  // Reject if every token is shorter than 3 chars (e.g. "a b c d").
  if (tokens.every((t) => t.length < 3)) return { ok: false, reason: 'all tokens too short' };

  return { ok: true, cleaned };
}
