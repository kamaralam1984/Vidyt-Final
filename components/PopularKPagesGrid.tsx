import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { unstable_cache } from 'next/cache';

/**
 * Server-rendered grid of the highest-quality indexable /k/ pages.
 *
 * Why on the homepage: passes PageRank from the highest-authority page
 * (the homepage) to deep keyword pages, helping Google discover and rank
 * them faster. The grid is grouped by category so it reads as a natural
 * "Browse Topics" section, not a doorway link farm.
 *
 * Cached 1h server-side so we don't hit MongoDB on every homepage request.
 */

interface KPage {
  slug: string;
  keyword: string;
  category: string;
  qualityScore: number;
}

const getTopKPages = unstable_cache(
  async (): Promise<KPage[]> => {
    try {
      await connectDB();
      const pages = await SeoPage.find({ isIndexable: true })
        .select('slug keyword category qualityScore')
        .sort({ qualityScore: -1, views: -1 })
        .limit(60)
        .lean();
      return (pages as any[]).map(p => ({
        slug: p.slug,
        keyword: p.keyword || p.slug.replace(/-/g, ' '),
        category: p.category || 'Trending',
        qualityScore: p.qualityScore || 0,
      }));
    } catch {
      return [];
    }
  },
  ['homepage-popular-k-pages'],
  { revalidate: 3600, tags: ['k-pages'] },
);

function capitalize(s: string): string {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function PopularKPagesGrid() {
  const pages = await getTopKPages();
  if (pages.length === 0) return null;

  // Group by category, keep top 6 per category
  const byCategory: Record<string, KPage[]> = {};
  for (const p of pages) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    if (byCategory[p.category].length < 6) byCategory[p.category].push(p);
  }
  const categories = Object.entries(byCategory)
    .filter(([, v]) => v.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  return (
    <section
      id="browse-topics"
      className="py-20 px-6 bg-[#0F0F0F] border-t border-[#212121]"
      aria-labelledby="browse-topics-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 id="browse-topics-heading" className="text-3xl md:text-4xl font-black text-white mb-3">
            Browse Trending Creator Topics
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Real-time SEO guides for the keywords creators are ranking for right now —
            titles, hashtags, viral playbooks, all free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          {categories.map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">
                {cat}
              </h3>
              <ul className="space-y-1.5">
                {items.map(p => (
                  <li key={p.slug}>
                    <Link
                      href={`/k/${p.slug}`}
                      className="text-white/70 hover:text-white text-sm flex items-center gap-2 group"
                    >
                      <span className="text-white/30 group-hover:text-red-400 transition">›</span>
                      <span>{capitalize(p.keyword)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/trending"
            className="inline-block px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition"
          >
            See all trending keywords →
          </Link>
        </div>
      </div>
    </section>
  );
}
