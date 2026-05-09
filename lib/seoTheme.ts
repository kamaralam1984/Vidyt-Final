/**
 * Theme assignment + render-classes for /k/[slug] pages.
 *
 * Five visual layouts are cycled across new pages so the /k/ corpus doesn't
 * read as one templated page repeated. Each theme reuses the same stored
 * content but swaps hero/section styling so Google's near-duplicate detector
 * sees genuinely different DOM trees.
 */

export type SeoTheme = 'modern' | 'magazine' | 'viral' | 'longform' | 'cards';

export const SEO_THEME_LABELS: Record<SeoTheme, string> = {
  modern: 'Modern',
  magazine: 'Magazine',
  viral: 'Viral',
  longform: 'Longform',
  cards: 'Cards',
};

export const SEO_THEMES: SeoTheme[] = [
  'modern',
  'magazine',
  'viral',
  'longform',
  'cards',
];

/**
 * Pick a theme deterministically from a string (slug or keyword).
 * Used as a fallback when an existing page has no `theme` field.
 */
export function themeFromSlug(slug: string): SeoTheme {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return SEO_THEMES[h % SEO_THEMES.length];
}

/**
 * Cycle theme by creation index — used inside the daily cron so the day's
 * 100 pages split 20/20/20/20/20 across the five themes.
 */
export function themeByIndex(i: number): SeoTheme {
  return SEO_THEMES[((i % SEO_THEMES.length) + SEO_THEMES.length) % SEO_THEMES.length];
}

/**
 * Resolve a page's effective theme — stored value if valid, else hash fallback.
 */
export function resolveTheme(page: { theme?: string | null; slug?: string }): SeoTheme {
  if (page.theme && (SEO_THEMES as string[]).includes(page.theme)) {
    return page.theme as SeoTheme;
  }
  return themeFromSlug(page.slug || 'modern');
}
