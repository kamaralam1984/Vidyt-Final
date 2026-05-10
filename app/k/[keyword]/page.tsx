import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import { buildSeoContent, categorize } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';
import { resolveTheme, themeFromSlug, type SeoTheme } from '@/lib/seoTheme';

// Matches crawlers, link-preview scrapers, and headless/CLI tooling so bot
// traffic doesn't inflate the views counter on admin SEO dashboards.
const BOT_UA_RE =
  /bot|crawler|spider|slurp|headless|prerender|lighthouse|pagespeed|gtmetrix|curl|wget|axios|node-fetch|python-requests|facebookexternalhit|whatsapp|twitterbot|discordbot|slackbot|linkedinbot|telegrambot|duckduckbot|googlebot|bingbot|yandexbot|baiduspider|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|sogou/i;

function isBotRequest(): boolean {
  try {
    const ua = headers().get('user-agent') || '';
    if (!ua) return true; // no UA → treat as bot
    return BOT_UA_RE.test(ua);
  } catch {
    return true;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

// React cache() dedupes the call within a single request — generateMetadata
// and the page renderer both look up the same slug, so without dedup we hit
// SeoPage.findOne twice per request.
const getOrCreatePage = cache(async (keyword: string): Promise<any> => {
  await connectDB();
  const slug = slugify(keyword);
  if (!slug || slug.length < 3) return null;

  let page: any = await SeoPage.findOne({ slug }).lean();

  if (!page) {
    // Don't let crawlers / link-preview scrapers seed the DB with a page for
    // every random slug they probe — that's how the admin sees hundreds of
    // auto-created pages a day. Real users will still trigger on-demand
    // creation; bots get notFound and the slug never enters the DB.
    if (isBotRequest()) return null;

    // Hard cap: max 100 SeoPage docs created per calendar day across ALL
    // sources (user_search + cron auto_daily + cron trending). Once today
    // hits 100, stop creating until tomorrow.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await SeoPage.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    if (todayCount >= 100) return null;

    const kw = keyword.replace(/-/g, ' ').trim();
    const built = buildSeoContent(kw, { isTrending: false });
    const qualityScore = computeQualityScore({
      wordCount: built.wordCount,
      viralScore: 70,
      trendingRank: 0,
      views: 0,
      hashtagCount: built.hashtags.length,
      faqCount: built.faqs.length,
      slug: keyword,
    });

    try {
      page = await SeoPage.findOneAndUpdate(
        { slug },
        {
          $setOnInsert: {
            slug,
            keyword: kw,
            title: built.title,
            metaTitle: built.metaTitle,
            metaDescription: built.metaDescription,
            content: built.content,
            hashtags: built.hashtags,
            relatedKeywords: built.relatedKeywords,
            viralScore: 70,
            category: built.category,
            source: 'user_search',
            wordCount: built.wordCount,
            qualityScore,
            trendingRank: 0,
            theme: themeFromSlug(slug),
            // Start un-indexable. The promote-seo-pages cron will flip this
            // to true for the top 100 qualityScore pages per day.
            isIndexable: false,
            publishedAt: null,
          },
        },
        { upsert: true, new: true, lean: true }
      );
    } catch {
      page = await SeoPage.findOne({ slug }).lean();
    }
  }

  return page;
});

// Related pages query is hot — cache it per (category, currentSlug) for 1h.
const getRelatedPages = unstable_cache(
  async (category: string, excludeSlug: string): Promise<any[]> => {
    try {
      await connectDB();
      const docs = await SeoPage.find({
        category,
        slug: { $ne: excludeSlug },
        isIndexable: true,
      })
        .sort({ qualityScore: -1, views: -1 })
        .limit(6)
        .select('slug keyword views qualityScore')
        .lean();
      return docs as any[];
    } catch {
      return [];
    }
  },
  ['k-related-pages-v1'],
  { revalidate: 3600, tags: ['k-pages'] },
);

export async function generateMetadata({ params }: { params: { keyword: string } }) {
  const page = await getOrCreatePage(params.keyword);
  if (!page) return { title: 'Not Found' };
  const canonical = `${BASE_URL}/k/${page.slug}`;
  // Only indexable once promoted by the daily quality cron.
  const indexable = !!page.isIndexable;
  return {
    // .absolute prevents the root layout's `%s | VidYT` template from
    // double-appending. Existing DB pages have "| VidYT" baked into
    // metaTitle (legacy format), so without absolute we get "X | VidYT | VidYT".
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: { canonical },
    robots: {
      index: indexable,
      follow: true,
      googleBot: {
        index: indexable,
        follow: true,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      type: 'article',
      siteName: 'VidYT',
      images: [`${BASE_URL}/og-image.png`],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: page.metaTitle,
      description: page.metaDescription,
      images: [`${BASE_URL}/og-image.png`],
    },
  };
}

// Simple inline markdown renderer for the stored `content` string.
// The content is author-controlled (buildSeoContent), so XSS surface is tiny —
// we still strip raw HTML just to be safe.
function renderMarkdown(md: string): string {
  const safe = md.replace(/<[^>]+>/g, '');
  return safe
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ol>${m}</ol>`)
    .split(/\n\n+/)
    .map(block => /^<(h2|h3|ol|ul|li)/.test(block.trim()) ? block : `<p>${block.trim()}</p>`)
    .join('\n');
}

// Visual style table — five themes, applied as additional classes on the
// page shell + hero + article. Same content, distinct DOM signatures.
const THEME_STYLES: Record<SeoTheme, {
  shell: string;
  main: string;
  heroAlign: string;
  heroBg: string;
  titleSize: string;
  badgeColor: string;
  articleAccent: string;
  ctaGradient: string;
}> = {
  modern: {
    shell: 'bg-gradient-to-b from-[#0d0f24] via-[#080a1a] to-[#0d0f24]',
    main: 'max-w-4xl mx-auto px-4 py-12 md:py-16',
    heroAlign: 'text-center mb-12',
    heroBg: 'rounded-3xl bg-gradient-to-br from-rose-600/30 via-purple-600/25 to-indigo-600/25 border border-rose-400/40 py-14 px-6 shadow-2xl shadow-rose-500/10',
    titleSize: 'text-4xl md:text-6xl',
    badgeColor: 'bg-rose-500/25 text-rose-100 border-rose-400/50',
    articleAccent: '[&_h2]:text-white [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-white/85 [&_p]:leading-relaxed [&_a]:text-rose-300 [&_a]:underline-offset-4 [&_strong]:text-rose-200 [&_li]:text-white/85 [&_li]:leading-relaxed',
    ctaGradient: 'from-rose-500/25 via-purple-500/20 to-indigo-500/20',
  },
  magazine: {
    shell: 'bg-gradient-to-b from-[#1c0e04] via-[#100805] to-[#1c0e04]',
    main: 'max-w-3xl mx-auto px-4 py-10 md:py-14',
    heroAlign: 'text-left mb-12 border-l-4 border-amber-400 pl-6',
    heroBg: '',
    titleSize: 'text-4xl md:text-5xl',
    badgeColor: 'bg-amber-500/25 text-amber-100 border-amber-400/50',
    articleAccent: '[&_h2]:text-amber-100 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-amber-500/30 [&_h2]:pb-2 [&_p]:text-amber-50/90 [&_p]:leading-relaxed [&_a]:text-amber-300 [&_strong]:text-amber-200 [&_li]:text-amber-50/90 [&_li]:leading-relaxed',
    ctaGradient: 'from-amber-500/25 via-orange-500/20 to-rose-500/20',
  },
  viral: {
    shell: 'bg-gradient-to-b from-[#2a0a3a] via-[#0f0420] to-[#2a0a3a]',
    main: 'max-w-4xl mx-auto px-4 py-12 md:py-16',
    heroAlign: 'text-center mb-12',
    heroBg: 'rounded-3xl bg-gradient-to-br from-pink-500/35 via-fuchsia-500/30 to-purple-500/30 border border-pink-400/50 py-14 px-6 shadow-2xl shadow-pink-500/15',
    titleSize: 'text-4xl md:text-6xl',
    badgeColor: 'bg-pink-500/30 text-pink-50 border-pink-400/60',
    articleAccent: '[&_h2]:text-pink-100 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-white/90 [&_p]:leading-relaxed [&_a]:text-pink-300 [&_strong]:text-pink-200 [&_li]:text-white/90 [&_li]:leading-relaxed',
    ctaGradient: 'from-pink-500/30 via-fuchsia-500/25 to-purple-500/25',
  },
  longform: {
    shell: 'bg-gradient-to-b from-[#04140d] via-[#08110d] to-[#04140d]',
    main: 'max-w-2xl mx-auto px-4 py-12 md:py-20',
    heroAlign: 'text-left mb-14',
    heroBg: '',
    titleSize: 'text-3xl md:text-5xl',
    badgeColor: 'bg-emerald-500/25 text-emerald-50 border-emerald-400/50',
    articleAccent: 'prose-xl [&_h2]:text-emerald-100 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-emerald-50/90 [&_p]:leading-loose [&_a]:text-emerald-300 [&_strong]:text-emerald-200 [&_li]:text-emerald-50/90 [&_li]:leading-loose',
    ctaGradient: 'from-emerald-500/25 via-teal-500/20 to-cyan-500/20',
  },
  cards: {
    shell: 'bg-gradient-to-b from-[#04081a] via-[#06091a] to-[#04081a]',
    main: 'max-w-6xl mx-auto px-4 py-10 md:py-14',
    heroAlign: 'text-center mb-12',
    heroBg: 'rounded-3xl bg-gradient-to-br from-cyan-500/30 via-sky-500/25 to-indigo-500/25 border border-cyan-400/50 py-12 px-6 shadow-2xl shadow-cyan-500/10',
    titleSize: 'text-4xl md:text-5xl',
    badgeColor: 'bg-cyan-500/30 text-cyan-50 border-cyan-400/60',
    articleAccent: '[&_h2]:text-cyan-100 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:bg-gradient-to-r [&_h2]:from-cyan-500/15 [&_h2]:to-transparent [&_h2]:rounded-xl [&_h2]:p-4 [&_h2]:border-l-4 [&_h2]:border-cyan-400 [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-white/90 [&_p]:leading-relaxed [&_a]:text-cyan-300 [&_strong]:text-cyan-200 [&_li]:text-white/90 [&_li]:leading-relaxed',
    ctaGradient: 'from-cyan-500/30 via-sky-500/25 to-indigo-500/25',
  },
};

// Parse FAQs out of content (### numbered blocks under "Frequently Asked Questions")
function extractFaqs(content: string): { q: string; a: string }[] {
  const faqBlock = content.split(/^## Frequently Asked Questions/m)[1] || '';
  if (!faqBlock) return [];
  const entries = faqBlock.split(/^### \d+\. /m).slice(1);
  return entries.slice(0, 8).map(e => {
    const [firstLine, ...rest] = e.split('\n');
    return { q: firstLine.trim(), a: rest.join(' ').replace(/^## .*$/gm, '').trim() };
  }).filter(f => f.q && f.a);
}

export default async function KeywordPage({ params }: { params: { keyword: string } }) {
  const page = await getOrCreatePage(params.keyword);
  if (!page) notFound();

  // Count real user views only — skip crawlers, link scrapers, and headless tools.
  if (!isBotRequest()) {
    SeoPage.updateOne({ slug: page.slug }, { $inc: { views: 1 } }).catch(() => {});
  }

  const kw = page.keyword || '';
  const kwCap = (kw || '').split(' ').map((w: string) => (w[0] || '').toUpperCase() + (w || '').slice(1)).join(' ');
  const canonical = `${BASE_URL}/k/${page.slug}`;
  const faqs = extractFaqs(page.content || '');

  // Resolve visual theme — stored value if valid, else hash of slug.
  const theme = resolveTheme(page);
  const tx = THEME_STYLES[theme];

  // Related pages — cached for 1h per (category, slug)
  const relatedPages = await getRelatedPages(page.category, page.slug);

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': page.metaTitle,
    'description': page.metaDescription,
    'url': canonical,
    'image': `${BASE_URL}/og-image.png`,
    'datePublished': page.publishedAt || page.createdAt || new Date().toISOString(),
    'dateModified': page.updatedAt || new Date().toISOString(),
    'author': { '@type': 'Organization', 'name': 'VidYT', 'url': BASE_URL },
    'publisher': {
      '@type': 'Organization',
      'name': 'VidYT',
      'url': BASE_URL,
      'logo': { '@type': 'ImageObject', 'url': `${BASE_URL}/Logo.webp` },
    },
    'mainEntityOfPage': { '@type': 'WebPage', '@id': canonical },
  };

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
    })),
  } : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE_URL },
      { '@type': 'ListItem', 'position': 2, 'name': 'Keywords', 'item': `${BASE_URL}/trending` },
      { '@type': 'ListItem', 'position': 3, 'name': kwCap, 'item': canonical },
    ],
  };

  return (
    <div className={`min-h-screen ${tx.shell} text-white/80 font-sans`} data-theme={theme}>
      <MarketingNavbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className={tx.main}>
       <div className="contents">
        {/* Breadcrumb */}
        <nav className="text-xs text-white/40 mb-6 flex gap-2 items-center">
          <Link href="/" className="hover:text-white/70">Home</Link>
          <span>›</span>
          <Link href="/trending" className="hover:text-white/70">Trending</Link>
          <span>›</span>
          <span className="text-white/60">{kwCap}</span>
        </nav>

        {/* Hero */}
        <header className={`${tx.heroAlign} ${tx.heroBg}`}>
          <div className={`inline-flex gap-2 mb-4 ${tx.heroAlign.includes('text-left') ? '' : 'justify-center'}`}>
            <span className={`px-3 py-1 ${tx.badgeColor} text-xs font-bold rounded-full border`}>
              {page.category}
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
              Viral Score: {page.viralScore}%
            </span>
            {page.trendingRank > 0 && page.trendingRank <= 50 && (
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                🔥 Trending #{page.trendingRank}
              </span>
            )}
          </div>
          <h1 className={`${tx.titleSize} font-black text-white mb-4 leading-tight tracking-tight`}>
            {page.title}
          </h1>
          <p className={`text-base md:text-lg text-white/60 ${tx.heroAlign.includes('text-left') ? '' : 'max-w-2xl mx-auto'}`}>
            {page.metaDescription}
          </p>
          <div className={`mt-8 flex flex-wrap gap-3 ${tx.heroAlign.includes('text-left') ? '' : 'justify-center'}`}>
            <Link
              href="/signup"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/20"
            >
              Start Free — No Credit Card
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition"
            >
              Go to VidYT Home
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/80 font-bold rounded-xl border border-white/10 transition"
            >
              View Pricing
            </Link>
          </div>
        </header>

        {/* Stats strip — `cards` theme uses larger tiles, `longform` hides them */}
        {theme !== 'longform' && (
        <div className={`grid ${theme === 'cards' ? 'grid-cols-2 md:grid-cols-4 gap-4' : 'grid-cols-2 md:grid-cols-4 gap-3'} mb-12`}>
          {[
            { label: 'Viral Score', value: `${page.viralScore}%` },
            { label: 'Category', value: page.category },
            { label: 'Hashtags', value: page.hashtags?.length || 0 },
            { label: 'Word Guide', value: `${page.wordCount || 1200}+` },
          ].map((s, i) => (
            <div
              key={i}
              className={`${theme === 'cards' ? 'p-5 bg-gradient-to-br from-white/10 to-white/5 border border-cyan-500/20' : 'p-4 bg-white/5 border border-white/10'} rounded-xl text-center`}
            >
              <p className="text-xs text-white/40 uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        )}

        {/* Content — theme-specific accent classes overlay the base prose */}
        <article
          className={`prose prose-invert prose-lg max-w-none mb-12
            [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-black [&_h2]:mt-12 [&_h2]:mb-4
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white/90 [&_h3]:mt-8 [&_h3]:mb-3
            [&_p]:text-white/70 [&_p]:leading-relaxed [&_p]:mb-4
            [&_strong]:text-white [&_strong]:font-semibold
            [&_ol]:text-white/70 [&_ol]:space-y-2 [&_ol]:my-4 [&_ol]:pl-6
            [&_li]:text-white/70
            [&_a]:no-underline hover:[&_a]:underline
            ${tx.articleAccent}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content || '') }}
        />

        {/* Hashtags */}
        {page.hashtags?.length > 0 && (
          <section className="mb-12 p-6 bg-white/5 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Best {kwCap} Hashtags (Copy & Paste)</h2>
            <div className="flex flex-wrap gap-2">
              {page.hashtags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                    i < 5
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : i < 10
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-white/5 text-white/60 border-white/10'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-4">
              Top 5 are highest-reach · mid tier is balanced · rest are niche long-tail.
            </p>
          </section>
        )}

        {/* Compact pricing CTA — replaces the old 3-card pricing block which
            rendered identically on every /k/ page and triggered Google's
            near-duplicate detection. The markdown content now handles plan
            details per-variant; this strip is just a brand anchor + link. */}
        <section className={`mb-12 p-6 bg-gradient-to-r ${tx.ctaGradient} rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4`}>
          <div className="text-center md:text-left">
            <p className="text-lg font-bold text-white">Free forever plan · no card required</p>
            <p className="text-sm text-white/60 mt-1">VidYT works on YouTube, Shorts, Reels, TikTok &amp; Facebook.</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/signup" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition shadow-lg shadow-red-500/20">
              Start Free
            </Link>
            <Link href="/pricing" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 font-medium rounded-lg border border-white/10 transition">
              Compare plans
            </Link>
          </div>
        </section>

        {/* Related Keywords */}
        {page.relatedKeywords?.length > 0 && (
          <section className="mb-12 p-6 bg-white/5 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Related Searches</h2>
            <div className="flex flex-wrap gap-2">
              {page.relatedKeywords.map((relKw: string, i: number) => (
                <Link
                  key={i}
                  href={`/k/${slugify(relKw)}`}
                  className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-sm hover:bg-purple-500/20 transition"
                >
                  {relKw}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Pages */}
        {relatedPages.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">
              More {page.category} SEO Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedPages.map((rp: any) => (
                <Link
                  key={rp.slug}
                  href={`/k/${rp.slug}`}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/30 hover:bg-white/10 transition group"
                >
                  <p className="text-sm font-bold text-white group-hover:text-red-400 transition">
                    {rp.keyword}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Quality {rp.qualityScore || 70}/100 · {rp.views || 0} views
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className={`text-center p-8 md:p-12 bg-gradient-to-r ${tx.ctaGradient} border border-white/15 rounded-2xl`}>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            Ready to Go Viral with {kwCap}?
          </h2>
          <p className="text-white/60 mb-6 max-w-xl mx-auto">
            Join 10,000+ creators using VidYT to turn trending topics into viral uploads.
            Free forever plan · no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/20"
            >
              Start Free Now
            </Link>
            <Link
              href="/"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition"
            >
              Explore VidYT
            </Link>
          </div>
        </section>
       </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
