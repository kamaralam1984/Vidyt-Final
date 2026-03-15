'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
  X
} from 'lucide-react';

const PRICING_PLANS = [
  { name: 'Free', priceMonth: 0, priceYear: 0, features: ['5 video analyses per month', 'Basic viral score prediction', 'Thumbnail analysis', 'Title optimization (3 suggestions)', 'Hashtag generator (10 hashtags)', 'Community support'] },
  { name: 'Pro', priceMonth: 5, priceYear: 50, popular: true, features: ['Unlimited video analyses', 'Advanced AI viral prediction', 'Real-time trend analysis', 'Title optimization (10 suggestions)', 'Hashtag generator (20 hashtags)', 'Best posting time predictions', 'Competitor analysis', 'Email support', 'Priority processing'] },
  { name: 'Enterprise', priceMonth: 12, priceYear: 120, features: ['Everything in Pro', 'Team collaboration (up to 10 users)', 'White-label reports', 'API access', 'Custom AI model training', 'Dedicated account manager', '24/7 priority support', 'Advanced analytics dashboard', 'Bulk video processing', 'Custom integrations'] },
];

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-[#0F0F0F]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ViralBoost AI" className="h-9 w-auto object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[#AAAAAA] hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-[#AAAAAA] hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-[#AAAAAA] hover:text-white transition-colors">
              About
            </a>
            <Link
              href="/login"
              className="text-[#AAAAAA] hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

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
              <div className="overflow-hidden flex justify-center items-start h-[3.8rem] md:h-[5.36rem]">
                <img src="/logo.png" alt="ViralBoost AI" className="h-20 md:h-30 w-auto object-contain object-top scale-[0.7]" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold text-white mt-0 mb-6"
            >
              Make Your Videos{' '}
              <span className="text-[#FF0000] bg-gradient-to-r from-[#FF0000] to-[#CC0000] bg-clip-text text-transparent">
                Go Viral
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-[#AAAAAA] mb-8 max-w-3xl mx-auto"
            >
              AI-powered platform to analyze, optimize, and predict viral potential of your social media videos
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
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-[#212121] text-white rounded-lg hover:bg-[#333333] transition-all font-semibold text-lg flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Watch Demo
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
              Powerful Features for{' '}
              <span className="text-[#FF0000]">Content Creators</span>
            </h2>
            <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
              Everything you need to create viral content and grow your audience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'AI-Powered Predictions', description: 'Advanced ML models for accurate viral potential', href: '/login', color: '#FF0000' },
              { icon: TrendingUp, title: 'Real-Time Trends', description: 'Stay ahead with trending topics and hashtags', href: '/login', color: '#f59e0b' },
              { icon: BarChart3, title: 'Advanced Analytics', description: 'Deep insights into your content performance', href: '/login', color: '#8b5cf6' },
              { icon: Clock, title: 'Smart Scheduling', description: 'Optimal posting times for maximum engagement', href: '/login', color: '#10b981' },
              { icon: Users, title: 'Competitor Analysis', description: 'Learn from top-performing creators', href: '/login', color: '#06b6d4' },
              { icon: Shield, title: 'Secure & Private', description: 'Your data is always protected', href: '#', color: '#64748b' },
            ].map((feature, index) => {
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
                      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-[#AAAAAA]">{feature.description}</p>
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
                      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-[#AAAAAA]">{feature.description}</p>
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
              Simple, Transparent <span className="text-[#FF0000]">Pricing</span>
            </h2>
            <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto mb-8">
              Choose the plan that fits your needs
            </p>
            {/* Monthly / Yearly Toggle */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className={`text-sm font-medium ${billingPeriod === 'month' ? 'text-white' : 'text-[#AAAAAA]'}`}>
                Monthly
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
                Yearly
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan, index) => {
              const price = billingPeriod === 'year' ? plan.priceYear : plan.priceMonth;
              const priceLabel = plan.priceMonth === 0 && plan.priceYear === 0 ? '$0' : `$${price}`;
              const periodLabel = billingPeriod === 'year' ? '/year' : '/month';
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-[#181818] border-2 rounded-xl p-8 ${
                    plan.popular ? 'border-[#FF0000] shadow-2xl shadow-[#FF0000]/20' : 'border-[#212121]'
                  }`}
                >
                  {plan.popular && (
                    <div className="bg-[#FF0000] text-white px-4 py-1 rounded-full text-sm font-semibold inline-block mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-white mb-6">{priceLabel}<span className="text-lg text-[#AAAAAA]">{periodLabel}</span></div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-[#AAAAAA]">
                        <Check className="w-5 h-5 text-[#10b981]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${
                      plan.popular
                        ? 'bg-[#FF0000] text-white hover:bg-[#CC0000]'
                        : 'bg-[#212121] text-white hover:bg-[#333333]'
                    }`}
                  >
                    Get Started
                  </Link>
                </motion.div>
              );
            })}
          </div>

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
              View All Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
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
            Ready to Go Viral?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 mb-8"
          >
            Join thousands of creators using AI to maximize their reach
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
              Start Free Trial
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
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-[#AAAAAA] text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
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
