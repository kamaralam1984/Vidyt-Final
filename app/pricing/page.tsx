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
import { useLocale } from '@/context/LocaleContext';

interface Plan {
  id: string;
  name: string;
  price: number;
  /** USD yearly total from Manage Plans (10× monthly or custom annual price) */
  priceYear: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  icon: any;
  color: string;
  role?: string;
  level?: number;
  limits: {
    videos: string;
    analyses: string;
    storage: string;
    support: string;
  };
}

const PLAN_UI_PRESETS: Record<string, any> = {
  free: {
    icon: Sparkles,
    color: '#AAAAAA',
    role: 'user',
    level: 1,
    limits: {
      videos: '5/month',
      analyses: 'Basic',
      storage: '—',
      support: 'Community',
    },
  },
  starter: {
    icon: Rocket,
    color: '#3b82f6',
    role: 'user',
    level: 1,
    limits: {
      videos: '10/day',
      analyses: 'Standard',
      storage: '—',
      support: 'Email',
    },
  },
  pro: {
    icon: Zap,
    color: '#FF0000',
    popular: true,
    role: 'manager',
    level: 2,
    limits: {
      videos: '30/days',
      analyses: 'Advanced AI',
      storage: '—',
      support: 'Email',
    },
  },
  enterprise: {
    icon: Crown,
    color: '#FFD700',
    role: 'admin',
    level: 3,
    limits: {
      videos: '100 Videos/Days',
      analyses: 'Custom AI',
      storage: '—',
      support: '24/7 Priority',
    },
  },
  custom: {
    icon: Globe,
    color: '#FF0000',
    role: 'admin',
    level: 3,
    limits: {
      videos: 'Unlimited',
      analyses: 'Unlimited Custom AI',
      storage: 'Unlimited',
      support: 'Dedicated Support',
    },
  },
};

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    // Fetch user's current plan
    const fetchUserPlan = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserPlan(
            response.data.user?.subscription ||
              response.data.user?.subscriptionPlan?.planId ||
              'free'
          );
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };

    // Fetch plans with active discounts
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const res = await axios.get('/api/subscriptions/plans');
        const apiPlans = res.data?.plans || [];
        
        const formattedPlans = apiPlans.map((p: any) => {
          const preset = PLAN_UI_PRESETS[p.id] || {
            icon: Star,
            color: '#3b82f6',
            role: 'user',
            level: 1,
            limits: {
              videos: p.limits?.videos === -1 ? 'Unlimited' : `${p.limits?.videos || 'Custom'}/month`,
              analyses: p.limits?.analyses === -1 ? 'Unlimited' : (typeof p.limits?.analyses === 'number' ? `${p.limits.analyses}/month` : 'Standard'),
              storage: '—',
              support: 'Priority',
            }
          };
          const price = Number(p.price) || 0;
          const priceYear =
            typeof p.priceYearly === 'number' && p.priceYearly > 0 ? p.priceYearly : price * 10;

          return {
            id: p.id || p.dbId,
            dbId: p.dbId,
            name: p.name,
            price,
            priceYear,
            period: p.interval || 'month',
            description: p.description || 'Custom Plan',
            features: p.features || [],
            popular: p.id === 'pro' || preset.popular || false,
            icon: preset.icon,
            color: preset.color,
            role: preset.role,
            level: preset.level,
            limits: preset.limits,
          };
        });

        setActivePlans(formattedPlans);
      } catch (error) {
        console.error('Error fetching plans with discounts:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchUserPlan();
    fetchPlans();

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const payBusy = (planId: string) =>
    loading === `rzp:${planId}` || loading === `stripe:${planId}`;

  const handleSubscribeStripe = async (plan: Plan) => {
    if (plan.price === 0) {
      window.location.href = '/dashboard';
      return;
    }

    setLoading(`stripe:${plan.id}`);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to subscribe');
        window.location.href = '/login';
        return;
      }

      const response = await axios.post(
        '/api/payments/stripe/create-checkout',
        { plan: plan.id, billingPeriod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }

      alert(response.data?.error || 'Failed to start Stripe checkout.');
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      alert(error.response?.data?.error || 'Failed to start Stripe checkout.');
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (plan.price === 0) {
      window.location.href = '/dashboard';
      return;
    }

    setLoading(`rzp:${plan.id}`);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to subscribe');
        window.location.href = '/login';
        return;
      }

      const response = await axios.post(
        '/api/payments/create-order',
        {
          plan: plan.id,
          billingPeriod,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const orderData = response.data;
      openRazorpay(orderData, plan.id);
    } catch (error: any) {
      console.error('Order creation error:', error);
      alert(error.response?.data?.error || 'Failed to initiate payment. Please try again.');
      setLoading(null);
    }
    // openRazorpay clears loading in handler finally
  };

  const openRazorpay = (order: any, planId: string) => {
    const options = {
      key: order.key, // Use key from server order response
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'ViralBoost AI',
      description: `Upgrade to ${planId} Plan`,
      order_id: order.id,
      handler: async function (response: any) {
        try {
          setLoading(`rzp:${planId}`);
          await axios.post('/api/payments/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan: planId,
            billingPeriod,
              // Forward server-created order charge so backend can detect mismatches
              amountMinor: order.amount,
              currency: order.currency || 'INR',
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });

          alert('✅ Plan upgraded successfully!');
          window.location.href = '/dashboard';
        } catch (error: any) {
          console.error('Payment verification error:', error);
          alert('Payment verification failed. Please contact support.');
        } finally {
          setLoading(null);
        }
      },
      prefill: {
        name: '',
        email: '',
      },
      theme: {
        color: '#FF0000',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return 'Free';
    const base = billingPeriod === 'year' ? plan.priceYear : plan.price;
    const suffix = billingPeriod === 'year' ? '/year' : '/month';

    const format = (value: number) =>
      Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/\.00$/, '');

    const rateMap: Record<string, number> = {
      USD: 1,
      INR: 83,
      EUR: 0.92,
      GBP: 0.79,
    };
    const rate = rateMap[locale.currency] ?? 1;
    const baseConverted = Math.round(base * rate * 100) / 100;
    return `${locale.currencySymbol}${format(baseConverted)}${suffix}`;
  };

  const getSavings = (plan: Plan) => {
    if (plan.price === 0 || billingPeriod === 'month') return null;
    const monthlyPrice = plan.price;
    const yearlyPrice = plan.priceYear;
    const savings = (monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12);
    return Math.round(savings * 100);
  };

  const billingSuffix = billingPeriod === 'year' ? '/year' : '/month';

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
              {activePlans
                .filter(p => !userPlan || (userPlan === 'free' ? p.id !== 'free' : true))
                .map((plan, index) => {
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
                        
                        {/* Role Badge */}
                        {plan.role && (
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: plan.color }}
                            >
                              {plan.role.charAt(0).toUpperCase() + plan.role.slice(1)} Role
                            </span>
                            <span className="text-xs text-[#AAAAAA] font-medium">
                              Level {plan.level}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-[#AAAAAA] text-sm mb-4">{plan.description}</p>
                        <div className="mb-2 space-y-1">
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-4xl font-bold text-white">
                              {getPrice(plan)}
                            </span>
                          </div>
                          {savings ? (
                            <span className="ml-2 text-sm text-[#10b981]">
                              Save {savings}%
                            </span>
                          ) : null}
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
                        <div className="space-y-2 w-full">
                          <motion.button
                            type="button"
                            onClick={() => handleSubscribe(plan)}
                            disabled={payBusy(plan.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                              plan.popular
                                ? 'bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:from-[#CC0000] hover:to-[#AA0000]'
                                : 'bg-[#212121] hover:bg-[#333333]'
                            } flex items-center justify-center gap-2`}
                          >
                            {loading === `rzp:${plan.id}` ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                {plan.price === 0 ? 'Get Started' : 'Pay with Razorpay'}
                                <ArrowRight className="w-5 h-5" />
                              </>
                            )}
                          </motion.button>
                          {plan.price > 0 && (
                            <motion.button
                              type="button"
                              onClick={() => handleSubscribeStripe(plan)}
                              disabled={payBusy(plan.id)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full py-2.5 px-6 rounded-lg font-medium text-white border border-[#635bff] bg-[#635bff]/15 hover:bg-[#635bff]/25 flex items-center justify-center gap-2 text-sm"
                            >
                              {loading === `stripe:${plan.id}` ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Opening Stripe…
                                </>
                              ) : (
                                <>Pay with Stripe (card)</>
                              )}
                            </motion.button>
                          )}
                        </div>
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

            {/* Role Information Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-16"
            >
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Role Capabilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {[
                  {
                    role: 'User',
                    level: 1,
                    color: '#AAAAAA',
                    features: ['Upload Videos', 'Analyze Videos', 'View Analytics', 'AI Studio Access'],
                    plans: ['Free', 'Starter'],
                  },
                  {
                    role: 'Manager',
                    level: 2,
                    color: '#FF0000',
                    features: ['All User Features', 'Create Teams', 'Invite Members', 'Team Analytics'],
                    plans: ['Pro'],
                  },
                  {
                    role: 'Admin',
                    level: 3,
                    color: '#FFD700',
                    features: ['All Manager Features', 'Use API', 'API Keys', 'White-Label', 'Custom Models'],
                    plans: ['Enterprise', 'Custom'],
                  },
                ].map((roleInfo, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="bg-[#181818] border-2 rounded-xl p-6"
                    style={{ borderColor: roleInfo.color }}
                  >
                    <div className="mb-4">
                      <div className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white mb-2" style={{ backgroundColor: roleInfo.color }}>
                        Level {roleInfo.level}
                      </div>
                      <h3 className="text-xl font-bold text-white">{roleInfo.role}</h3>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-[#AAAAAA] text-xs font-semibold mb-2">Plans:</p>
                      <div className="flex flex-wrap gap-2">
                        {roleInfo.plans.map((plan) => (
                          <span key={plan} className="text-xs bg-[#212121] text-[#AAAAAA] px-2 py-1 rounded">
                            {plan}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[#AAAAAA] text-xs font-semibold mb-3">Features:</p>
                      <ul className="space-y-2">
                        {roleInfo.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: roleInfo.color }} />
                            <span className="text-[#AAAAAA] text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
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
