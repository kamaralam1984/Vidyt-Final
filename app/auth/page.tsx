'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Script from 'next/script';
import axios from 'axios';
import { 
  Mail, Lock, User, Loader2, AlertCircle, Check, ArrowRight, 
  Wifi, WifiOff, CheckCircle, XCircle, Building, Phone, Hash,
  Eye, EyeOff
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
}

const paidPlans: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 5,
    period: 'month',
    description: 'For serious creators',
    popular: true,
    features: [
      'Unlimited video analyses',
      'Advanced AI viral prediction',
      'Real-time trend analysis',
      'Title optimization (10 suggestions)',
      'Hashtag generator (20 hashtags)',
      'Best posting time predictions',
      'Competitor analysis',
      'Email support',
      'Priority processing',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 12,
    period: 'month',
    description: 'For agencies and teams',
    features: [
      'Everything in Pro',
      'Team collaboration (up to 10 users)',
      'White-label reports',
      'API access',
      'Custom AI model training',
      'Dedicated account manager',
      '24/7 priority support',
      'Advanced analytics dashboard',
      'Bulk video processing',
      'Custom integrations',
    ],
  },
];

type SubscriptionType = 'trial' | 'paid';
type LoginMethod = 'uniqueIdPin' | 'emailPassword';

export default function AuthPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('uniqueIdPin');

  // Redirect /auth?mode=login to clean URL /login
  useEffect(() => {
    if (pathname === '/auth' && searchParams.get('mode') === 'login') {
      router.replace('/login');
      return;
    }
  }, [pathname, searchParams, router]);

  useEffect(() => {
    // /login route shows login; /auth uses ?mode= param or defaults to signup
    if (pathname === '/login') {
      setIsLogin(true);
      return;
    }
    const mode = searchParams.get('mode');
    if (mode === 'login') {
      setIsLogin(true);
    } else if (mode === 'signup') {
      setIsLogin(false);
    }
  }, [pathname, searchParams]);
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('trial');
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    loginPin: '',
    uniqueId: '', // For login
  });
  
  // OTP
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }

    // /login route shows login; /auth uses ?mode= param
    if (pathname === '/login') {
      setIsLogin(true);
    } else {
      const mode = searchParams.get('mode');
      if (mode === 'login') setIsLogin(true);
      else if (mode === 'signup') setIsLogin(false);
    }

    const checkDbStatus = async () => {
      try {
        const response = await fetch('/api/health/db');
        if (response.ok) {
          setDbStatus('connected');
        } else {
          setDbStatus('disconnected');
        }
      } catch (error) {
        setDbStatus('disconnected');
      }
    };

    checkDbStatus();
    const interval = setInterval(checkDbStatus, 5000);
    return () => clearInterval(interval);
  }, [router, pathname]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/auth/send-otp', {
        email: formData.email,
      });

      if (response.data.success) {
        setOtpSent(true);
        setSuccess('OTP sent to your email!');
        if (process.env.NODE_ENV === 'development' && response.data.otp) {
          console.log('OTP (Dev):', response.data.otp);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        if (loginMethod === 'uniqueIdPin') {
          // Login with Unique ID + PIN
          if (!formData.uniqueId || !formData.loginPin) {
            setError('Please enter your 6-digit Unique ID and PIN');
            setLoading(false);
            return;
          }

          const response = await axios.post('/api/auth/login-pin', {
            uniqueId: formData.uniqueId,
            loginPin: formData.loginPin,
          });

          if (response.data.token && response.data.user.uniqueId) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('uniqueId', response.data.user.uniqueId);
            if (response.data.user?.role === 'super-admin') {
              router.push('/dashboard/super');
            } else {
              router.push(`/user/${response.data.user.uniqueId}`);
            }
          }
        } else {
          // Login with Email + Password
          if (!formData.email || !formData.password) {
            setError('Please enter your email and password');
            setLoading(false);
            return;
          }

          const response = await axios.post('/api/auth/login', {
            email: formData.email,
            password: formData.password,
          });

          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            if (response.data.user?.uniqueId) {
              localStorage.setItem('uniqueId', response.data.user.uniqueId);
            }
            if (response.data.user?.role === 'super-admin') {
              router.push('/dashboard/super');
            } else if (response.data.user?.uniqueId) {
              router.push(`/user/${response.data.user.uniqueId}`);
            } else {
              router.push('/dashboard');
            }
          }
        }
      } else {
        // Signup flow (both trial and paid require email OTP verification first)
        if (!otpSent) {
          setError('Please verify your email with OTP first');
          setLoading(false);
          return;
        }

        // Verify OTP first
        if (otp.length !== 6) {
          setError('Please enter 6-digit OTP');
          setLoading(false);
          return;
        }

        try {
          const otpResponse = await axios.post('/api/auth/verify-otp', {
            email: formData.email,
            otp,
          });

          if (!otpResponse.data.success) {
            setError('Invalid OTP');
            setLoading(false);
            return;
          }
        } catch (err: any) {
          setError(err.response?.data?.error || 'Invalid OTP');
          setLoading(false);
          return;
        }

        // Register user
        const response = await axios.post('/api/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName || undefined,
          phone: formData.phone || undefined,
          loginPin: formData.loginPin || undefined,
        });

        if (response.data.token && response.data.uniqueId) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('uniqueId', response.data.uniqueId);
          
          // Show success with unique ID
          setSuccess(`Account created! Your Unique ID: ${response.data.uniqueId}. Please save this for login.`);

          if (subscriptionType === 'trial') {
            // Activate free trial
            const trialResponse = await axios.post(
              '/api/payments/create-order',
              { planId: 'free', billingPeriod: 'month' },
              { headers: { Authorization: `Bearer ${response.data.token}` } }
            );

            if (trialResponse.data.success) {
              setTimeout(() => {
                router.push(`/user/${response.data.uniqueId}`);
              }, 2000);
            }
          } else if (subscriptionType === 'paid' && selectedPlan) {
            // Proceed to payment
            handlePayment(response.data.token, response.data.uniqueId);
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (token: string, uniqueId?: string) => {
    if (!selectedPlan) return;

    setLoading(true);
    setError('');

    try {
      const orderResponse = await axios.post(
        '/api/payments/create-order',
        {
          planId: selectedPlan.id,
          billingPeriod: billingPeriod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (orderResponse.data.orderId) {
        const checkRazorpay = setInterval(() => {
          // @ts-ignore
          if (window.Razorpay) {
            clearInterval(checkRazorpay);
            
            const options = {
              key: orderResponse.data.key,
              amount: orderResponse.data.amount,
              currency: orderResponse.data.currency,
              name: 'ViralBoost AI',
              description: `${selectedPlan.name} Plan - ${billingPeriod === 'month' ? 'Monthly' : 'Yearly'}`,
              order_id: orderResponse.data.orderId,
              handler: async function (response: any) {
                try {
                  const verifyResponse = await axios.post(
                    '/api/payments/verify-payment',
                    {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  if (verifyResponse.data.success && uniqueId) {
                    router.push(`/user/${uniqueId}`);
                  } else {
                    setError('Payment verification failed');
                  }
                } catch (err: any) {
                  setError(err.response?.data?.error || 'Payment verification failed');
                }
              },
              prefill: {
                email: formData.email,
                name: formData.name,
              },
              theme: {
                color: '#8B5CF6',
              },
            };

            // @ts-ignore
            const razorpay = new window.Razorpay(options);
            razorpay.open();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkRazorpay);
          if (!(window as any).Razorpay) {
            setError('Failed to load payment gateway. Please refresh the page.');
          }
        }, 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (plan: Plan) => {
    const yearlyPrices: Record<string, number> = {
      pro: 25,
      enterprise: 50,
    };
    const price = billingPeriod === 'year' ? yearlyPrices[plan.id] : plan.price;
    return `$${price}${billingPeriod === 'year' ? '/year' : '/month'}`;
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block mb-6">
            <img src="/logo.png" alt="ViralBoost AI" className="h-12 w-auto object-contain mx-auto" />
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isLogin ? 'Sign In' : 'Create your account'}
          </h1>
          {!isLogin && (
            <p className="text-[#AAAAAA]">Start your journey to viral content</p>
          )}
          
          {/* Database Status */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {dbStatus === 'checking' ? (
              <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
            ) : dbStatus === 'connected' ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Database Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400 font-medium">Database Disconnected</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Login Form */}
        {isLogin ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#181818] border border-[#212121] rounded-2xl p-8 shadow-2xl"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-200 text-sm">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-200 text-sm">{success}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Login method toggle */}
              <div className="flex gap-2 mb-4 bg-[#212121] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLoginMethod('uniqueIdPin')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginMethod === 'uniqueIdPin'
                      ? 'bg-white text-[#0F0F0F]'
                      : 'text-white hover:bg-[#212121]'
                  }`}
                >
                  Unique ID + PIN
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('emailPassword')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginMethod === 'emailPassword'
                      ? 'bg-white text-[#0F0F0F]'
                      : 'text-white hover:bg-[#212121]'
                  }`}
                >
                  Email + Password
                </button>
              </div>

              {/* Unique ID + PIN fields */}
              {loginMethod === 'uniqueIdPin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Unique ID (6 digits) *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                      <input
                        type="text"
                        value={formData.uniqueId}
                        onChange={(e) =>
                          handleInputChange(
                            'uniqueId',
                            e.target.value.replace(/\D/g, '').slice(0, 6)
                          )
                        }
                        className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                        placeholder="e.g. 123456"
                      />
                    </div>
                    <p className="text-xs text-[#AAAAAA] mt-1">
                      Enter the 6-digit Unique ID you received during signup.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      PIN Number *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                      <input
                        type="password"
                        value={formData.loginPin}
                        onChange={(e) =>
                          handleInputChange(
                            'loginPin',
                            e.target.value.replace(/\D/g, '').slice(0, 6)
                          )
                        }
                        maxLength={6}
                        className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                        placeholder="••••"
                      />
                    </div>
                    <p className="text-xs text-[#AAAAAA] mt-1">
                      PIN works only with your Unique ID (4-6 digits).
                    </p>
                  </div>
                </>
              )}

              {/* Email + Password fields */}
              {loginMethod === 'emailPassword' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full pl-10 pr-11 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-white p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[#AAAAAA] hover:text-[#FF0000] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#AAAAAA] text-sm">
                Don&apos;t have an account?{' '}
                {pathname === '/login' ? (
                  <Link href="/auth" className="text-white font-semibold hover:underline">
                    Sign Up
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-white font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                )}
              </p>
            </div>
          </motion.div>
        ) : (
          /* Signup Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#181818] border border-[#212121] rounded-2xl p-8 shadow-2xl"
          >
            {/* Subscription Type Tabs */}
            <div className="flex gap-2 mb-6 bg-[#212121] p-1 rounded-lg">
              <button
                onClick={() => {
                  setSubscriptionType('trial');
                  setSelectedPlan(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  subscriptionType === 'trial'
                    ? 'bg-white text-[#0F0F0F]'
                    : 'text-white hover:bg-[#212121]'
                }`}
              >
                Free 7-day Trial
              </button>
              <button
                onClick={() => {
                  setSubscriptionType('paid');
                  setSelectedPlan(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  subscriptionType === 'paid'
                    ? 'bg-white text-[#0F0F0F]'
                    : 'text-white hover:bg-[#212121]'
                }`}
              >
                Paid Subscription
              </button>
            </div>

            {/* Paid Plans Selection */}
            {subscriptionType === 'paid' && (
              <div className="mb-6">
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className={`text-sm ${billingPeriod === 'month' ? 'text-white' : 'text-[#AAAAAA]'}`}>
                    Monthly
                  </span>
                  <button
                    onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
                    className="relative w-14 h-7 bg-[#212121] rounded-full p-1 transition-colors"
                  >
                    <motion.div
                      animate={{ x: billingPeriod === 'year' ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 bg-[#FF0000] rounded-full absolute"
                    />
                  </button>
                  <span className={`text-sm ${billingPeriod === 'year' ? 'text-white' : 'text-[#AAAAAA]'}`}>
                    Yearly
                  </span>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {paidPlans.map((plan) => (
                    <motion.button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        selectedPlan?.id === plan.id
                          ? 'border-[#FF0000] bg-[#FF0000]/20'
                          : 'border-[#333333] bg-[#212121] hover:border-[#FF0000]'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 right-2 bg-[#FF0000] text-white text-xs px-2 py-1 rounded-full">
                          Most Popular
                        </div>
                      )}
                      {selectedPlan?.id === plan.id && (
                        <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-[#FF0000]" />
                      )}
                      <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-2xl font-bold text-white mb-2">{getPrice(plan)}</p>
                      <p className="text-xs text-[#AAAAAA]">{plan.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3"
              >
                <XCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-200 text-sm">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-200 text-sm">{success}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Company Name {subscriptionType === 'paid' && '*'}
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required={subscriptionType === 'paid'}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="Acme Corp"
                  />
                </div>
                <p className="text-xs text-[#AAAAAA] mt-1">
                  {subscriptionType === 'paid' ? 'Required. 2-100 characters.' : 'Optional'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="John Doe"
                  />
                </div>
                <p className="text-xs text-[#AAAAAA] mt-1">Required. 2-100 characters.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="you@example.com"
                  />
                </div>
                <p className="text-xs text-[#AAAAAA] mt-1">Required. Valid email address.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="+91 9876543210"
                  />
                </div>
                <p className="text-xs text-[#AAAAAA] mt-1">Include country code, e.g. +91 9876543210.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="w-full pl-10 pr-11 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-white p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-[#AAAAAA] mt-1">
                  Required. Format: at least 8 characters, one uppercase letter, and one number.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Login PIN (Optional)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    type="text"
                    value={formData.loginPin}
                    onChange={(e) => handleInputChange('loginPin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="4-6 digits for quick login"
                  />
                </div>
                <p className="text-xs text-[#AAAAAA] mt-1">
                  Optional. 4-6 digits. Use with company code for quick PIN login later.
                </p>
              </div>

              {/* Email OTP for Paid Plans */}
              {subscriptionType === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email OTP
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="w-full px-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                        placeholder="Enter 6-digit code"
                      />
                    </div>
                    <motion.button
                      type="button"
                      onClick={sendOTP}
                      disabled={loading || otpSent}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] font-semibold disabled:opacity-50"
                    >
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || (subscriptionType === 'paid' && !selectedPlan)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {subscriptionType === 'paid' ? 'Processing...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {subscriptionType === 'trial' ? 'Create Free Account' : 'Verify OTP & Pay'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              {/* Benefits */}
              {subscriptionType === 'trial' && (
                <div className="space-y-2 mt-4">
                  {['Free 7-day trial', 'No credit card required', 'Cancel anytime'].map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-green-300">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              )}

              {subscriptionType === 'paid' && selectedPlan && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-[#AAAAAA] text-center">
                    You&apos;ll be charged {getPrice(selectedPlan)} for the {selectedPlan.name} plan via Razorpay.
                  </p>
                  {[
                    'Instant activation after payment',
                    'Secure payments via Razorpay',
                    'GST invoice available on request',
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-green-300">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#AAAAAA] text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-white font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Razorpay Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}
