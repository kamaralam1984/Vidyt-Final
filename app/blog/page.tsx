'use client';

import Link from 'next/link';

const posts = [
  {
    slug: 'youtube-seo-checklist',
    title: 'Ultimate YouTube SEO Checklist for 2026',
    description:
      'A practical checklist for titles, descriptions, tags, thumbnails and watch time that any creator can follow.',
  },
  {
    slug: 'viral-shorts-formula',
    title: 'Viral Shorts Formula: Hook, Pace, Retain',
    description:
      'A framework for the first 3 seconds, story arcs and pattern interrupts that stop viewers from scrolling away.',
  },
  {
    slug: 'thumbnail-frameworks',
    title: 'High-CTR Thumbnail Frameworks for Creators',
    description:
      'Five thumbnail patterns top creators use to keep CTR consistently high — with smart use of colour, text and face framing.',
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          ViralBoost AI Blog
        </h1>
        <p className="text-lg text-[#AAAAAA] mb-10">
          Deep‑dive guides around YouTube SEO, thumbnails, titles and retention — so your videos grow on
          data‑backed systems, not just viral luck.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="bg-[#181818] border border-[#262626] rounded-xl p-6 hover:border-[#FF0000] transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">
                {post.title}
              </h2>
              <p className="text-sm text-[#CCCCCC] mb-4">
                {post.description}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-sm text-[#FF0000] hover:text-[#CC0000]"
              >
                Read guide
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

