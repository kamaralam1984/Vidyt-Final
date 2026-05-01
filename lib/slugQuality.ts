/**
 * Slug quality scorer — detects garbage auto-generated slugs that signal
 * "doorway page" patterns to Google.
 *
 * Why: a slug like
 *   /k/best-best-best-how-to-roblox-optimization-tutorial-tutorial-tutorial-tutorial-for-begi
 * is a textbook spam signal. Google's spam classifier flags repetitive
 * tokens, year-stacking, excessive length, and stop-word stacking.
 *
 * Returns 0–100 (higher = better) and a flags[] explaining penalties so
 * the admin UI can show *why* a slug is bad.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'or', 'the', 'is', 'in', 'on', 'of', 'for', 'to', 'with',
  'how', 'what', 'why', 'best', 'top', 'free', 'new',
]);

const POWER_WORD_DUPES = ['best', 'top', 'ultimate', 'free', 'new', 'pro', 'easy', 'tutorial', 'guide', 'tips', 'how', 'what'];

export interface SlugScore {
  score: number;       // 0–100
  flags: string[];     // human-readable issues
  isGarbage: boolean;  // score < 40 → recommend isIndexable:false
}

export function scoreSlug(slug: string): SlugScore {
  const flags: string[] = [];
  let score = 100;

  if (!slug || typeof slug !== 'string') {
    return { score: 0, flags: ['empty'], isGarbage: true };
  }

  const tokens = slug.split('-').filter(Boolean);
  const len = slug.length;

  // 1) Length penalty — slugs over 80 chars are almost always auto-generated junk
  if (len > 100) { score -= 35; flags.push(`too-long-${len}c`); }
  else if (len > 80) { score -= 20; flags.push(`long-${len}c`); }
  else if (len > 60) { score -= 8; flags.push(`borderline-${len}c`); }

  // 2) Token count penalty — natural keywords are 2–6 words
  if (tokens.length > 12) { score -= 20; flags.push(`${tokens.length}-tokens`); }
  else if (tokens.length > 8) { score -= 8; flags.push(`${tokens.length}-tokens`); }

  // 3) Repeated tokens — "best-best-best" pattern
  const tokCount: Record<string, number> = {};
  for (const t of tokens) tokCount[t] = (tokCount[t] || 0) + 1;
  const dupes = Object.entries(tokCount).filter(([, n]) => n > 1);
  if (dupes.length > 0) {
    const heaviestDupe = dupes.sort((a, b) => b[1] - a[1])[0];
    if (heaviestDupe[1] >= 4) { score -= 40; flags.push(`token-${heaviestDupe[0]}-x${heaviestDupe[1]}`); }
    else if (heaviestDupe[1] === 3) { score -= 25; flags.push(`token-${heaviestDupe[0]}-x3`); }
    else if (heaviestDupe[1] === 2) { score -= 10; flags.push(`token-${heaviestDupe[0]}-x2`); }
  }

  // 4) Adjacent identical tokens — "tutorial-tutorial" is worse than non-adjacent dupes
  let adjacentHits = 0;
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i] === tokens[i - 1]) adjacentHits++;
  }
  if (adjacentHits > 0) {
    const penalty = Math.min(35, 18 + (adjacentHits - 1) * 8);
    score -= penalty;
    flags.push(`adjacent-x${adjacentHits}`);
  }

  // 5) Year stacking — "2025-2026" or "2026-2026" (strong spam signal)
  const years = tokens.filter(t => /^20\d{2}$/.test(t));
  if (years.length >= 2) {
    score -= years.length === 2 ? 22 : 30;
    flags.push(`year-stack-${years.join(',')}`);
  }

  // 6) Stop-word stacking — too many "how", "what", "the", etc.
  const stopHits = tokens.filter(t => STOP_WORDS.has(t)).length;
  if (stopHits > 4) { score -= 10; flags.push(`stopwords-${stopHits}`); }

  // 7) Power-word duplication — "best best ultimate free top" pattern
  const powerHits = tokens.filter(t => POWER_WORD_DUPES.includes(t)).length;
  if (powerHits >= 4) { score -= 25; flags.push(`power-stuff-${powerHits}`); }
  else if (powerHits >= 3) { score -= 12; flags.push(`power-stuff-${powerHits}`); }

  // 8) Single-character or numeric-only tokens (junk fragments). Scales with
  //    count so heavily-fragmented slugs like "a-b-c-1-2-3-x" get punished.
  const junkFragments = tokens.filter(t => t.length === 1 || /^\d+$/.test(t)).length;
  if (junkFragments > 2) {
    const penalty = Math.min(55, 8 + (junkFragments - 2) * 8);
    score -= penalty;
    flags.push(`junk-frags-${junkFragments}`);
  }

  // 9) Truncated end (slug ends mid-word, common for length-capped slugs)
  // Heuristic: last token is short (< 4 chars), not a known short word, and not preceded by a separator hint.
  const lastTok = tokens[tokens.length - 1] || '';
  const KNOWN_SHORT = new Set(['ai', 'ml', 'us', 'uk', 'eu', 'gb', 'mb', 'kb', 'tv', 'pc', 'pr', 'qa', 'js', 'go']);
  if (lastTok.length > 0 && lastTok.length < 4 && !KNOWN_SHORT.has(lastTok)) {
    score -= 8;
    flags.push(`truncated-${lastTok}`);
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    flags,
    // Threshold 50: empirically separates clearly-spammy slugs (year-stacks,
    // junk-fragment chains, multi-adjacent dupes) from borderline-but-OK
    // slugs. Anything genuinely well-formed scores 85+ in tests.
    isGarbage: score < 50,
  };
}

/**
 * Quick boolean for hot paths — true if the slug is so bad we should
 * never index it regardless of content quality.
 */
export function isGarbageSlug(slug: string): boolean {
  return scoreSlug(slug).isGarbage;
}
