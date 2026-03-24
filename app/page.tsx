'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import MarketingNavbar from '@/components/MarketingNavbar';
import {
  Zap,
  TrendingUp,
  Target,
  BarChart3,
  Sparkles,
  ArrowRight,
  Check,
  Play,
  Users,
  Shield,
  Clock,
  Globe,
  Crown,
  Menu,
  X,
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { getPlanFeatures, type PlanId, type PlanFeatures } from '@/lib/planLimits';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from '@/context/translations';
import { useUser } from '@/hooks/useUser';

type HomeFeatureKey = keyof PlanFeatures;

/** Pricing cards: amounts and copy come from Manage Plans via /api/subscriptions/plans */
type MarketingPlan = {
  planId: string;
  name: string;
  popular?: boolean;
  priceMonth: number;
  priceYear: number;
  features: string[];
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

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [marketingPlans, setMarketingPlans] = useState<MarketingPlan[]>([]);
  const { locale } = useLocale();
  const { t } = useTranslations();
  const { authenticated, loading } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Try to detect logged-in user and their plan; ignore errors for anonymous visitors
    axios
      .get('/api/user/usage', { headers: getAuthHeaders() })
      .then((res) => {
        const p = res.data?.subscription?.plan as PlanId | undefined;
        if (p) setPlanId(p);
      })
      .catch(() => {
        // not logged in or API error – keep marketing defaults
      })
      .finally(() => setPlanLoaded(true));

    axios
      .get('/api/subscriptions/plans')
      .then((res) => {
        const apiPlans = res.data?.plans || [];
        setMarketingPlans(
          apiPlans.map((p: any) => {
            const id = String(p.id || p.dbId || '');
            const priceMonth = Number(p.price) || 0;
            const priceYear =
              typeof p.priceYearly === 'number' && p.priceYearly > 0
                ? p.priceYearly
                : priceMonth * 10;
            return {
              planId: id,
              name: p.name,
              popular: id === 'pro',
              priceMonth,
              priceYear,
              features: Array.isArray(p.features) ? p.features : [],
            };
          })
        );
      })
      .catch(() => setMarketingPlans([]));
  }, []);

  const planFeatures = planId ? getPlanFeatures(planId) : null;
  const visibleFeatures = HOME_FEATURES.filter((feature) => {
    if (!planFeatures || !feature.requiresFeature) return true;
    return !!planFeatures[feature.requiresFeature];
  });

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <MarketingNavbar />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF0000]/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF0000]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF0000]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-0"
            >
              {/* Container 80% height = crop bottom 20% of logo */}
              <div className="overflow-hidden flex justify-center items-start h-[19rem] md:h-[26.8rem]">
                <img src="/logo.png" alt="ViralBoost AI" className="h-96 md:h-[30rem] w-auto object-contain object-top" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold text-white mt-0 mb-6"
            >
              {t('hero.title.main')}{' '}
              <span className="text-[#FF0000] bg-gradient-to-r from-[#FF0000] to-[#CC0000] bg-clip-text text-transparent">
                {t('hero.title.highlight')}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-[#AAAAAA] mb-8 max-w-3xl mx-auto"
            >
              {t('hero.subtitle')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="group px-8 py-4 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-all font-semibold text-lg flex items-center gap-2 shadow-lg shadow-[#FF0000]/30"
              >
                {t('hero.cta.primary')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-[#212121] text-white rounded-lg hover:bg-[#333333] transition-all font-semibold text-lg flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                {t('hero.cta.secondary')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-[#181818]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
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
                Your current plan ke hisaab se sirf enabled features yahan show ho rahe hain.
              </p>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
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
            initial={{ opacity: 0, y: 30 }}
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
            {/* Monthly / Yearly Toggle */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className={`text-sm font-medium ${billingPeriod === 'month' ? 'text-white' : 'text-[#AAAAAA]'}`}>
                {t('pricing.toggle.monthly')}
              </span>
              <button
                type="button"
                onClick={() => setBillingPeriod((p) => (p === 'month' ? 'year' : 'month'))}
                className="relative w-14 h-7 bg-[#212121] rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
                aria-label="Toggle billing period"
              >
                <motion.div
                  animate={{ x: billingPeriod === 'year' ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-5 h-5 bg-[#FF0000] rounded-full absolute top-1 left-1"
                />
              </button>
              <span className={`text-sm font-medium ${billingPeriod === 'year' ? 'text-white' : 'text-[#AAAAAA]'}`}>
                {t('pricing.toggle.yearly')}
              </span>
            </div>
          </motion.div>

          {marketingPlans.length === 0 ? (
            <p className="text-center text-[#AAAAAA] py-12">Loading plans…</p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {marketingPlans.map((plan, index) => {
              const basePrice = billingPeriod === 'year' ? plan.priceYear : plan.priceMonth;
              const isFree = plan.priceMonth === 0 && plan.priceYear === 0;
              // Simple static conversion for marketing display only
              const rateMap: Record<string, number> = {
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
              };
              const rate = rateMap[locale.currency] ?? 1;
              const converted = isFree ? 0 : Math.round(basePrice * rate * 100) / 100;
              const format = (v: number) =>
                Number.isInteger(v) ? v.toFixed(0) : v.toFixed(2).replace(/\.00$/, '');
              const priceLabel = isFree ? `${locale.currencySymbol}0` : `${locale.currencySymbol}${format(converted)}`;
              const periodLabel = billingPeriod === 'year' ? '/year' : '/month';
              return (
                <motion.div
                  key={plan.planId || plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-[#181818] border-2 rounded-xl p-8 ${plan.popular ? 'border-[#FF0000] shadow-2xl shadow-[#FF0000]/20' : 'border-[#212121]'
                    }`}
                >
                  {plan.popular && (
                    <div className="bg-[#FF0000] text-white px-4 py-1 rounded-full text-sm font-semibold inline-block mb-4">
                      {t('pricing.mostPopular')}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        {priceLabel}
                        <span className="text-lg text-[#AAAAAA]">{periodLabel}</span>
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => {
                      const translated = typeof feature === 'string' && feature.startsWith('pricing.') ? t(feature as any) : feature;
                      return (
                        <li key={i} className="flex items-center gap-2 text-[#AAAAAA]">
                          <Check className="w-5 h-5 text-[#10b981]" />
                          {translated}
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    href="/register"
                    className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${plan.popular
                      ? 'bg-[#FF0000] text-white hover:bg-[#CC0000]'
                      : 'bg-[#212121] text-white hover:bg-[#333333]'
                      }`}
                  >
                    {t('pricing.getStarted')}
                  </Link>
                </motion.div>
              );
            })}
          </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
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

      {/* SEO-focused Free AI Tools Section */}
      <section
        id="tools"
        className="py-24 px-6 bg-[#0F0F0F]"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Grow on YouTube with Free AI Tools
            </h2>
            <p className="text-lg text-[#AAAAAA] max-w-3xl mx-auto">
              Use ViralBoost AI&apos;s free YouTube tools to get ideas, scripts, thumbnails, titles and hashtags
              in one place — without any complicated setup.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: 'script-writer',
                title: 'YouTube Script Writer',
                desc: 'Turn any topic into a ready-to-record YouTube script with hooks, sections and CTAs.',
                href: '/ai/script-generator',
              },
              {
                id: 'daily-ideas',
                title: 'Video Ideas & Hooks Generator',
                desc: 'Daily viral ideas, hooks and angles optimized for your niche.',
                href: '/ai/script-generator?mode=ideas',
              },
              {
                id: 'keyword-research',
                title: 'YouTube Keyword Research',
                desc: 'Discover high-intent YouTube keywords based on real search data.',
                href: '/dashboard/youtube-seo?tab=keywords',
              },
              {
                id: 'title-generator',
                title: 'Title & CTR Optimization',
                desc: 'Turn boring titles into click‑worthy headlines with AI title scoring.',
                href: '/dashboard/youtube-seo?tab=titles',
              },
              {
                id: 'thumbnail-maker',
                title: 'AI Thumbnail Optimization',
                desc: 'Optimize thumbnails for CTR and compare which version is stronger.',
                href: '/dashboard/youtube-seo?tab=thumbnails',
              },
              {
                id: 'ai-shorts',
                title: 'Shorts & Clip Generator',
                desc: 'Auto‑clip long videos into Shorts that hook viewers in the first 3 seconds.',
                href: '/ai/shorts-creator',
              },
            ].map((tool, index) => {
              const toolHref = `/tools/${tool.id}`;
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#181818] border border-[#262626] rounded-xl p-6 hover:border-[#FF0000] transition-all"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-[#AAAAAA] mb-4">
                    {tool.desc}
                  </p>
                  <Link
                    href={toolHref}
                    className="inline-flex items-center gap-1 text-sm text-[#FF0000] hover:text-[#CC0000]"
                  >
                    Start using this tool
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coaching / AI Coach Section */}
      <section
        id="coaching"
        className="py-24 px-6 bg-[#181818]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Personal AI YouTube Coach
            </h2>
            <p className="text-lg text-[#AAAAAA] mb-4">
              From channel audit to thumbnails and retention — the ViralBoost AI Coach gives you step-by-step
              guidance to make your videos truly ready to go viral.
            </p>
            <ul className="space-y-3 text-sm text-[#DDDDDD]">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-[#10b981] mt-1" />
                Deep channel audit with a clear, actionable improvement plan.
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-[#10b981] mt-1" />
                Niche-specific ideas, content calendar and best posting time suggestions.
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-[#10b981] mt-1" />
                Hooks, titles, thumbnails and descriptions that all follow one growth framework.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/tools/channel-audit"
                className="px-6 py-3 bg-[#FF0000] text-white rounded-lg text-sm font-semibold hover:bg-[#CC0000] transition"
              >
                Run a free channel audit
              </Link>
              <Link
                href="/tools/ai-coach"
                className="px-6 py-3 bg-[#262626] text-white rounded-lg text-sm font-semibold hover:bg-[#333333] transition flex items-center gap-2"
              >
                Ask the AI Coach
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#121212] border border-[#262626] rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-xl font-semibold text-white">
              YouTube Growth System, not just random tools
            </h3>
            <p className="text-sm text-[#AAAAAA]">
              All tools are connected in one growth loop: research → create → optimize → analyze. This also sends
              a strong topical authority signal to Google because every page is focused on YouTube growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Resources / Blog Section */}
      <section
        id="resources"
        className="py-24 px-6 bg-[#0F0F0F]"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              YouTube SEO Guides & Resources
            </h2>
            <p className="text-lg text-[#AAAAAA] max-w-3xl mx-auto">
              In‑depth playbooks that teach you thumbnail, title, retention and posting strategy — so you use a
              complete system, not just isolated tools.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'YouTube SEO Checklist',
                desc: 'Step-by-step checklist to follow before every upload.',
              },
              {
                title: 'Viral Shorts Formula',
                desc: 'Breakdown of the first 3 seconds, hook structures and pacing for viral Shorts.',
              },
              {
                title: 'Thumbnail Frameworks',
                desc: 'Thumbnail patterns used by top creators to keep CTR consistently high.',
              },
            ].map((post) => (
              <div
                key={post.title}
                className="bg-[#181818] border border-[#262626] rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-[#AAAAAA] mb-4">
                  {post.desc}
                </p>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-sm text-[#FF0000] hover:text-[#CC0000]"
                >
                  Read this guide
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extension / Integrations Section (SEO stub) */}
      <section
        id="extension"
        className="py-24 px-6 bg-[#181818]"
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            ViralBoost AI Browser Extension
          </motion.h2>
          <p className="text-lg text-[#AAAAAA] mb-6 max-w-3xl mx-auto">
            A Chrome extension is coming soon that will bring keyword research, title suggestions and thumbnail
            feedback directly inside YouTube Studio — without switching dashboards.
          </p>
          <p className="text-sm text-[#777777] mb-6">
            For now, run all your optimization inside the web app. The extension landing page and waitlist will
            later target specific Google searches like &quot;YouTube SEO Chrome extension&quot; and similar queries.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition text-sm font-semibold"
          >
            Get early access updates
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-24 px-6 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Creators growing with ViralBoost AI
            </h2>
            <p className="text-lg text-[#AAAAAA] max-w-3xl mx-auto">
              Different niches, same outcome — better click-through rate, higher watch time and more predictable
              growth instead of random viral luck.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Gaming Creator',
                stat: '+78% CTR',
                quote:
                  'Using thumbnail suggestions and title score together almost doubled CTR in just three weeks.',
              },
              {
                name: 'Education Channel',
                stat: '3x views',
                quote:
                  'Keyword research plus the best posting time tool tripled views on evergreen tutorials in 60 days.',
              },
              {
                name: 'Vlog / Lifestyle',
                stat: '+42% watch time',
                quote:
                  'AI script outlines fixed hooks and pacing, which clearly improved average view duration.',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-[#181818] border border-[#262626] rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-sm text-[#DDDDDD] mb-4">
                    “{t.quote}”
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[#FFFFFF]/90 font-semibold">
                    {t.name}
                  </span>
                  <span className="text-[#10b981] font-semibold">
                    {t.stat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#FF0000] to-[#CC0000]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {t('cta.heading')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 mb-8"
          >
            {t('cta.subheading')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
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
                  <span className="text-[#FF0000]">ViralBoost</span> AI
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
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-[#AAAAAA] text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-[#AAAAAA] text-sm">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#212121] pt-8 text-center text-[#AAAAAA] text-sm">
            © 2024 ViralBoost AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
