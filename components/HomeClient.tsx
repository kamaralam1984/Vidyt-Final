'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import {
  Zap,
  TrendingUp,
  Brain,
  BarChart3,
  ArrowRight,
  Check,
  Play,
  Users,
  Shield,
  Clock,
  Sparkles,
  Globe,
  Crown,
  Loader2,
  X,
  Lock,
  LogIn,
  Lightbulb,
  FileText,
  Target,
} from 'lucide-react';
import Image from 'next/image';
import { type PlanFeatures } from '@/lib/planLimits';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from '@/context/translations';
import { useUser } from '@/hooks/useUser';
import dynamic from 'next/dynamic';
// LiveStatsBar is purely interactive (framer-motion count-up animations) and
// sits below the hero — defer its JS so the hero LCP/TBT on mobile improves.
const LiveStatsBar = dynamic(() => import('@/components/LiveStatsBar'), {
  loading: () => <div className="h-24 max-w-5xl mx-auto my-6 bg-[#181818] rounded-2xl animate-pulse" />,
  ssr: false,
});
const PricingSection = dynamic(() => import('@/components/PricingSection'), {
  loading: () => <div className="animate-pulse bg-[#181818] rounded-2xl h-64 w-full mx-auto max-w-5xl" />,
  ssr: false,
});
import { PricingPlan } from '@/components/PricingCard';
import { getPlanRoll } from '@/lib/planLimits';
import { PLAN_UI_METADATA } from '@/constants/pricing';

type HomeFeatureKey = keyof PlanFeatures;

/** Pricing cards: amounts and copy come from Manage Plans via /api/subscriptions/plans */
export type MarketingPlan = {
  planId: string;
  name: string;
  popular?: boolean;
  priceMonth: number;
  priceYear: number;
  description: string;
  features: string[];
  role?: string;
  limitsDisplay?: {
    videos?: string;
    analyses?: string;
    storage?: string;
    support?: string;
  };
  quotas?: {
    analysesLimit?: number;
    analysesPeriod?: 'day' | 'month';
    titleSuggestions?: number;
    hashtagCount?: number;
    competitorsTracked?: number;
    featureLimits?: Record<string, { value: number; period: 'day' | 'week' | 'month' | 'lifetime' }>;
  };
  discount?: {
    percentage: number;
    label: string;
  };
};

const HOME_FEATURES: {
  icon: any;
  titleKey: string;
  descKey: string;
  href: string;
  color: string;
  requiresFeature?: HomeFeatureKey;
}[] = [
    {
      icon: Zap,
      titleKey: 'home.feature.ai.title',
      descKey: 'home.feature.ai.desc',
      href: '/login',
      color: '#FF0000',
      requiresFeature: 'advancedAiViralPrediction',
    },
    {
      icon: TrendingUp,
      titleKey: 'home.feature.trends.title',
      descKey: 'home.feature.trends.desc',
      href: '/login',
      color: '#f59e0b',
      requiresFeature: 'realTimeTrendAnalysis',
    },
    {
      icon: BarChart3,
      titleKey: 'home.feature.analytics.title',
      descKey: 'home.feature.analytics.desc',
      href: '/login',
      color: '#8b5cf6',
      requiresFeature: 'advancedAnalyticsDashboard',
    },
    {
      icon: Clock,
      titleKey: 'home.feature.scheduling.title',
      descKey: 'home.feature.scheduling.desc',
      href: '/login',
      color: '#10b981',
      requiresFeature: 'bestPostingTimePredictions',
    },
    {
      icon: Users,
      titleKey: 'home.feature.competitors.title',
      descKey: 'home.feature.competitors.desc',
      href: '/login',
      color: '#06b6d4',
      requiresFeature: 'competitorAnalysis',
    },
    {
      icon: Shield,
      titleKey: 'home.feature.security.title',
      descKey: 'home.feature.security.desc',
      href: '#',
      color: '#64748b',
    },
  ];

interface HomeClientProps {
  initialPlans: MarketingPlan[];
  initialUserPlanId: string | null;
  features: any; // getPlanFeatures result
}

