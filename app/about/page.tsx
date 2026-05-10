import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import {
  Sparkles, Target, Eye, Heart, Brain, Rocket, BarChart3, Zap, Mail,
  MessageCircle, Award, Users, Video, Globe, TrendingUp,
} from 'lucide-react';

const LAST_UPDATED = '2026-05-10';
const LAST_UPDATED_HUMAN = 'May 10, 2026';

export const metadata: Metadata = {
  title: 'About Vid YT — AI-Powered YouTube Growth Platform for Creators',
  description:
    'Discover the story behind Vid YT — an AI-powered platform helping 10,000+ YouTube creators predict viral content, optimize titles & thumbnails, schedule posts and grow faster. Built in India by Kvl Business Solutions.',
  keywords: [
    'about Vid YT',
    'YouTube AI tools',
    'creator growth platform',
    'YouTube analytics India',
    'AI viral prediction',
    'Kvl Business Solutions',
    'YouTube SEO platform',
    'video performance prediction',
  ],
  alternates: { canonical: 'https://www.vidyt.com/about' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://www.vidyt.com/about',
    siteName: 'Vid YT',
    title: 'About Vid YT — AI-Powered YouTube Growth Platform',
    description:
      'Meet the AI-powered platform that 10,000+ YouTube creators use to predict viral hits, optimise titles & thumbnails and grow faster.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Vid YT — YouTube Growth Platform',
    description: 'How Vid YT is helping 10,000+ creators turn data into viral hits.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: 'https://www.vidyt.com/about',
  name: 'About Vid YT',
  description:
    'About page describing the mission, vision, story and product suite of Vid YT — an AI-powered YouTube growth platform.',
  inLanguage: 'en',
  isPartOf: { '@type': 'WebSite', name: 'Vid YT', url: 'https://www.vidyt.com' },
  about: {
    '@type': 'Organization',
    name: 'Vid YT',
    url: 'https://www.vidyt.com',
    parentOrganization: {
      '@type': 'Organization',
      name: 'Kvl Business Solutions',
      address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    },
    foundingDate: '2024',
    description:
      'AI-powered YouTube growth, viral prediction, analytics, scheduling and SEO platform for creators and businesses.',
    email: 'support@vidyt.com',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.vidyt.com' },
      { '@type': 'ListItem', position: 2, name: 'About', item: 'https://www.vidyt.com/about' },
    ],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-[#FF0000]/30 selection:text-white overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNavbar />

      {/* HERO with animated colored blobs */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-red-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-[28rem] h-[28rem] bg-purple-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse [animation-delay:1s]" />
          <div className="absolute bottom-1/4 left-1/3 w-[28rem] h-[28rem] bg-blue-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse [animation-delay:2s]" />
          <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-emerald-400/25 rounded-full blur-3xl mix-blend-screen animate-pulse [animation-delay:0.5s]" />
        </div>

        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto text-xs text-white/50 mb-8">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">About</span>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-xs font-bold text-pink-200 uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Our Story
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
            We&apos;re building the AI co-pilot for{' '}
            <span className="bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              YouTube creators
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Vid YT helps <strong className="text-white">10,000+</strong> creators predict viral hits, optimise titles &amp; thumbnails, and grow faster — built in India by <strong className="text-white">Kvl Business Solutions</strong>.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-white/40 mt-6">
            <span>Last updated: <time dateTime={LAST_UPDATED}>{LAST_UPDATED_HUMAN}</time></span>
          </div>
        </div>
      </section>

      {/* STATS row — 4 colorful cards */}
      <section className="px-6 -mt-12 mb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-red-500/15 to-orange-500/10 border border-red-500/20">
            <Users className="w-8 h-8 mb-4 text-orange-300" />
            <div className="text-4xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">10K+</div>
            <div className="text-sm text-white/60 mt-2">Creators worldwide</div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border border-blue-500/20">
            <Video className="w-8 h-8 mb-4 text-cyan-300" />
            <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">50M+</div>
            <div className="text-sm text-white/60 mt-2">Videos analysed</div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20">
            <TrendingUp className="w-8 h-8 mb-4 text-teal-300" />
            <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">95%</div>
            <div className="text-sm text-white/60 mt-2">Prediction accuracy</div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-500/15 to-pink-500/10 border border-purple-500/20">
            <Globe className="w-8 h-8 mb-4 text-pink-300" />
            <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">24/7</div>
            <div className="text-sm text-white/60 mt-2">Uptime monitoring</div>
          </div>
        </div>
      </section>

      {/* PROBLEM + SOLUTION */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br from-red-500/15 via-orange-500/10 to-amber-500/5 border border-red-500/25">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl" />
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-300 to-orange-300 bg-clip-text text-transparent relative z-10">The Problem</h2>
            <p className="text-white/80 leading-relaxed mb-3 relative z-10">
              Growing on YouTube has become brutally hard. Creators pour weeks into a single video — only to see it flatline because the title wasn&apos;t compelling, the thumbnail didn&apos;t pop, or the topic peaked two weeks ago.
            </p>
            <p className="text-white/80 leading-relaxed relative z-10">
              The algorithm keeps shifting. Audiences scroll faster. Generic SEO advice no longer works. Creators are flying blind, optimising on gut feel, and burning out.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/5 border border-emerald-500/25">
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl" />
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent relative z-10">Our Solution</h2>
            <p className="text-white/80 leading-relaxed mb-3 relative z-10">
              Vid YT is an AI co-pilot that turns YouTube data into clear, actionable decisions <em>before</em> you press Publish.
            </p>
            <p className="text-white/80 leading-relaxed relative z-10">
              We analyse 50 million+ videos to predict your content&apos;s viral potential, score your title and thumbnail, surface trending hashtags, schedule the optimal publish window, and automate community replies — so you can focus on creating.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION / VISION / VALUES */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <h2 className="text-4xl font-bold text-center mb-3">What drives us</h2>
        <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
          Three principles shape every product decision we make at Vid YT.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-8 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-5 shadow-lg shadow-pink-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">Mission</h3>
            <p className="text-white/70 leading-relaxed">
              Make predictable YouTube growth available to every creator — not just channels with million-dollar budgets and full-time data teams.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-8 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">Vision</h3>
            <p className="text-white/70 leading-relaxed">
              Become the global AI growth ecosystem for content creators — adapting in real time as platforms, algorithms, and audiences evolve.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-8 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/30">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">Values</h3>
            <p className="text-white/70 leading-relaxed">
              Honest data over hype. Creator-first design. Transparent pricing. Privacy by default. Indian engineering, world-class craft.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT WE BUILD — six colorful feature cards */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <h2 className="text-4xl font-bold text-center mb-3">What we build</h2>
        <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
          A full creator stack powered by purpose-built ML models, not generic LLM wrappers.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="group relative overflow-hidden rounded-2xl bg-[#181818] border border-white/[0.08] p-6 hover:border-red-500/30 hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">AI Viral Score</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Predict the viral potential of any video idea before you record it. Trained on 50M+ real performance signals.
            </p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-[#181818] border border-white/[0.08] p-6 hover:border-blue-500/30 hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Scheduling</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Publish at the exact minute your audience is most active. Per-channel, per-niche, per-day insights.
            </p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-[#181818] border border-white/[0.08] p-6 hover:border-emerald-500/30 hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Channel Analytics</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Beyond YouTube Studio — retention curves, click-through forecasting, and audience overlap maps.
            </p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-[#181818] border border-white/[0.08] p-6 hover:border-amber-500/30 hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mb-4 shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">SEO Research</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Find low-competition keywords, rank-tracked daily, with search-volume estimates tuned for YouTube.
            </p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-[#181818] border border-white/[0.08] p-6 hover:border-pink-500/30 hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Bulk Outreach</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Run sponsorship outreach and creator collaborations at scale, with built-in deliverability hygiene.
            </p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-[#181818] border border-white/[0.08] p-6 hover:border-purple-500/30 hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Support AI</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Auto-reply to YouTube comments and customer messages with on-brand AI that knows your channel voice.
            </p>
          </div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="max-w-4xl mx-auto px-6 mb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/25 p-8 md:p-12">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl" />
          <h2 className="relative z-10 text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Our story
          </h2>
          <div className="relative z-10 space-y-4 text-white/80 leading-relaxed">
            <p>
              Vid YT started inside a small studio in India where a handful of creators kept asking the same question over coffee: <em className="text-white">&ldquo;Why did this video flop and that one explode?&rdquo;</em> The answer was always more complex than the dashboards we had access to. We realised the real problem wasn&apos;t a lack of data — it was the absence of a system that could turn data into <em>decisions</em> a creator could actually use the same morning they edit a video.
            </p>
            <p>
              We started by training viral-prediction models on millions of real YouTube videos across niches — gaming, finance, lifestyle, tech, education. We layered on title scoring, thumbnail analysis, smart scheduling and SEO research. We added scheduled posting and a customer-support AI to remove the operational drag that creators spend hours on every week.
            </p>
            <p>
              Today, Vid YT is used by independent creators, full-time YouTubers, agencies running 50+ channels, and brands building owned media. Every feature ships with a clear &ldquo;does this actually move views?&rdquo; experiment behind it. We&apos;re obsessed with shipping fast, listening to feedback faster, and never letting the product become bloated marketing fluff.
            </p>
          </div>
        </div>
      </section>

      {/* BUILT IN INDIA */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500/15 via-white/[0.03] to-emerald-500/15 border border-white/10 p-8 md:p-12 text-center">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl" />
          </div>
          <Award className="w-12 h-12 mx-auto mb-4 text-amber-300" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Proudly built in{' '}
            <span className="bg-gradient-to-r from-orange-400 via-white to-emerald-400 bg-clip-text text-transparent">
              India
            </span>
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto leading-relaxed">
            Vid YT is a product of <strong className="text-white">Kvl Business Solutions</strong> — engineered, designed, and supported by a team that believes Indian craft can compete with anything Silicon Valley ships. GST-compliant, DPDP-ready, and built for global creators from day one.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
          Ready to grow with{' '}
          <span className="bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            data, not guesswork?
          </span>
        </h2>
        <p className="text-white/60 max-w-2xl mx-auto mb-8">
          Join thousands of creators using Vid YT to ship videos that actually find an audience.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all"
          >
            Start free
          </Link>
          <Link
            href="/contact"
            className="px-8 py-3 rounded-full border border-white/20 text-white font-bold hover:bg-white/5 transition-colors"
          >
            Talk to us
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
