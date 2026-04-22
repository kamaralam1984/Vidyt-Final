import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import { buildSeoContent, categorize } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

async function getOrCreatePage(keyword: string): Promise<any> {
  await connectDB();
  const slug = slugify(keyword);
  if (!slug || slug.length < 3) return null;

  let page: any = await SeoPage.findOne({ slug }).lean();

  if (!page) {
    const kw = keyword.replace(/-/g, ' ').trim();
    const built = buildSeoContent(kw, { isTrending: false });
    const qualityScore = computeQualityScore({
      wordCount: built.wordCount,
      viralScore: 70,
      trendingRank: 0,
      views: 0,
      hashtagCount: built.hashtags.length,
      faqCount: built.faqs.length,
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

  await SeoPage.updateOne({ slug }, { $inc: { views: 1 } });
  return page;
}

export async function generateMetadata({ params }: { params: { keyword: string } }) {
  const page = await getOrCreatePage(params.keyword);
  if (!page) return { title: 'Not Found' };
  const canonical = `${BASE_URL}/k/${page.slug}`;
  // Only indexable once promoted by the daily quality cron.
  const indexable = !!page.isIndexable;
  return {
    title: page.metaTitle,
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

  const kw = page.keyword || '';
  const kwCap = kw.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const canonical = `${BASE_URL}/k/${page.slug}`;
  const faqs = extractFaqs(page.content || '');

  // Related pages — same category, most-viewed
  let relatedPages: any[] = [];
  try {
    relatedPages = await SeoPage.find({
      category: page.category,
      slug: { $ne: page.slug },
      isIndexable: true,
    })
      .sort({ qualityScore: -1, views: -1 })
      .limit(6)
      .select('slug keyword views qualityScore')
      .lean();
  } catch {}

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
    <div className="min-h-screen bg-[#050712] text-white/80 font-sans">
      <MarketingNavbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-white/40 mb-6 flex gap-2 items-center">
          <Link href="/" className="hover:text-white/70">Home</Link>
          <span>›</span>
          <Link href="/trending" className="hover:text-white/70">Trending</Link>
          <span>›</span>
          <span className="text-white/60">{kwCap}</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-10">
          <div className="inline-flex gap-2 mb-4">
            <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-full border border-red-500/20">
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
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
            {page.title}
          </h1>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            {page.metaDescription}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            { label: 'Viral Score', value: `${page.viralScore}%` },
            { label: 'Category', value: page.category },
            { label: 'Hashtags', value: page.hashtags?.length || 0 },
            { label: 'Word Guide', value: `${page.wordCount || 1200}+` },
          ].map((s, i) => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <article
          className="prose prose-invert prose-lg max-w-none mb-12
            [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-black [&_h2]:text-white [&_h2]:mt-12 [&_h2]:mb-4
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white/90 [&_h3]:mt-8 [&_h3]:mb-3
            [&_p]:text-white/70 [&_p]:leading-relaxed [&_p]:mb-4
            [&_strong]:text-white [&_strong]:font-semibold
            [&_ol]:text-white/70 [&_ol]:space-y-2 [&_ol]:my-4 [&_ol]:pl-6
            [&_li]:text-white/70
            [&_a]:text-red-400 [&_a]:no-underline hover:[&_a]:underline"
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

        {/* Pricing callout card */}
        <section className="mb-12 p-8 bg-gradient-to-br from-red-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl border border-white/10">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 text-center">
            Pricing — Start Free, Scale When Ready
          </h2>
          <p className="text-center text-white/60 mb-8">
            No credit card on free · cancel any time on paid plans
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Free', price: '$0', per: 'forever', features: ['5 video analyses/mo', '50 AI titles', '10 thumbnails', `Access to ${kwCap} guide`], cta: 'Start Free', href: '/signup', highlight: false },
              { name: 'Pro', price: '$9', per: '/month', features: ['Unlimited titles & thumbnails', 'Keyword intelligence', 'Best posting time', 'AI script generator', '9-provider AI failover'], cta: 'Go Pro', href: '/pricing', highlight: true },
              { name: 'Business', price: '$29', per: '/month', features: ['Everything in Pro', 'Up to 5 channels', 'Auto-upload + calendar', 'Team seats (3)', 'API access'], cta: 'Upgrade', href: '/pricing', highlight: false },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl border ${
                  plan.highlight
                    ? 'bg-white/10 border-red-500/40 shadow-lg shadow-red-500/10'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded mb-2">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-3xl font-black text-white mt-2">
                  {plan.price}
                  <span className="text-sm font-normal text-white/50">{plan.per}</span>
                </p>
                <ul className="mt-4 space-y-1.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="text-sm text-white/70 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-6 block text-center py-2.5 rounded-lg font-bold transition ${
                    plan.highlight
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
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
        <section className="text-center p-8 md:p-12 bg-gradient-to-r from-red-500/10 to-purple-500/10 border border-red-500/20 rounded-2xl">
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
      </main>

      <MarketingFooter />
    </div>
  );
}
