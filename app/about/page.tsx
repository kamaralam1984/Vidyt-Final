'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          About ViralBoost AI
        </h1>
        <p className="text-lg text-[#AAAAAA] mb-6">
          ViralBoost AI is a creator‑focused growth platform for YouTube and social media that brings
          AI‑powered ideas, scripts, thumbnails, titles, SEO and analytics into one place.
        </p>
        <p className="text-[#CCCCCC] mb-4">
          Our goal is simple: give you predictable growth. Instead of random uploads, you get a repeatable
          system where research, creation, optimization and analysis work together. That&apos;s why we bundled
          keyword research, viral prediction, posting‑time analysis, channel audits and AI coaching into a
          single suite.
        </p>
        <p className="text-[#CCCCCC] mb-8">
          Every feature in the platform is designed around real data from YouTube SEO, watch time and
          click‑through rate (CTR), so each new upload can perform better than the last one.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Why we built this
        </h2>
        <p className="text-[#CCCCCC] mb-8">
          Creators have ideas, but often lack the time and data tools. ViralBoost AI fills that gap by
          combining AI and analytics so you can focus on creating content while we handle the optimization.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/register"
            className="px-6 py-3 bg-[#FF0000] rounded-lg text-sm font-semibold hover:bg-[#CC0000] transition"
          >
            Start free with ViralBoost AI
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 bg-[#181818] rounded-lg text-sm font-semibold hover:bg-[#262626] transition"
          >
            Contact the team
          </Link>
        </div>
      </div>
    </main>
  );
}

