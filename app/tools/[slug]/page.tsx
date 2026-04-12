import React from 'react';
import { notFound } from 'next/navigation';
import { seoToolsList, SEOTool } from '@/data/seoToolsList';
import InteractiveToolClient from './InteractiveToolClient';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';

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
    alternates: { canonical: `https://vidyt.com/tools/${tool.slug}` }
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
          "text": "Yes, our starter version is completely free! Upgrade for deeper keyword volume metrics."
        }
      },
      {
        "@type": "Question",
        "name": `Does optimizing ${tool.toolType}s help YouTube Studio indexing?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes. Optimizing ${tool.toolType}s naturally improves CTR and allows the algorithm to map your video against big competitors in the ${tool.category} space.`
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050712] text-white/80 font-sans selection:bg-red-500/30">
      <MarketingNavbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="mx-auto max-w-6xl px-4 py-24 md:py-32">
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
            TRUSTED BY 10,000+ TOP CREATORS 🔥
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
        <article className="prose prose-invert prose-lg mx-auto max-w-4xl mt-24 mb-24">
          <h2 className="text-3xl text-white">Dominate the Algorithm with {tool.primaryKeyword}</h2>
          <p>
            Welcome to the ultimate solution for <strong>{tool.primaryKeyword}</strong>. If you are uploading videos in the highly contested <em>{tool.category}</em> category, missing out on proper {tool.toolType} optimization implies you are leaving views on the table.
          </p>

          <h2 className="text-2xl text-white mt-12">Core Engine Features</h2>
          <ul className="text-white/70">
            <li><strong>AI-Powered Logic:</strong> Generates phrases backed by viral trends.</li>
            <li><strong>SEO Optimized:</strong> Includes LSI keywords natively.</li>
            <li><strong>High CTR Focus:</strong> Ignites curiosity and compels the click safely.</li>
          </ul>

          <h2 className="text-2xl text-white mt-12">Use Cases: Built For Success</h2>
          <ul className="text-white/70">
            <li>Gaming Creators & Streamers trying to repurpose VODs.</li>
            <li>Professional Marketers needing fast A/B split testing.</li>
            <li>New YouTubers aiming to cross the 1,000 subscriber threshold.</li>
          </ul>
        </article>

        <section className="bg-gradient-to-br from-[#1A0B1A] to-[#2D0F0F] border border-red-500/20 rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden group mb-12">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Start generating views now 🚀</h2>
            <Link href="/dashboard" className="inline-flex items-center justify-center bg-white text-black text-lg font-bold px-10 py-5 rounded-full hover:bg-white/90 hover:scale-105 transition-all">
              Launch Master Dashboard
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
