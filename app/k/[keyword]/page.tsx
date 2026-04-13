import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

function categorize(kw: string): string {
  const k = kw.toLowerCase();
  if (/game|gaming|pubg|fortnite|minecraft/.test(k)) return 'Gaming';
  if (/music|song|beat|dj/.test(k)) return 'Music';
  if (/cook|food|recipe/.test(k)) return 'Food';
  if (/travel|tour|vlog/.test(k)) return 'Travel';
  if (/tech|ai|phone|software/.test(k)) return 'Technology';
  if (/crypto|bitcoin|stock|finance/.test(k)) return 'Finance';
  if (/youtube|instagram|tiktok|seo/.test(k)) return 'Social Media';
  return 'Entertainment';
}

async function getOrCreatePage(keyword: string): Promise<any> {
  await connectDB();
  const slug = slugify(keyword);
  let page: any = await SeoPage.findOne({ slug }).lean();

  if (!page) {
    const kw = keyword.replace(/-/g, ' ').trim();
    const kwCap = kw.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const year = new Date().getFullYear();
    const category = categorize(kw);
    const baseWord = kw.split(' ')[0];

    try {
      page = await SeoPage.findOneAndUpdate(
        { slug },
        {
          $setOnInsert: {
            slug,
            keyword: kw,
            title: `${kwCap} — Free AI SEO Tool & Viral Guide ${year}`,
            metaTitle: `${kwCap} | Best ${category} SEO Tool & Hashtag Generator | VidYT`,
            metaDescription: `Get the best ${kw} titles, descriptions, hashtags, and viral tips. Free AI-powered ${kw} optimizer by VidYT.`,
            content: `## ${kwCap} — Complete SEO Guide ${year}\n\nCreate viral **${kw}** content with VidYT's AI platform. Generate optimized titles, descriptions, hashtags, and scripts.\n\n### Best ${kwCap} Hashtags\nUse trending hashtags for maximum reach.\n\n### How to Rank #1\n1. Include "${kw}" in title\n2. Write 200+ word description\n3. Use 15-20 hashtags\n4. Bold thumbnail with face\n5. Strong first 3 seconds\n\n**[Try Free →](/dashboard/youtube-seo)**`,
            hashtags: [`#${baseWord.replace(/\s+/g, '')}`, `#${kw.replace(/\s+/g, '')}`, '#viral', '#trending', '#youtube', '#shorts', '#fyp', '#subscribe', `#${baseWord}tips`, `#best${baseWord}`, '#creator', '#viralvideo', `#${category.toLowerCase()}`, `#${baseWord}${year}`, '#content'],
            relatedKeywords: [`${kw} tutorial`, `best ${kw}`, `${kw} tips`, `${kw} ${year}`, `how to ${kw}`, `${kw} for beginners`],
            viralScore: 65 + Math.floor(Math.random() * 30),
            category,
            source: 'user_search',
          },
        },
        { upsert: true, new: true, lean: true }
      );
    } catch (e: any) {
      // If race condition, just fetch existing
      page = await SeoPage.findOne({ slug }).lean();
    }
  }

  // Increment views
  await SeoPage.updateOne({ slug }, { $inc: { views: 1 } });
  return page;
}

export async function generateMetadata({ params }: { params: { keyword: string } }) {
  const page = await getOrCreatePage(params.keyword);
  if (!page) return { title: 'Not Found' };
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `https://vidyt.com/k/${page.slug}` },
    openGraph: { title: page.metaTitle, description: page.metaDescription },
  };
}

export default async function KeywordPage({ params }: { params: { keyword: string } }) {
  const page = await getOrCreatePage(params.keyword);
  if (!page) notFound();

  const kwCap = (page.keyword || '').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Fetch related pages
  let relatedPages: any[] = [];
  try {
    await connectDB();
    relatedPages = await SeoPage.find({ category: page.category, slug: { $ne: page.slug } })
      .sort({ views: -1 })
      .limit(6)
      .select('slug keyword title views')
      .lean();
  } catch {}

  return (
    <div className="min-h-screen bg-[#050712] text-white/80 font-sans">
      <MarketingNavbar />

      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": page.metaTitle,
        "description": page.metaDescription,
        "url": `https://vidyt.com/k/${page.slug}`,
        "publisher": { "@type": "Organization", "name": "VidYT", "url": "https://vidyt.com" },
      }) }} />

      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-full mb-4 border border-red-500/20">
            {page.category} · Viral Score: {page.viralScore}%
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">{page.title}</h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">{page.metaDescription}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard/youtube-seo" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition">
              Try {kwCap} SEO Tool Free
            </Link>
            <Link href="/signup" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition">
              Sign Up Free
            </Link>
          </div>
        </div>

        {/* Content */}
        <article className="prose prose-invert prose-lg max-w-none mb-12 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white/90 [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-white/70 [&_strong]:text-white [&_li]:text-white/70 [&_a]:text-red-400 [&_a]:no-underline hover:[&_a]:underline">
          <div dangerouslySetInnerHTML={{ __html: (page.content || '').replace(/^## /gm, '<h2>').replace(/^### /gm, '<h3>').replace(/\n\n/g, '</p><p>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>') }} />
        </article>

        {/* Hashtags */}
        {page.hashtags?.length > 0 && (
          <div className="mb-12 p-6 bg-white/5 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Best {kwCap} Hashtags</h2>
            <div className="flex flex-wrap gap-2">
              {page.hashtags.map((tag: string, i: number) => (
                <span key={i} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${i < 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : i < 10 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-white/60 border-white/10'}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Keywords */}
        {page.relatedKeywords?.length > 0 && (
          <div className="mb-12 p-6 bg-white/5 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Related Searches</h2>
            <div className="flex flex-wrap gap-2">
              {page.relatedKeywords.map((kw: string, i: number) => (
                <Link key={i} href={`/k/${kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                  className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-sm hover:bg-purple-500/20 transition">
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Pages */}
        {relatedPages.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">More {page.category} Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedPages.map((rp: any) => (
                <Link key={rp.slug} href={`/k/${rp.slug}`}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/30 transition">
                  <p className="text-sm font-bold text-white">{rp.keyword}</p>
                  <p className="text-xs text-white/40 mt-1">{rp.views || 0} views</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center p-10 bg-gradient-to-r from-red-500/10 to-purple-500/10 border border-red-500/20 rounded-2xl">
          <h2 className="text-2xl font-black text-white mb-3">Ready to Go Viral with {kwCap}?</h2>
          <p className="text-white/60 mb-6">Join thousands of creators using VidYT to optimize their content and grow faster.</p>
          <Link href="/signup" className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition">
            Start Free — No Credit Card
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
