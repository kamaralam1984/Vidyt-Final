import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Lightbulb,
  Brain,
  Search,
  FileText,
  Type,
  Scissors,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Lock,
  Zap,
  Star,
} from 'lucide-react';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import UpgradePageCta from '@/components/UpgradePageCta';
import { TOOL_MARKETING, TOOL_MARKETING_SLUGS } from '@/data/toolMarketing';

const ICONS = {
  Lightbulb,
  Brain,
  Search,
  FileText,
  Type,
  Scissors,
  Image: ImageIcon,
  Sparkles,
} as const;

const SITE = 'https://www.vidyt.com';

export function generateStaticParams() {
  return TOOL_MARKETING_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const tool = TOOL_MARKETING[slug];
  if (!tool) return { title: 'Upgrade — VidYT' };

  const url = `${SITE}/upgrade/${tool.slug}`;
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      url,
      siteName: 'VidYT',
      type: 'website',
      images: [
        {
          url: `${SITE}/og-default.png`,
          width: 1200,
          height: 630,
          alt: tool.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.metaTitle,
      description: tool.metaDescription,
    },
  };
}

export default async function UpgradePage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const tool = TOOL_MARKETING[slug];
  if (!tool) notFound();

  const Icon = ICONS[tool.iconName];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `VidYT — ${tool.title}`,
    description: tool.metaDescription,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '10248',
    },
    creator: { '@type': 'Organization', name: 'VidYT', url: SITE },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <MarketingNavbar />

      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4 sm:px-6">
        <div
          className={`absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br ${tool.gradient} opacity-20 blur-[120px] pointer-events-none`}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-6">
            <Lock className="h-3.5 w-3.5" /> PRO Feature
          </div>

          <div
            className={`inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${tool.gradient} shadow-2xl mb-6`}
          >
            <Icon className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-[1.1]">
            {tool.hero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-8">
            {tool.hero.sub}
          </p>

          <UpgradePageCta
            toolTitle={tool.title}
            toolHref={tool.toolHref}
            featureFlag={tool.featureFlag}
            gradient={tool.gradient}
            variant="hero"
          />

          <p className="mt-5 text-xs text-white/40">
            ✅ Cancel anytime · ✅ Used by 10,000+ creators · ✅ No hidden fees
          </p>
        </div>
      </section>

      {/* INTRO / WHY */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">
            Why creators are switching to {tool.title}
          </h2>
          <div className="space-y-5 text-white/70 leading-relaxed text-base sm:text-lg">
            {tool.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="px-4 sm:px-6 pb-20 bg-[#181818]/40">
        <div className="mx-auto max-w-6xl py-12">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
            What you get with{' '}
            <span
              className={`bg-gradient-to-r ${tool.gradient} bg-clip-text text-transparent`}
            >
              {tool.title}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tool.benefits.map((b, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 hover:bg-white/[0.06] transition"
              >
                <div className="text-3xl mb-3">{b.emoji}</div>
                <h3 className="text-base font-bold text-white mb-1.5">{b.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3">
            How {tool.title} works
          </h2>
          <p className="text-center text-white/50 mb-12">From input to result in minutes.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tool.howItWorks.map((s, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div
                  className={`absolute -top-4 left-6 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${tool.gradient} text-white text-sm font-black shadow-lg`}
                >
                  {i + 1}
                </div>
                <h3 className="mt-3 text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="px-4 sm:px-6 py-20 bg-[#181818]/40">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
            Who it&apos;s built for
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tool.useCases.map((u, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div
                    className={`h-10 w-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center`}
                  >
                    <Star className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{u.who}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{u.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRO FEATURES CHECKLIST */}
      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3">
            Everything unlocked on Pro
          </h2>
          <p className="text-center text-white/50 mb-10">
            Free plan limits gone. Full access from minute one.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <ul className="space-y-3">
              {tool.proFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex justify-center">
            <UpgradePageCta
              toolTitle={tool.title}
              toolHref={tool.toolHref}
              featureFlag={tool.featureFlag}
              gradient={tool.gradient}
              variant="inline"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="px-4 sm:px-6 py-16 bg-[#181818]/40">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-lg sm:text-xl text-white leading-relaxed mb-5">
              &ldquo;{tool.testimonial.quote}&rdquo;
            </blockquote>
            <div className="text-sm text-white/60">
              <span className="font-bold text-white">{tool.testimonial.name}</span>
              <span className="mx-2 text-white/30">·</span>
              <span>{tool.testimonial.channel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {tool.faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/[0.04] transition">
                  <span className="text-base font-semibold text-white">{f.q}</span>
                  <span className="text-white/40 group-open:rotate-45 transition-transform text-2xl leading-none">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 text-sm sm:text-base text-white/65 leading-relaxed">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <div
            className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${tool.gradient} p-1`}
          >
            <div className="rounded-3xl bg-[#0F0F0F] p-10 sm:p-14 text-center">
              <Zap className="mx-auto h-10 w-10 text-amber-400 mb-5" />
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                {tool.ctaHeadline}
              </h2>
              <p className="text-base sm:text-lg text-white/60 mb-8 max-w-xl mx-auto">
                {tool.ctaSub}
              </p>
              <UpgradePageCta
                toolTitle={tool.title}
                toolHref={tool.toolHref}
                featureFlag={tool.featureFlag}
                gradient={tool.gradient}
                variant="final"
              />
              <p className="mt-5 text-xs text-white/40">
                Cancel anytime · No hidden fees
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
