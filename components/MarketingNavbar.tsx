'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Brain,
  Lightbulb,
  FileText,
  Type,
  ClipboardList,
  Scissors,
  Image as ImageIcon,
  Gauge,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';
import { useLocale, SUPPORTED_LOCALES } from '@/context/LocaleContext';
import { useTranslations } from '@/context/translations';

const FEATURES = [
  // Column 1
  {
    id: 'daily-ideas',
    col: 1 as const,
    title: 'Daily Ideas',
    desc: 'Wake up every day with fresh, niche‑specific video ideas. Powered by live trends and AI scoring so you know what to post next. Stop guessing topics and start uploading with confidence.',
    icon: Lightbulb,
    gradient: 'from-amber-400 to-orange-500',
    href: '/ai/script-generator?mode=ideas',
  },
  {
    id: 'ai-coach',
    col: 1 as const,
    title: 'AI Coach',
    desc: 'Ask anything about your channel and get clear, step‑by‑step guidance. Personalized advice on content, thumbnails, titles and retention. It’s like having a full‑time YouTube growth mentor on demand.',
    icon: Brain,
    gradient: 'from-sky-400 to-indigo-500',
    href: '/ai/script-generator?mode=coach',
  },
  {
    id: 'keyword-research',
    col: 1 as const,
    title: 'Keyword Research',
    desc: 'Discover high‑intent keywords your audience is already searching. See which ideas have the best viral potential before you hit record. Build titles and descriptions around real demand, not guesswork.',
    icon: ClipboardList,
    gradient: 'from-emerald-400 to-teal-500',
    href: '/dashboard/youtube-seo?tab=keywords',
  },
  // Column 2
  {
    id: 'script-writer',
    col: 2 as const,
    title: 'Script Writer',
    desc: 'Turn a rough topic into a polished, ready‑to‑record script. Includes hooks, sections, CTAs, titles and hashtags in one flow. Spend less time writing and more time filming.',
    icon: FileText,
    gradient: 'from-violet-400 to-fuchsia-500',
    href: '/ai/script-generator',
  },
  {
    id: 'title-generator',
    col: 2 as const,
    title: 'Title Generator',
    desc: 'Instantly turn boring titles into irresistible, clickable headlines. Multiple AI‑scored variations tuned for CTR and watch time. Give every upload a fair chance to perform.',
    icon: Type,
    gradient: 'from-rose-400 to-red-500',
    href: '/dashboard/youtube-seo?tab=titles',
  },
  {
    id: 'channel-audit',
    col: 2 as const,
    title: 'Channel Audit',
    desc: 'Get a deep, honest review of your entire channel in minutes. See what’s working, what’s broken, and what to fix first. Turn random uploads into a focused, data‑driven strategy.',
    icon: Gauge,
    gradient: 'from-cyan-400 to-blue-500',
    href: '/channel-audit',
  },
  // Column 3
  {
    id: 'ai-shorts',
    col: 3 as const,
    title: 'AI Shorts Clipping',
    desc: 'Automatically cut long videos into shorts that actually hook viewers. Finds the most engaging moments and suggests titles/hooks for each. Repurpose one video into a week of short‑form content.',
    icon: Scissors,
    gradient: 'from-emerald-400 to-lime-500',
    href: '/ai/shorts-creator',
  },
  {
    id: 'thumbnail-maker',
    col: 3 as const,
    title: 'AI Thumbnail Maker',
    desc: 'Design thumbnails that look “big creator” level without a designer. AI suggests text, layout and colors optimized for clicks. Fix low CTR and make every video stand out in the feed.',
    icon: ImageIcon,
    gradient: 'from-yellow-400 to-orange-500',
    href: '/dashboard/youtube-seo?tab=thumbnails',
  },
  {
    id: 'optimize',
    col: 3 as const,
    title: 'Optimize',
    desc: 'One simple score shows how “viral‑ready” your video really is. Detailed breakdown for title, description, keywords, thumbnail and timing. Get specific recommendations before you publish—not after.',
    icon: Sparkles,
    gradient: 'from-sky-400 to-purple-500',
    href: '/dashboard/youtube-seo',
  },
] as const;

type Feature = (typeof FEATURES)[number];

const MAIN_LINKS = [
  { labelKey: 'navbar.freeAiTools', href: '#tools' },
  { labelKey: 'navbar.coaching', href: '#coaching' },
  { labelKey: 'navbar.resources', href: '#resources' },
  { labelKey: 'navbar.extension', href: '#extension' },
  { labelKey: 'navbar.pricing', href: '#pricing' },
] as const;

