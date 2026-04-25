/**
 * seedSeoPages — Server-side bulk SEO page creator.
 * Call fire-and-forget from any API route. Never blocks, never throws.
 *
 * Each keyword search auto-creates /k/[keyword] pages so Google can
 * index them and users searching those terms find VidYT.
 */

import connectDB from '@/lib/mongodb';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

function categorize(kw: string): string {
  const k = kw.toLowerCase();
  if (/game|gaming|pubg|fortnite|minecraft|gta|valorant/.test(k)) return 'Gaming';
  if (/music|song|beat|dj|rap|singer/.test(k)) return 'Music';
  if (/cook|food|recipe|baking/.test(k)) return 'Food';
  if (/travel|tour|destination|vlog/.test(k)) return 'Travel';
  if (/fit|gym|workout|yoga|weight/.test(k)) return 'Fitness';
  if (/beauty|makeup|skincare|fashion/.test(k)) return 'Beauty';
  if (/tech|ai|code|software|phone|gadget/.test(k)) return 'Technology';
  if (/crypto|bitcoin|stock|invest|finance|trading/.test(k)) return 'Finance';
  if (/education|study|learn|tutorial|course/.test(k)) return 'Education';
  if (/news|politic|election|government/.test(k)) return 'News';
  return 'Entertainment';
}

/** Returns true if keyword is clean and worth indexing */
function isValidKeyword(raw: string): boolean {
  const kw = raw.trim();
  // Too short or too long
  if (kw.length < 3 || kw.length > 60) return false;
  // Too many words (> 7 = usually garbage variant)
  const words = kw.split(/\s+/);
  if (words.length > 7) return false;
  // Repeated words: any word appearing 2+ times = garbage
  const wordSet = new Set(words.map(w => w.toLowerCase()));
  if (wordSet.size < words.length) return false;
  // Slug would be empty or too short
  const slug = slugify(kw);
  if (!slug || slug.length < 3) return false;
  return true;
}

function buildPageDoc(keyword: string) {
  const kw = keyword.trim();
  if (!isValidKeyword(kw)) return null;
  const slug = slugify(kw);
  if (!slug) return null;

  const kwCap = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const year = new Date().getFullYear();
  const category = categorize(kw);
  const baseWord = kw.split(' ')[0] || kw;

  const hashtags = [
    `#${baseWord.replace(/\s+/g, '')}`,
    `#${kw.replace(/\s+/g, '')}`,
    '#viral', '#trending', '#youtube', '#shorts', '#fyp', '#viralvideo',
    `#${baseWord}tips`, `#best${baseWord}`, '#creator', '#content',
    `#${category.toLowerCase()}`, `#${baseWord}${year}`, '#subscribe',
  ];

  const relatedKeywords = [
    `${kw} tutorial`, `best ${kw}`, `${kw} tips`, `${kw} ${year}`,
    `how to ${kw}`, `${kw} for beginners`, `${kw} viral`, `${kw} trending`,
  ];

  return {
    slug,
    keyword: kw,
    title: `${kwCap} — Free AI SEO Tool & Viral Guide ${year}`,
    metaTitle: `${kwCap} | Best ${category} SEO Tool & Hashtag Generator | VidYT`,
    metaDescription: `Get the best ${kw} titles, descriptions, hashtags, and viral tips for YouTube, Instagram & TikTok. Free AI-powered ${kw} optimizer by VidYT.`,
    content: `## ${kwCap} — Complete SEO Guide ${year}\n\nCreate viral **${kw}** content with VidYT's AI platform. Generate optimized titles, descriptions, hashtags, and scripts for **${kw}**.\n\n### Why ${kwCap} is Trending\n${kwCap} is one of the most searched topics in the ${category} niche. Creators who optimize their ${kw} videos see 3-5x more views.\n\n### How to Rank #1 for "${kwCap}"\n1. Include "${kw}" in first 60 characters of title\n2. Write 200+ word description mentioning "${kw}" 3-4 times\n3. Use 15-20 related hashtags\n4. Bold thumbnail with high contrast\n5. Hook viewers in first 3 seconds\n\n### Best ${kwCap} Video Ideas\nGenerate unlimited ${kw} video ideas and scripts using VidYT's AI Studio.\n\n**[Try ${kwCap} SEO Tool Free →](/dashboard/youtube-seo)**`,
    hashtags,
    relatedKeywords,
    viralScore: 60 + (kw.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 35),
    category,
    source: 'user_search',
  };
}

/**
 * Fire-and-forget: seed SEO pages for all given keywords.
 * Skips existing ones (upsert with $setOnInsert).
 * Max 50 keywords per call to avoid overload.
 */
export function seedSeoPages(keywords: string[]): void {
  const unique = [...new Set(keywords.map(k => k.trim().toLowerCase()).filter(k => k.length >= 2))].slice(0, 50);
  if (unique.length === 0) return;

  // Completely non-blocking — run in next microtask
  Promise.resolve().then(async () => {
    try {
      await connectDB();
      const SeoPage = (await import('@/models/SeoPage')).default;

      const docs = unique.map(buildPageDoc).filter(Boolean);
      if (docs.length === 0) return;

      // bulkWrite with upsert — only inserts if slug doesn't exist, never overwrites
      const ops = docs.map(doc => ({
        updateOne: {
          filter: { slug: doc!.slug },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }));

      await SeoPage.bulkWrite(ops as any, { ordered: false });
    } catch {
      // Silent — never affect the user-facing response
    }
  });
}
