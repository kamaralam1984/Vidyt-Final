'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { 
  Check, 
  Zap, 
  Crown, 
  Rocket, 
  Sparkles,
  ArrowRight,
  Loader2,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  Target,
  Shield,
  Globe
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  icon: any;
  color: string;
  limits: {
    videos: string;
    analyses: string;
    storage: string;
    support: string;
  };
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started',
    icon: Sparkles,
    color: '#AAAAAA',
    features: [
      '5 video analyses per month',
      'Basic viral score prediction',
      'Thumbnail analysis',
      'Title optimization (3 suggestions)',
      'Hashtag generator (10 hashtags)',
      'Community support',
    ],
    limits: {
      videos: '5/month',
      analyses: 'Basic',
      storage: '—',
      support: 'Community',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 5,
    period: 'month',
    description: 'For serious creators',
    icon: Zap,
    color: '#FF0000',
    popular: true,
    features: [
      '30 video analyses per day',
      'Advanced AI viral prediction',
      'Real-time trend analysis',
      'Title optimization (10 suggestions)',
      'Hashtag generator (20 hashtags)',
      'Best posting time predictions',
      'Competitor analysis',
      'Email support',
      'Priority processing',
    ],
    limits: {
      videos: '30/days',
      analyses: 'Advanced AI',
      storage: '—',
      support: 'Email',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 12,
    period: 'month',
    description: 'For agencies and teams',
    icon: Crown,
    color: '#FFD700',
    features: [
      'Everything in Pro',
      'Team collaboration (up to 10 users)',
      'White-label reports',
      'Custom AI model training',
      'Dedicated account manager',
      '24/7 priority support',
      'Advanced analytics dashboard',
      '100 videos /days',
      'Custom integrations',
    ],
    limits: {
      videos: '100 Videos/Days',
      analyses: 'Custom AI',
      storage: '—',
      support: '24/7 Priority',
    },
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user's current plan
    const fetchUserPlan = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserPlan(response.data.user?.subscription || response.data.user?.subscriptionPlan?.planId || 'free');
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };
    fetchUserPlan();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to subscribe');
        window.location.href = '/login';
        return;
      }

      const response = await axios.post(
        '/api/subscriptions/checkout',
        {
          planId,
          billingPeriod,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.url || response.data.checkoutUrl) {
        window.location.href = response.data.url || response.data.checkoutUrl;
      } else {
        alert('Subscription successful!');
        setUserPlan(planId);
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.response?.data?.error || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return 'Free';
    const price = billingPeriod === 'year' ? plan.price * 10 : plan.price;
    return `$${price}${billingPeriod === 'year' ? '/year' : '/month'}`;
  };

  const getSavings = (plan: Plan) => {
    if (plan.price === 0 || billingPeriod === 'month') return null;
    const monthlyPrice = plan.price;
    const yearlyPrice = plan.price * 10;
    const savings = (monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12);
    return Math.round(savings * 100);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#0F0F0F] via-[#181818] to-[#0F0F0F]">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                Choose Your <span className="text-[#FF0000]">Plan</span>
              </h1>
              <p className="text-xl text-[#AAAAAA] mb-8 max-w-2xl mx-auto">
                Unlock the power of AI-driven viral content optimization
              </p>
            </motion.div>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 mb-12"
            >
              <span className={`text-sm ${billingPeriod === 'month' ? 'text-white' : 'text-[#AAAAAA]'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
                className="relative w-14 h-7 bg-[#212121] rounded-full p-1 transition-colors"
              >
                <motion.div
                  animate={{
                    x: billingPeriod === 'year' ? 28 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-5 h-5 bg-[#FF0000] rounded-full absolute"
                />
              </button>
              <span className={`text-sm ${billingPeriod === 'year' ? 'text-white' : 'text-[#AAAAAA]'}`}>
                Yearly
                {billingPeriod === 'year' && (
                  <span className="ml-2 px-2 py-1 bg-[#FF0000]/20 text-[#FF0000] rounded text-xs">
                    Save up to 17%
                  </span>
                )}
              </span>
            </motion.div>
          </motion.div>

          {/* Plans Grid */}
          <div className="max-w-7xl mx-auto px-6 pb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                const isCurrentPlan = userPlan === plan.id;
                const savings = getSavings(plan);

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`relative ${
                      plan.popular
                        ? 'md:-mt-4 md:mb-4'
                        : ''
                    }`}
                  >
                    {plan.popular && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                      >
                        <div className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star className="w-4 h-4 fill-white" />
                          Most Popular
                        </div>
                      </motion.div>
                    )}

                    <motion.div
                      whileHover={{ y: -8, scale: 1.02 }}
                      className={`relative bg-[#181818] border-2 rounded-2xl p-8 h-full ${
                        plan.popular
                          ? 'border-[#FF0000] shadow-2xl shadow-[#FF0000]/20'
                          : 'border-[#212121] hover:border-[#333333]'
                      } transition-all duration-300`}
                    >
                      {/* Plan Header */}
                      <div className="text-center mb-8">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                          style={{ backgroundColor: `${plan.color}20` }}
                        >
                          <Icon className="w-8 h-8" style={{ color: plan.color }} />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                        <p className="text-[#AAAAAA] text-sm mb-4">{plan.description}</p>
                        <div className="mb-2">
                          <span className="text-4xl font-bold text-white">{getPrice(plan)}</span>
                          {savings && (
                            <span className="ml-2 text-sm text-[#10b981]">
                              Save {savings}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature, featureIndex) => (
                          <motion.li
                            key={featureIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index + 0.05 * featureIndex }}
                            className="flex items-start gap-3"
                          >
                            <Check className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                            <span className="text-[#AAAAAA] text-sm">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>

                      {/* Limits */}
                      <div className="border-t border-[#212121] pt-6 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[#AAAAAA] mb-1">Videos</p>
                            <p className="text-white font-semibold">{plan.limits.videos}</p>
                          </div>
                          <div>
                            <p className="text-[#AAAAAA] mb-1">Analyses</p>
                            <p className="text-white font-semibold">{plan.limits.analyses}</p>
                          </div>
                          <div>
                            <p className="text-[#AAAAAA] mb-1">Storage</p>
                            <p className="text-white font-semibold">{plan.limits.storage}</p>
                          </div>
                          <div>
                            <p className="text-[#AAAAAA] mb-1">Support</p>
                            <p className="text-white font-semibold">{plan.limits.support}</p>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      {isCurrentPlan ? (
                        <motion.button
                          disabled
                          className="w-full py-3 px-6 bg-[#212121] text-[#AAAAAA] rounded-lg font-semibold cursor-not-allowed"
                        >
                          Current Plan
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={loading === plan.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                            plan.popular
                              ? 'bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:from-[#CC0000] hover:to-[#AA0000]'
                              : 'bg-[#212121] hover:bg-[#333333]'
                          } flex items-center justify-center gap-2`}
                        >
                          {loading === plan.id ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </motion.button>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Features Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-16 bg-[#181818] border border-[#212121] rounded-2xl p-8"
            >
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Why Choose ViralBoost AI?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: TrendingUp, title: 'AI-Powered Predictions', desc: 'Advanced ML models for accurate viral potential' },
                  { icon: Target, title: 'Real-Time Trends', desc: 'Stay ahead with trending topics and hashtags' },
                  { icon: BarChart3, title: 'Advanced Analytics', desc: 'Deep insights into your content performance' },
                  { icon: Calendar, title: 'Smart Scheduling', desc: 'Optimal posting times for maximum engagement' },
                  { icon: Users, title: 'Competitor Analysis', desc: 'Learn from top-performing creators' },
                  { icon: Shield, title: 'Secure & Private', desc: 'Your data is always protected' },
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] transition-colors"
                    >
                      <div className="p-2 bg-[#FF0000]/20 rounded-lg">
                        <Icon className="w-6 h-6 text-[#FF0000]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                        <p className="text-[#AAAAAA] text-sm">{feature.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-16"
            >
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4 max-w-3xl mx-auto">
                {[
                  {
                    q: 'Can I change plans anytime?',
                    a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
                  },
                  {
                    q: 'What payment methods do you accept?',
                    a: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.',
                  },
                  {
                    q: 'Is there a free trial?',
                    a: 'Yes! All paid plans come with a 7-day free trial. No credit card required.',
                  },
                  {
                    q: 'Can I cancel anytime?',
                    a: 'Absolutely! Cancel anytime with no cancellation fees. Your access continues until the end of your billing period.',
                  },
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="bg-[#181818] border border-[#212121] rounded-lg p-6 hover:border-[#333333] transition-colors"
                  >
                    <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                    <p className="text-[#AAAAAA]">{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
    </DashboardLayout>
  );
}