export default function MarketingNavbar() {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { locale, setLocale } = useLocale();
  const { t } = useTranslations();
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);

  const openFeatures = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setFeaturesOpen(true);
  };

  const scheduleCloseFeatures = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    closeTimer.current = setTimeout(() => {
      setFeaturesOpen(false);
      closeTimer.current = null;
    }, 120); // thoda sa delay taaki cursor gap cross kar sake
  };

  useEffect(() => {
    const close = () => setFeaturesOpen(false);
    window.addEventListener('scroll', close);
    return () => window.removeEventListener('scroll', close);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050712]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo / brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10">
            <Image
              src="/logo.png"
              alt="ViralBoost AI logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white">
              ViralBoost AI
            </span>
            <span className="text-xs text-white/50">
              Modern AI tools for creators
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 lg:flex">
          {/* Features with mega dropdown trigger */}
          <button
            type="button"
            className="group flex items-center gap-1 text-sm font-medium text-white/80 transition hover:text-white"
            onMouseEnter={openFeatures}
          >
            <span>{t('navbar.features')}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                featuresOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {MAIN_LINKS.map((link) => (
            <Link
              key={link.labelKey}
              href={link.href}
              className="text-sm text-white/70 transition hover:text-white"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Locale selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLocaleMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              <span className="text-base leading-none">{locale.flag}</span>
              <span className="hidden md:inline">
                {locale.countryName}
              </span>
            </button>
            {localeMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-[#050712] shadow-xl shadow-black/60 z-50">
                <div className="px-3 py-2 border-b border-white/10 text-[11px] text-white/60">
                  Select country &amp; language
                </div>
                <div className="max-h-64 overflow-y-auto py-1 text-sm">
                  {SUPPORTED_LOCALES.map((opt) => (
                    <button
                      key={opt.countryCode}
                      type="button"
                      onClick={() => {
                        setLocale(opt);
                        setLocaleMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 hover:bg-white/10 ${
                        opt.countryCode === locale.countryCode ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{opt.flag}</span>
                        <span className="text-white text-xs md:text-sm">{opt.countryName}</span>
                      </div>
                      <div className="text-[10px] text-white/50 text-right">
                        {opt.currencySymbol} · {opt.phoneCode}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/login" className="text-sm text-white/70 transition hover:text-white">
            {t('navbar.signIn')}
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/40 hover:bg-red-700 hover:shadow-red-500/60 transition"
          >
            {t('navbar.getStarted')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-white lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Desktop mega dropdown (Features) */}
      <div
        className="relative hidden lg:block"
        onMouseEnter={openFeatures}
        onMouseLeave={scheduleCloseFeatures}
      >
        {featuresOpen && (
          <div className="mx-auto flex max-w-6xl justify-center">
            <div
              className="
                mt-2 w-[1100px] overflow-hidden rounded-3xl
                border border-white/12 bg-white/5
                bg-gradient-to-br from-white/10 via-white/0 to-purple-500/15
                shadow-2xl shadow-black/60 backdrop-blur-2xl
                animate-fade-slide
              "
            >
              <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="grid grid-cols-3 gap-4 p-6">
                  {[1, 2, 3].map((col) => (
                    <div key={col} className="space-y-3">
                      {FEATURES.filter((f) => f.col === col).map((feature) => (
                        <FeatureCard key={feature.id} feature={feature} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-xs font-medium text-sky-300 hover:text-sky-200">
                    View all Tools
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <span className="hidden sm:inline text-white/40">
                    Explore the full ViralBoost AI toolkit.
                  </span>
                </div>
                <span className="text-[11px] text-white/30">
                  Professional AI tools for content creators
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile dropdown panel */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#050712] px-4 pb-4 pt-2 lg:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between py-2 text-sm font-medium text-white"
            onClick={() => setFeaturesOpen((v) => !v)}
          >
            <span>{t('navbar.features')}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                featuresOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {featuresOpen && (
            <div className="mt-2 space-y-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-md shadow-black/40"
                >
                  <IconBadge feature={feature} />
                  <div>
                    <div className="text-sm font-medium text-white">{feature.title}</div>
                    <p className="text-xs text-white/60">{feature.desc}</p>
                  </div>
                </div>
              ))}
              <button className="mt-1 text-xs font-medium text-sky-300 hover:text-sky-200">
                View all Tools
              </button>
            </div>
          )}

          <div className="mt-3 space-y-1 text-sm text-white/70">
            {MAIN_LINKS.map((link) => (
              <Link key={link.labelKey} href={link.href} className="block py-1">
                {t(link.labelKey)}
              </Link>
            ))}
            <div className="mt-3 flex gap-2">
              <Link
                href="/login"
                className="flex-1 rounded-full border border-white/15 px-3 py-2 text-center text-xs text-white/80"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex-1 rounded-full bg-red-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-red-700"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function IconBadge({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${feature.gradient} opacity-60 blur-xl`}
      />
      <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-[#050712]">
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Link
      href={feature.href || '#'}
      className="
        group relative flex h-400px w-full items-start gap-3
        rounded-[102px] border border-white/10 bg-white/5 px-3 py-3 text-left
        shadow-[0_18px_45px_rgba(0,0,0,0.6)]
        transition duration-200
        hover:-translate-y-0.5 hover:scale-[1.01]
        hover:border-sky-400/50 hover:bg-white/10
      "
    >
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-[12px]
          bg-gradient-to-br ${feature.gradient}
          opacity-0 blur-2xl transition-opacity duration-200
          group-hover:opacity-40
        `}
      />
      <div className="relative flex items-start gap-3">
        <IconBadge feature={feature} />
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white">{feature.title}</div>
          <p className="text-[11px] leading-snug text-white/70 line-clamp-3">{feature.desc}</p>
        </div>
      </div>
    </Link>
  );
}