export default function HomeClient({ initialPlans, initialUserPlanId, features }: HomeClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  const { locale } = useLocale();
  const { t } = useTranslations();
  const { authenticated } = useUser();

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || waitlistLoading) return;

    setWaitlistLoading(true);
    setWaitlistStatus({ type: null, message: '' });

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail, source: 'browser_extension' }),
      });

      const data = await res.json();

      if (res.ok) {
        setWaitlistStatus({ type: 'success', message: data.message || 'Successfully joined the waitlist!' });
        setWaitlistEmail('');
      } else {
        setWaitlistStatus({ type: 'error', message: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (err) {
      setWaitlistStatus({ type: 'error', message: 'Failed to connect to the server.' });
    } finally {
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const planFeatures = features;
  const visibleFeatures = HOME_FEATURES.filter((feature) => {
    if (!planFeatures || !feature.requiresFeature) return true;
    return !!planFeatures[feature.requiresFeature];
  });

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <MarketingNavbar />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 md:pt-20 px-4 sm:px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF0000]/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-[#FF0000]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-[#FF0000]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
          {/* Hero: CSS animations only — no JS opacity:0 so LCP is not blocked */}
          <div className="animate-hero-fade">
            <div className="flex justify-center mb-0">
              {/* Container 80% height = crop bottom 20% of logo */}
              <div className="relative overflow-hidden flex justify-center items-start h-[12rem] sm:h-[16rem] md:h-[26.8rem] w-full max-w-[18rem] sm:max-w-[24rem] md:max-w-[30rem]">
                <Image
                  src="/Logo.webp"
                  alt="Vid YT"
                  width={512}
                  height={341}
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 640px) 200px, (max-width: 768px) 288px, 480px"
                  className="h-[15rem] sm:h-[20rem] md:h-[30rem] w-auto object-contain object-top"
                />
              </div>
            </div>
            {/* Platform label — helps Google OAuth reviewers instantly understand the app */}
            <div className="flex justify-center mb-5">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF0000]/10 border border-[#FF0000]/25 rounded-full text-[#FF0000] text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                AI Growth Engine for YouTube Creators
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-8xl font-bold text-white mt-0 mb-4 md:mb-6 leading-tight">
              The AI Co-Pilot That Helps You{' '}
              <span className="text-[#FF0000] bg-gradient-to-r from-[#FF0000] to-[#CC0000] bg-clip-text text-transparent">
                Get More Views
              </span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-[#AAAAAA] mb-3 max-w-3xl mx-auto px-2">
              {t('hero.subtitle')}
            </p>
            <p className="text-sm sm:text-base text-[#888888] mb-8 max-w-2xl mx-auto px-2">
              The only tool that tells you if your video will go viral — before you upload it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group px-8 py-4 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-all font-semibold text-lg flex items-center gap-2 shadow-lg shadow-[#FF0000]/30"
              >
                Analyze My Channel Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-[#212121] text-white rounded-lg hover:bg-[#333333] transition-all font-semibold text-lg flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Login
              </Link>
            </div>
            {/* Privacy policy notice — required for Google OAuth verification */}
            <p className="mt-6 text-xs text-[#666666]">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[#AAAAAA] hover:text-white underline underline-offset-2 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-[#AAAAAA] hover:text-white underline underline-offset-2 transition-colors">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <LiveStatsBar />

      {/* Google OAuth verification — visible heading + description required.
          Demoted from h1 to h2: SEO best-practice is one h1/page, and OAuth
          verification accepts any visible heading with the app name. */}
      <section className="px-6 pb-0 pt-8 bg-[#0F0F0F]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Creator OS Built to Beat vidIQ</h2>
          <p className="text-[#AAAAAA] text-lg leading-relaxed">
            VidYT is the AI growth engine serious YouTube creators use to predict viral potential,
            optimize thumbnails and hooks, discover trending topics, and outperform competitors —
            all before hitting publish. Sign in with Google to get your free channel analysis.
          </p>
        </div>
      </section>

      {/* What is Vidyt? — required for Google OAuth verification */}
      <section id="about" className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-full text-[#FF0000] text-xs font-bold uppercase tracking-widest mb-4">
              About Vidyt
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
              What is <span className="text-[#FF0000]">Vidyt</span>?
            </h2>
            <p className="text-xl text-[#AAAAAA] max-w-3xl mx-auto leading-relaxed">
              VidYT is the AI growth operating system for YouTube creators. Predict performance, fix weak spots,
              discover viral topics — all before you hit publish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Lightbulb,
                title: 'Predict Before You Publish',
                desc: 'Get a Viral Score before uploading. Know your expected CTR, retention risk, and topic momentum — so every upload has a real shot at blowing up.',
                color: '#FF0000',
              },
              {
                icon: FileText,
                title: 'Fix What\'s Killing Your CTR',
                desc: 'AI scans your title, thumbnail, and hook. Tells you exactly what\'s weak and rewrites it — so you stop losing clicks to creators who know less than you.',
                color: '#3EA6FF',
              },
              {
                icon: Target,
                title: 'Find Viral Topics First',
                desc: 'Trend Radar surfaces rising topics in your niche before they peak. Upload before the wave — not after everyone else already has.',
                color: '#2BA640',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="bg-[#181818] border border-[#212121] rounded-2xl p-8 hover:border-[#333] transition-all text-center"
                >
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-[#AAAAAA] text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Who it's for */}
          <div className="bg-[#181818] border border-[#212121] rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Who is Vidyt for?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { emoji: '🎬', label: 'Content Creators', desc: 'YouTubers and video makers who want to grow their channel faster with less effort.' },
                { emoji: '📣', label: 'Marketers', desc: 'Brand and performance marketers who use video to drive traffic and conversions.' },
                { emoji: '⭐', label: 'Influencers', desc: 'Social media personalities who want AI assistance to stay consistent and relevant.' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <span className="text-4xl">{item.emoji}</span>
                  <h4 className="text-white font-semibold">{item.label}</h4>
                  <p className="text-[#AAAAAA] text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-[#181818]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 1, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('features.heading')}{' '}
              <span className="text-[#FF0000]">{t('features.headingHighlight')}</span>
            </h2>
            <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
              {t('features.subheading')}
            </p>
            {planFeatures && (
              <p className="mt-2 text-sm text-[#888888]">
                {t('home.feature.currentPlanNote')}
              </p>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 1, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-[#212121] border border-[#333333] rounded-xl p-6 hover:border-[#FF0000] transition-all group"
                >
                  {feature.href !== '#' ? (
                    <Link href={feature.href} className="block">
                      <div
                        className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: feature.color }} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {t(feature.titleKey as any)}
                      </h3>
                      <p className="text-[#AAAAAA]">{t(feature.descKey as any)}</p>
                      <span className="inline-flex items-center gap-1 mt-3 text-sm text-[#FF0000] opacity-0 group-hover:opacity-100 transition-opacity">
                        Try it <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  ) : (
                    <>
                      <div
                        className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: feature.color }} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {t(feature.titleKey as any)}
                      </h3>
                      <p className="text-[#AAAAAA]">{t(feature.descKey as any)}</p>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 1, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('pricing.heading')}{' '}
              <span className="text-[#FF0000]">{t('pricing.headingHighlight')}</span>
            </h2>
            <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto mb-8">
              {t('pricing.subheading')}
            </p>
          </motion.div>

          {initialPlans.length === 0 ? (
            <p className="text-center text-[#AAAAAA] py-12">Loading plans…</p>
          ) : (
            <PricingSection
              plans={initialPlans.map((p) => {
                const roll = getPlanRoll(p.planId);
                return {
                  id: p.planId,
                  name: p.name,
                  price: p.priceMonth,
                  priceYear: p.priceYear,
                  description: p.description || (roll.id === 'pro' ? 'Advanced AI features for serious creators.' : (roll.id === 'enterprise' ? 'Full power for agencies and brands.' : p.name + ' plan.')),
                  features: p.features,
                  popular: p.popular,
                  role: p.role || roll.role,
                  level: (roll as any).level,
                  // Prefer admin-set values from Manage Plans; only fall back to hardcoded preset when missing.
                  limitsDisplay: (p.limitsDisplay && Object.keys(p.limitsDisplay).length > 0 ? p.limitsDisplay : roll.limitsDisplay) as any,
                  quotas: p.quotas,
                  discount: p.discount,
                };
              })}
              userPlanId={initialUserPlanId}
              variant="homepage"
              fxRates={{
                USD: 1,
                INR: 83,
                EUR: 0.92,
                GBP: 0.79,
                AED: 3.67,
                SGD: 1.34,
                AUD: 1.52,
                CAD: 1.36,
                MXN: 18.0,
                IDR: 15500,
                PKR: 278,
              }}
            />
          )}

          <motion.div
            initial={{ opacity: 1 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              href="/pricing"
              className="text-[#FF0000] hover:text-[#CC0000] font-semibold inline-flex items-center gap-2"
            >
              {t('pricing.viewAllPlans')} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SEO Tools Section */}
      <section id="tools" className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 1, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Full Creator Toolkit. <span className="text-[#FF0000]">Free to Start.</span>
            </h2>
            <p className="text-lg text-[#AAAAAA] max-w-3xl mx-auto">
              Every tool a serious YouTube creator needs — titles, scripts, thumbnails, hooks, keywords, and Shorts — in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { href: '/ai/script-generator', title: 'Script Generator', desc: 'Go from blank page to ready-to-record script in seconds. AI builds your hook, structure, and CTA — optimized for watch time.', icon: Brain },
              { href: '/ai/hook-generator', title: 'Hook Optimizer', desc: 'Stop losing viewers in the first 30 seconds. AI scores your opening, detects dead moments, and rewrites your hook for maximum retention.', icon: Sparkles },
              { href: '/tools/youtube-hashtag-generator', title: 'Keyword Research', desc: 'Find high-intent keywords your competitors are missing. See search volume, competition level, and viral score — before you write your title.', icon: TrendingUp },
              { href: '/tools/youtube-title-generator', title: 'Title CTR Optimizer', desc: 'Write titles that actually get clicked. AI scores 7 CTR factors and rewrites your title until it\'s impossible to scroll past.', icon: Zap },
              { href: '/ai/thumbnail-generator', title: 'AI Thumbnail Maker', desc: 'Design thumbnails that look like a top creator made them. AI adds text, VFX, and cinematic effects — no design skills needed.', icon: Globe },
              { href: '/ai/shorts-creator', title: 'Shorts Clipping AI', desc: 'Turn one long video into a week of viral Shorts. AI finds the best moments, adds hooks and captions, exports in 9:16 format.', icon: Play },
            ].map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 1, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#181818] border border-[#262626] rounded-xl p-6 hover:border-[#FF0000]/60 transition-all group"
                >
                  <Icon className="w-8 h-8 text-[#FF0000] mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
                  <p className="text-sm text-[#AAAAAA] mb-4 leading-relaxed">{tool.desc}</p>
                  <Link href={tool.href} className="inline-flex items-center gap-1 text-sm text-[#FF0000] font-semibold hover:text-[#FF4444] transition">
                    Learn more & try free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VidYT vs vidIQ Comparison */}
      <section className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-full text-[#FF0000] text-xs font-bold uppercase tracking-widest mb-4">
              Why Switch
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              VidYT vs vidIQ — <span className="text-[#FF0000]">No Contest</span>
            </h2>
            <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
              vidIQ shows you what happened. VidYT tells you what to do next.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* vidIQ column */}
            <motion.div initial={{ opacity: 1, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
                  <span className="text-[#666] font-bold text-sm">viQ</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">vidIQ</h3>
                  <p className="text-xs text-[#666]">What you&apos;re used to</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Shows you historical stats after the fact',
                  'Generic keyword scores — no niche context',
                  'Basic thumbnail tips — no CTR prediction',
                  'No hook analysis or retention prediction',
                  'No "why did this fail?" diagnosis',
                  'No AI content workflow automation',
                  'Competitor tracking — surface level only',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#666]">
                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#444] text-xs">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* VidYT column */}
            <motion.div initial={{ opacity: 1, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-gradient-to-br from-[#1a0a0a] to-[#0F0F0F] border border-[#FF0000]/20 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.6), transparent)' }} />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#FF0000]" />
                </div>
                <div>
                  <h3 className="text-white font-bold">VidYT</h3>
                  <p className="text-xs text-[#FF0000]">The future of YouTube growth</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Predicts viral potential BEFORE you upload',
                  'Viral Score AI — niche-aware, trend-matched',
                  'Thumbnail CTR prediction with exact fix suggestions',
                  'Hook Analyzer — detects dead moments in first 30s',
                  '"Fix My Video" AI — diagnoses why it underperformed',
                  'One-click content workflow: title → hook → script → thumbnail',
                  'Competitor Spy — formats, hooks, growth velocity',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center text-[#FF0000] text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF0000] text-white font-semibold rounded-xl hover:bg-[#CC0000] transition-all text-sm">
                Switch to VidYT Free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Coaching Section */}
      <section id="coaching" className="py-24 px-6 bg-[#181818]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 1, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {t('home.coaching.title')}
              </h2>
              <p className="text-xl text-[#AAAAAA] mb-8">
                {t('home.coaching.subtitle')}
              </p>
              <div className="space-y-4">
                {[
                  'Personalized channel growth roadmap',
                  'Hook, title & thumbnail fixes on demand',
                  'Retention & watch time improvement plans',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/80">
                    <div className="w-6 h-6 rounded-full bg-[#FF0000]/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#FF0000]" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 1, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative"
            >
              <div className="aspect-video bg-gradient-to-br from-[#FF0000]/20 to-transparent rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                <Brain className="w-32 h-32 text-[#FF0000]/40 animate-pulse" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 1, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('home.resources.title')}
            </h2>
            <p className="text-xl text-[#AAAAAA]">
              {t('home.resources.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'The SEO Playbook', desc: 'Everything you need to rank #1 on YouTube search. AI-powered title, description, keyword, and thumbnail optimization.', icon: Globe, href: '/dashboard/youtube-seo', cta: 'Try SEO Analyzer' },
              { title: 'Viral Hooks Library', desc: '10 AI-generated viral hooks with psychology triggers for any topic. Boost your first 3-second retention rate.', icon: Sparkles, href: '/ai/hook-generator', cta: 'Generate Hooks' },
              { title: 'Creator Blog', desc: 'Latest tips, trending strategies, and growth hacks from the world of content creation.', icon: Crown, href: '/blog', cta: 'Read Blog' },
            ].map((res, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#181818] border border-white/5 p-8 rounded-2xl hover:border-[#FF0000]/50 transition-all text-left group"
              >
                <res.icon className="w-10 h-10 text-[#FF0000] mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">{res.title}</h3>
                <p className="text-[#AAAAAA] mb-6">{res.desc}</p>
                <Link href={res.href} className="text-[#FF0000] font-semibold flex items-center gap-2">
                  {res.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Extension Section */}
      <section id="extension" className="py-24 px-6 bg-gradient-to-b from-[#181818] to-[#0F0F0F] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] md:w-[800px] md:h-[800px] bg-[#FF0000]/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="bg-[#212121]/50 border border-white/10 rounded-[2.5rem] p-8 md:p-16 backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-full text-[#FF0000] text-xs font-bold uppercase tracking-widest mb-6">
                  <Sparkles className="w-3 h-3" />
                  New Architecture
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  {t('home.extension.title')}
                </h2>
                <p className="text-xl text-[#AAAAAA] mb-10 leading-relaxed">
                  {t('home.extension.subtitle')}
                </p>
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="relative flex-1 min-w-0 sm:min-w-[280px]">
                      <input
                        type="email"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#FF0000]/50 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={waitlistLoading}
                      className="px-8 py-4 bg-[#FF0000] text-white rounded-xl hover:bg-[#CC0000] transition-all font-bold shadow-lg shadow-[#FF0000]/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {waitlistLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {t('home.extension.cta')}
                    </button>
                    
                    <a
                      href="/vidyt-extension.zip"
                      download
                      className="px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-bold border border-white/10 flex items-center gap-2"
                    >
                      Download Beta
                    </a>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsExtensionModalOpen(true)}
                    className="text-[#AAAAAA] hover:text-white text-sm underline underline-offset-4"
                  >
                    How to install?
                  </button>
                  
                  {waitlistStatus.type && (
                    <motion.p
                      initial={{ opacity: 1, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-sm font-medium ${
                        waitlistStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {waitlistStatus.message}
                    </motion.p>
                  )}

                  <div className="flex items-center gap-2 text-[#AAAAAA] text-sm">
                    <Users className="w-5 h-5" />
                    <span>500+ creators waiting</span>
                  </div>
                </form>
              </div>
              <motion.div 
                initial={{ opacity: 1, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <div className="relative">
                   <div className="absolute -inset-4 bg-[#FF0000]/20 blur-2xl rounded-full" />
                   <div className="relative bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        <div className="ml-2 h-4 w-48 bg-white/5 rounded" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-[#FF0000]/10 rounded w-3/4" />
                        <div className="h-4 bg-white/5 rounded w-full" />
                        <div className="h-4 bg-white/5 rounded w-5/6" />
                        <div className="grid grid-cols-3 gap-2 mt-6">
                           <div className="h-20 bg-[#FF0000]/5 rounded-lg border border-[#FF0000]/10" />
                           <div className="h-20 bg-white/5 rounded-lg" />
                           <div className="h-20 bg-white/5 rounded-lg" />
                        </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-full text-[#FF0000] text-xs font-bold uppercase tracking-widest mb-4">
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How Vidyt Works</h2>
            <p className="text-[#AAAAAA] text-lg max-w-2xl mx-auto">Start creating better videos in 4 simple steps — no technical skills needed</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: LogIn,
                title: 'Sign In with Google',
                desc: 'Create your free Vidyt account by signing in securely with your Google account. No extra passwords needed.',
                color: '#FF0000',
              },
              {
                step: '02',
                icon: Target,
                title: 'Choose a Tool',
                desc: 'Select from AI tools: video idea generator, script writer, SEO optimizer, hashtag generator, and more.',
                color: '#3EA6FF',
              },
              {
                step: '03',
                icon: Brain,
                title: 'Generate AI Content',
                desc: 'Enter your topic or video link and let Vidyt\'s AI create ideas, scripts, titles, and optimization suggestions instantly.',
                color: '#2BA640',
              },
              {
                step: '04',
                icon: TrendingUp,
                title: 'Create & Grow',
                desc: 'Use the AI-generated content to create your videos, apply SEO recommendations, and watch your channel grow.',
                color: '#FFD700',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="relative bg-[#181818] border border-[#212121] rounded-2xl p-7 text-center hover:border-[#333] transition group">
                  {/* Connector line between steps */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/4 -right-3 w-6 h-0.5 bg-[#333]" />
                  )}
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: item.color }} />
                  </div>
                  <div className="text-xs font-bold mb-2" style={{ color: item.color }}>{item.step}</div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-[#AAAAAA] text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-all font-semibold text-lg shadow-lg shadow-[#FF0000]/30"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="py-16 px-6 bg-[#181818] border-y border-[#212121]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '50,000+', label: 'Videos Analyzed', color: '#FF0000' },
              { value: '10,000+', label: 'Creators Growing', color: '#3EA6FF' },
              { value: '2.4×', label: 'Avg. CTR Improvement', color: '#2BA640' },
              { value: '3×', label: 'Avg. View Increase', color: '#FFD700' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 1, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p className="text-3xl md:text-4xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[#AAAAAA] text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section id="testimonials" className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Creators Love VidYT</h2>
            <p className="text-[#AAAAAA] text-lg max-w-2xl mx-auto">Real results from real creators who grew their channels with AI-powered SEO</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Rahul Sharma',
                handle: '@rahultechyt',
                avatar: 'RS',
                color: '#FF0000',
                subs: '142K subscribers',
                text: 'VidYT helped me crack the YouTube algorithm. My CTR went from 3.2% to 9.8% in just 6 weeks after using the title optimizer. The hashtag suggestions are insanely accurate.',
                stars: 5,
              },
              {
                name: 'Priya Mehra',
                handle: '@priyacooks',
                avatar: 'PM',
                color: '#3EA6FF',
                subs: '87K subscribers',
                text: 'I was struggling with views for 2 years. After VidYT\'s channel audit, I fixed my thumbnail style and description keywords. First viral video hit 800K views in a month!',
                stars: 5,
              },
              {
                name: 'David Okonkwo',
                handle: '@davefinanceyt',
                avatar: 'DO',
                color: '#2BA640',
                subs: '210K subscribers',
                text: 'The AI script writer alone is worth the Pro plan. I save 4 hours per video and the scripts actually rank. Went from 30K to 210K subscribers in 8 months.',
                stars: 5,
              },
              {
                name: 'Sarah Kim',
                handle: '@sarahgamingclips',
                avatar: 'SK',
                color: '#FFD700',
                subs: '56K subscribers',
                text: 'As a gaming creator, finding trending keywords fast is everything. VidYT\'s keyword intelligence tool is 10x faster than TubeBuddy and actually tells me WHY a keyword works.',
                stars: 5,
              },
              {
                name: 'Mohammed Al-Rashid',
                handle: '@motech_arabic',
                avatar: 'MA',
                color: '#9333EA',
                subs: '320K subscribers',
                text: 'VidYT understands multi-language channels. I create in Arabic and English — the SEO analyzer gives separate recommendations for each audience. Zero other tool does this.',
                stars: 5,
              },
              {
                name: 'Anjali Verma',
                handle: '@anjalicrafts',
                avatar: 'AV',
                color: '#F97316',
                subs: '28K subscribers',
                text: 'I started with the free plan and tripled my views before upgrading. The thumbnail analyzer told me exactly what was killing my CTR. Simple, honest, powerful.',
                stars: 5,
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#181818] border border-[#212121] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#333] transition"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span key={s} className="text-[#FFD700] text-sm">★</span>
                  ))}
                </div>
                <p className="text-[#CCCCCC] text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-[#212121]">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: `${t.color}30`, color: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-[#717171] text-xs">{t.handle} · {t.subs}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — AdSense Friendly */}
      <section id="faq" className="py-24 px-6 bg-[#181818]">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-[#AAAAAA]">Everything you need to know about VidYT</p>
          </motion.div>
          <div className="space-y-4">
            {[
              { q: 'Is VidYT free to use?', a: 'Yes! VidYT offers a free plan with 5 video analyses per month, basic viral score prediction, thumbnail analysis, title optimization, and hashtag generation. Upgrade to Pro for unlimited access.' },
              { q: 'How does VidYT help my videos go viral?', a: 'VidYT uses AI to analyze your titles, descriptions, thumbnails, hashtags, and posting times. It compares your content against top-performing videos and gives actionable recommendations to boost CTR, engagement, and views.' },
              { q: 'Which platforms does VidYT support?', a: 'VidYT supports YouTube, YouTube Shorts, Facebook, Instagram Reels, and TikTok. Each platform has its own SEO analyzer with platform-specific recommendations.' },
              { q: 'How accurate is the CTR prediction?', a: 'Our CTR prediction uses 7 scoring factors including title curiosity, keyword relevance, thumbnail quality, and description optimization. Creators who follow our recommendations see 11.8%+ CTR improvement on average.' },
              { q: 'Can I generate AI thumbnails?', a: 'Yes! VidYT includes an AI Thumbnail Generator that creates cinematic, film-poster quality thumbnails in 8 different art styles. You can upload your photos and AI will composite them with VFX effects.' },
              { q: 'Is my data safe with VidYT?', a: 'Absolutely. We use enterprise-grade encryption, follow GDPR and CCPA regulations, and never share your data with third parties. You can request data deletion anytime from Settings.' },
              { q: 'How does the Content Calendar work?', a: 'Schedule your videos with optimized titles, descriptions, and hashtags. Choose Public, Unlisted, or Private visibility. Videos are automatically uploaded to your YouTube channel at the scheduled time.' },
              { q: 'What AI providers does VidYT use?', a: 'VidYT uses a 9-provider AI failover chain including OpenAI, Google Gemini, Groq, and more. This ensures 99.9% uptime — if one provider fails, the next one takes over seamlessly.' },
            ].map((faq, i) => (
              <motion.details key={i} initial={{ opacity: 1, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group bg-[#181818] border border-[#212121] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-semibold hover:bg-[#1a1a1a] transition">
                  <span>{faq.q}</span>
                  <span className="text-[#FF0000] text-xl ml-4 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-5 text-[#AAAAAA] text-sm leading-relaxed">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Transparency — required for Google OAuth verification */}
      <section id="trust" className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
              Privacy & Trust
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
              Your Data is <span className="text-emerald-400">Safe with Us</span>
            </h2>
            <p className="text-xl text-[#AAAAAA] max-w-3xl mx-auto">
              We believe in full transparency. Here is exactly what data Vidyt uses and how we protect it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* What data we use */}
            <div className="bg-[#181818] border border-[#212121] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#3EA6FF]/15 flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-[#3EA6FF]" />
                </div>
                <h3 className="text-xl font-bold text-white">What Data We Access</h3>
              </div>
              <p className="text-[#AAAAAA] text-sm mb-5">
                When you sign in with Google, Vidyt only requests the minimum information required to create your account:
              </p>
              <ul className="space-y-3">
                {[
                  { item: 'Your name (to personalise your dashboard)', allowed: true },
                  { item: 'Your email address (for your account and login)', allowed: true },
                  { item: 'Your Google profile picture (for your avatar)', allowed: true },
                  { item: 'Your YouTube videos or channel data', allowed: false },
                  { item: 'Contacts, Drive files, or other Google data', allowed: false },
                ].map((row, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${row.allowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {row.allowed ? '✓' : '✗'}
                    </span>
                    <span className={row.allowed ? 'text-[#CCCCCC]' : 'text-[#777777] line-through'}>{row.item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* How we protect it */}
            <div className="bg-[#181818] border border-[#212121] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">How We Protect Your Data</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { icon: Shield, title: 'Never Sold or Shared', desc: 'We never sell, rent, or share your personal data with third parties or advertisers.' },
                  { icon: Lock, title: 'Encrypted & Secure', desc: 'All data is transmitted over HTTPS and stored with industry-standard encryption.' },
                  { icon: Users, title: 'You Stay in Control', desc: 'You can delete your Vidyt account and all associated data at any time from Settings.' },
                  { icon: Globe, title: 'GDPR & CCPA Compliant', desc: 'Vidyt follows international data privacy laws including GDPR (EU) and CCPA (California).' },
                ].map((row, i) => {
                  const Icon = row.icon;
                  return (
                    <li key={i} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold mb-0.5">{row.title}</p>
                        <p className="text-[#AAAAAA] text-sm">{row.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Privacy policy CTA */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-7 text-center">
            <p className="text-[#CCCCCC] mb-4">
              Want to read the full details? Our Privacy Policy explains everything in plain language.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/privacy-policy"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-semibold text-sm"
              >
                <Shield className="w-4 h-4" />
                Read Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-semibold text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-semibold text-sm"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#FF0000] to-[#CC0000]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 1, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {t('cta.heading')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 1, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 mb-8"
          >
            {t('cta.subheading')}
          </motion.p>
          <motion.div
            initial={{ opacity: 1, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#FF0000] rounded-lg hover:bg-gray-100 transition-all font-semibold text-lg shadow-lg"
            >
              {t('cta.button')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F0F0F] border-t border-[#212121] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-[#FF0000]" />
                <span className="text-xl font-bold text-white">
                  <span className="text-[#FF0000]">Vid</span> YT
                </span>
              </div>
              <p className="text-[#AAAAAA] text-sm">
                AI-powered platform for viral content optimization. Your data is always protected.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-[#AAAAAA] text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Plans</Link></li>
                <li><a href="/#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
                <li><a href="/#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/tools/youtube-title-generator" className="hover:text-white transition-colors">Free SEO Tools</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-[#AAAAAA] text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-[#AAAAAA] text-sm">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
                <li><Link href="/data-requests" className="hover:text-white transition-colors">Data Requests</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#212121] pt-8">
            <p className="text-center text-[#555555] text-sm">
              © {new Date().getFullYear()} Vidyt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      {/* Extension Installation Modal */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 1, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#181818] border border-white/10 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl"
          >
            <button
              onClick={() => setIsExtensionModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-all text-[#aaaaaa] hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-bold text-white mb-6">How to Install Vid YT Helper</h2>
            
            <div className="space-y-6 text-[#AAAAAA] text-lg">
              {[
                'Download the ZIP file by clicking "Download Beta".',
                'Extract the contents of the ZIP to a folder on your computer.',
                <>Open Chrome and navigate to <code className="text-white bg-white/10 px-2 py-0.5 rounded">chrome://extensions</code>.</>,
                'Enable "Developer mode" in the top right corner.',
                'Click "Load unpacked" and select the extracted folder.',
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF0000]/20 flex items-center justify-center text-[#FF0000] font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-2xl">
              <p className="text-[#FF0000] font-semibold mb-2">Note for Brave/Edge Users:</p>
              <p className="text-sm text-[#AAAAAA]">
                The same steps apply. Use <code className="text-white">brave://extensions</code> or <code className="text-white">edge://extensions</code> respectively.
              </p>
            </div>

            <button
              onClick={() => setIsExtensionModalOpen(false)}
              className="mt-10 w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-[#eeeeee] transition-all"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
