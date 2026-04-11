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
} from 'lucide-react';
import Image from 'next/image';
import { type PlanFeatures } from '@/lib/planLimits';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from '@/context/translations';
import { useUser } from '@/hooks/useUser';
import PricingSection from '@/components/PricingSection';
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
              <div className="relative overflow-hidden flex justify-center items-start h-[19rem] md:h-[26.8rem] w-full max-w-[30rem]">
                <Image
                  src="/Logo.png"
                  alt="Vid YT"
                  width={600}
                  height={600}
                  priority
                  className="h-96 md:h-[30rem] w-auto object-contain object-top"
                />
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
                  limitsDisplay: roll.limitsDisplay,
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

      {/* SEO Tools Section */}
      <section id="tools" className="py-24 px-6 bg-[#0F0F0F]">
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
              Use Vid YT&apos;s free YouTube tools to get ideas, scripts, thumbnails, titles and hashtags
              in one place — without any complicated setup.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: 'script-writer', title: 'YouTube Script Writer', desc: 'Turn any topic into a ready-to-record YouTube script with hooks, sections and CTAs.', href: '/ai/script-generator' },
              { id: 'daily-ideas', title: 'Video Ideas & Hooks Generator', desc: 'Daily viral ideas, hooks and angles optimized for your niche.', href: '/ai/script-generator?mode=ideas' },
              { id: 'keyword-research', title: 'YouTube Keyword Research', desc: 'Discover high-intent YouTube keywords based on real search data.', href: '/dashboard/youtube-seo?tab=keywords' },
              { id: 'title-generator', title: 'Title & CTR Optimization', desc: 'Turn boring titles into click‑worthy headlines with AI title scoring.', href: '/dashboard/youtube-seo?tab=titles' },
              { id: 'thumbnail-maker', title: 'AI Thumbnail Optimization', desc: 'Optimize thumbnails for CTR and compare which version is stronger.', href: '/dashboard/youtube-seo?tab=thumbnails' },
              { id: 'ai-shorts', title: 'Shorts & Clip Generator', desc: 'Auto‑clip long videos into Shorts that hook viewers in the first 3 seconds.', href: '/ai/shorts-creator' },
            ].map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#181818] border border-[#262626] rounded-xl p-6 hover:border-[#FF0000] transition-all"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{tool.title}</h3>
                <p className="text-sm text-[#AAAAAA] mb-4">{tool.desc}</p>
                <Link href={`/tools/${tool.id}`} className="inline-flex items-center gap-1 text-sm text-[#FF0000] hover:text-[#CC0000]">
                  Start using this tool <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching Section */}
      <section id="coaching" className="py-24 px-6 bg-[#181818]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
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
                  'YouTube SEO & channel insights',
                  'AI-Driven Content Strategy',
                  'Retention & Watch Time Optimization',
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
              initial={{ opacity: 0, x: 30 }}
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
            initial={{ opacity: 0, y: 30 }}
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
              { title: 'The SEO Playbook', desc: 'Everything you need to rank #1 on YouTube search.', icon: Globe },
              { title: 'Viral Hooks Library', desc: '100+ proven hooks to skyrocket your retention.', icon: Sparkles },
              { title: 'Creator Blog', desc: 'Latest tips and trends from the world of content creation.', icon: Crown, href: '/blog' },
            ].map((res, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#181818] border border-white/5 p-8 rounded-2xl hover:border-[#FF0000]/50 transition-all text-left group"
              >
                <res.icon className="w-10 h-10 text-[#FF0000] mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">{res.title}</h3>
                <p className="text-[#AAAAAA] mb-6">{res.desc}</p>
                {res.href ? (
                  <Link href={res.href} className="text-[#FF0000] font-semibold flex items-center gap-2">
                    Read more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <span className="text-white/40 text-sm font-medium">Coming Soon</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Extension Section */}
      <section id="extension" className="py-24 px-6 bg-gradient-to-b from-[#181818] to-[#0F0F0F] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF0000]/5 rounded-full blur-[120px] pointer-events-none" />
        
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
                    <div className="relative flex-1 min-w-[280px]">
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
                      initial={{ opacity: 0, y: -10 }}
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
                initial={{ opacity: 0, scale: 0.9 }}
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
            © {new Date().getFullYear()} Vid YT. All rights reserved.
          </div>
        </div>
      </footer>
      {/* Extension Installation Modal */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
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
