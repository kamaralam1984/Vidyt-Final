import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { seoToolsList, SEOTool } from '@/data/seoToolsList';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';

const InteractiveToolClient = dynamic(() => import('./InteractiveToolClient'), {
  loading: () => (
    <div className="animate-pulse bg-[#181818] rounded-2xl h-48 w-full" />
  ),
  ssr: false,
});

// 1. Generate Static Params (100+ built-in SEO programmatic pages)
export async function generateStaticParams() {
  return seoToolsList.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const tool = seoToolsList.find((t) => t.slug === params.slug);
  if (!tool) return { title: 'Tool Not Found' };
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    alternates: { canonical: `https://www.vidyt.com/tools/${tool.slug}` }
  };
}

export default function GenericSEOToolPage({ params }: { params: { slug: string } }) {
  const tool = seoToolsList.find((t) => t.slug === params.slug);

  if (!tool) {
    notFound(); 
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Is this ${tool.primaryKeyword} free to use?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, the core generator is completely free. VidYT's Pro plan unlocks unlimited generations, keyword volume data, and competitor benchmarking."
        }
      },
      {
        "@type": "Question",
        "name": `How does the ${tool.primaryKeyword} work?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Enter your topic or keyword and the AI analyzes trending ${tool.category} content, high-CTR patterns, and YouTube's ranking signals to generate optimized ${tool.toolType}s instantly.`
        }
      },
      {
        "@type": "Question",
        "name": `Does optimizing ${tool.toolType}s help YouTube rankings?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes. A well-optimized ${tool.toolType} is one of the top-3 ranking factors on YouTube. It signals relevance to the algorithm and improves click-through rate — both of which directly increase views and watch time.`
        }
      },
      {
        "@type": "Question",
        "name": `How many ${tool.toolType}s can I generate per day?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Free users can generate up to 10 ${tool.toolType}s per day. VidYT Pro users get unlimited generations plus access to the full suite of ${tool.category} SEO tools.`
        }
      },
      {
        "@type": "Question",
        "name": `Can I use this tool for YouTube Shorts?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Absolutely. The ${tool.primaryKeyword} generates ${tool.toolType}s optimized for both standard YouTube videos and Shorts. Shorts benefit especially from punchy, curiosity-gap ${tool.toolType}s under 60 characters.`
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.vidyt.com" },
      { "@type": "ListItem", "position": 2, "name": "SEO Tools", "item": "https://www.vidyt.com/tools" },
      { "@type": "ListItem", "position": 3, "name": tool.h1, "item": `https://www.vidyt.com/tools/${tool.slug}` },
    ]
  };

  // Related tools for internal linking (same category, exclude current)
  const relatedTools = seoToolsList
    .filter(t => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, 4);
  const otherTools = seoToolsList
    .filter(t => t.category !== tool.category)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#050712] text-white/80 font-sans selection:bg-red-500/30">
      <MarketingNavbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="mx-auto max-w-6xl px-4 py-24 md:py-32">

        {/* BREADCRUMB */}
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-white/40" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white/70 transition">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-white/70 transition">SEO Tools</Link>
          <span>/</span>
          <span className="text-white/70">{tool.h1}</span>
        </nav>

        {/* INTERNAL LINKING NAV */}
        <nav className="mb-12 flex flex-wrap justify-center gap-6 text-sm font-semibold text-white/50 uppercase tracking-widest" aria-label="Internal Navigation">
          <Link href="/tools" className="hover:text-red-500 transition">All SEO Tools</Link>
          <span className="text-white/20">•</span>
          <Link href="/pricing" className="hover:text-red-500 transition">Pricing Plans</Link>
          <span className="text-white/20">•</span>
          <Link href="/dashboard" className="hover:text-red-500 transition">Pro Dashboard</Link>
          <span className="text-white/20">•</span>
          <Link href="/blog" className="hover:text-red-500 transition">Growth Blog</Link>
        </nav>

        {/* HERO */}
        <header className="mb-16 text-center max-w-4xl mx-auto">
          <div className="inline-block bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-2 rounded-full text-xs font-bold tracking-widest mb-6">
            TRUSTED BY 10,000+ TOP CREATORS
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-white capitalize leading-[1.1]">
            {tool.h1}
          </h1>
          <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-light">
            {tool.metaDescription} Instant, safe, and wildly effective.
          </p>
        </header>

        {/* INTERACTIVE UI */}
        <InteractiveToolClient tool={tool} />

        {/* CONTENT */}
        <article className="prose prose-invert prose-lg mx-auto max-w-4xl mt-24 mb-16">
          <h2 className="text-3xl text-white">Dominate the {tool.category} Algorithm with {tool.primaryKeyword}</h2>
          <p>
            Welcome to the most powerful <strong>{tool.primaryKeyword}</strong> on the web. If you are uploading videos in the highly contested <em>{tool.category}</em> category, skipping {tool.toolType} optimization means leaving thousands of views on the table every month.
          </p>

          <h2 className="text-2xl text-white mt-12">Why {tool.primaryKeyword} Matters for YouTube Growth</h2>
          <p>
            YouTube processes over 500 hours of video per minute. The algorithm decides which videos surface in search and recommendations based heavily on your {tool.toolType} signals. Creators who use a dedicated <strong>{tool.primaryKeyword}</strong> consistently outrank competitors who write {tool.toolType}s manually.
          </p>

          <h2 className="text-2xl text-white mt-12">Core Features</h2>
          <ul className="text-white/70">
            <li><strong>AI-Powered Suggestions:</strong> Analyzes top-performing {tool.category} videos and extracts winning patterns.</li>
            <li><strong>SEO-Optimized Output:</strong> Includes LSI keywords and semantic phrases YouTube's algorithm rewards.</li>
            <li><strong>High-CTR Focus:</strong> Every suggestion is engineered to maximize click-through rate from search and recommendations.</li>
            <li><strong>Shorts-Ready:</strong> Generates {tool.toolType}s optimized for both standard videos and YouTube Shorts.</li>
          </ul>

          <h2 className="text-2xl text-white mt-12">Who Uses This Tool</h2>
          <ul className="text-white/70">
            <li><strong>{tool.category} Creators</strong> scaling from 0 to 100K subscribers.</li>
            <li><strong>Digital Marketers</strong> running A/B tests on {tool.toolType} variations for brand channels.</li>
            <li><strong>New YouTubers</strong> who want to compete with established channels from day one.</li>
            <li><strong>Agencies</strong> managing multiple client channels and needing fast, consistent output.</li>
          </ul>
        </article>

        {/* FAQ SECTION */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqSchema.mainEntity.map((faq, i) => (
              <details key={i} className="group bg-white/5 border border-white/10 rounded-xl px-6 py-4 cursor-pointer">
                <summary className="font-semibold text-white/90 list-none flex justify-between items-center gap-4">
                  <span>{faq.name}</span>
                  <span className="text-red-400 group-open:rotate-45 transition-transform text-xl shrink-0">+</span>
                </summary>
                <p className="mt-3 text-white/60 leading-relaxed text-sm">{faq.acceptedAnswer.text}</p>
              </details>
            ))}
          </div>
        </section>

        {/* RELATED TOOLS — same category */}
        {relatedTools.length > 0 && (
          <section className="max-w-4xl mx-auto mb-16">
            <h2 className="text-xl font-bold text-white mb-5">More {tool.category} SEO Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedTools.map(t => (
                <Link key={t.slug} href={`/tools/${t.slug}`}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition text-center">
                  {t.h1}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* OTHER TOOLS — cross-category internal linking */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-xl font-bold text-white mb-5">Popular SEO Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {otherTools.map(t => (
              <Link key={t.slug} href={`/tools/${t.slug}`}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition text-center">
                {t.h1}
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/tools" className="text-sm text-red-400 hover:text-red-300 transition">
              View all {seoToolsList.length} SEO tools →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-[#1A0B1A] to-[#2D0F0F] border border-red-500/20 rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden mb-12">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Start generating views now</h2>
            <p className="text-white/50 mb-8 text-lg">Join 10,000+ creators already growing with VidYT</p>
            <Link href="/dashboard" className="inline-flex items-center justify-center bg-white text-black text-lg font-bold px-10 py-5 rounded-full hover:bg-white/90 hover:scale-105 transition-all">
              Launch Free Dashboard
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
