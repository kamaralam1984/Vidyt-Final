'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Script from 'next/script';
import axios from 'axios';
import {
  Mail, Lock, User, Loader2, AlertCircle, Check, ArrowRight,
  Wifi, WifiOff, CheckCircle, XCircle, Building, Phone, Hash,
  Eye, EyeOff, Star, ChevronDown
} from 'lucide-react';
import { useLocale, SUPPORTED_LOCALES } from '@/context/LocaleContext';
import { computeSignupUsdCharge, convertUsdToCurrency } from '@/lib/paymentCurrencyShared';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
}

type SubscriptionType = 'trial' | 'paid';
type LoginMethod = 'uniqueIdPin' | 'emailPassword';

function AuthPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('uniqueIdPin');
  const { locale, setLocale } = useLocale();

  // Redirect /auth?mode=login to clean URL /login
  useEffect(() => {
    // `useSearchParams()` can be `null` during some SSR/build phases.
    if (pathname === '/auth' && searchParams?.get('mode') === 'login') {
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
    const mode = searchParams?.get('mode');
    if (mode === 'login') {
      setIsLogin(true);
    } else if (mode === 'signup') {
      setIsLogin(false);
    }
  }, [pathname, searchParams]);
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('trial');
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paidPlansState, setPaidPlansState] = useState<Plan[]>([]);
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
  /** OTP send/resend only — do not block "Verify & Pay" (was sharing `loading` and disabled the main button). */
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fxRates, setFxRates] = useState<Record<string, number> | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }

    // /login route shows login; /auth uses ?mode= param
    if (pathname === '/login') {
      setIsLogin(true);
    } else {
      const mode = searchParams?.get('mode');
      if (mode === 'login') setIsLogin(true);
      else if (mode === 'signup') setIsLogin(false);
    }

    axios.get('/api/subscriptions/plans').then(res => {
      const plans = res.data?.plans || [];
      const payPlans = plans.filter((p: any) => p.price > 0).map((p: any) => {
        let rawId = (p.id || p.dbId || p.name).toLowerCase();
        if (rawId.includes('starter')) rawId = 'starter';
        else if (rawId.includes('pro')) rawId = 'pro';
        else if (rawId.includes('enterprise')) rawId = 'enterprise';
        else if (rawId.includes('custom')) rawId = 'custom';
        else rawId = rawId.replace(/\s+/g, '-');

        return {
          id: rawId,
          name: p.name,
          price: p.price,
          period: p.interval || 'month',
          description: p.description || '',
          features: p.features || [],
          popular: rawId === 'pro'
        };
      });
      setPaidPlansState(payPlans);
    }).catch(err => console.error("Failed to load plans", err));

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

  useEffect(() => {
    fetch('/api/public/currency-rates')
      .then((r) => r.json())
      .then((d) => setFxRates(d.rates || null))
      .catch(() => setFxRates(null));
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[field];
      setFieldErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!isLogin) {
      if (!formData.name || formData.name.trim().length < 2) {
        errors.name = 'Full name must be at least 2 characters.';
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid work email address.';
      }
      if (!formData.password || formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
      } else if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
        errors.password = 'Include at least one uppercase letter and one number.';
      }
      if (subscriptionType === 'paid' && (!formData.companyName || formData.companyName.trim().length < 2)) {
        errors.companyName = 'Company name is required for paid plans.';
      }
      if (formData.phone && formData.phone.length !== locale.phoneLength) {
        errors.phone = `Phone number must be exactly ${locale.phoneLength} digits for ${locale.countryName}.`;
      }
    } else {
      if (loginMethod === 'uniqueIdPin') {
        if (!formData.uniqueId || formData.uniqueId.length !== 6) {
          errors.uniqueId = 'Enter your 6-digit Unique ID.';
        }
        if (!formData.loginPin || formData.loginPin.length < 4) {
          errors.loginPin = 'Enter your 4-6 digit PIN.';
        }
      } else {
        if (!formData.email) errors.email = 'Email is required.';
        if (!formData.password) errors.password = 'Password is required.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = () => {
    if (!formData.name || formData.name.length < 2) return false;
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
    if (!formData.password || formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) return false;
    if (subscriptionType === 'paid' && (!formData.companyName || formData.companyName.length < 2)) return false;
    return true;
  };

  const sendOTP = async () => {
    if (!validateForm()) {
      setError('Please fix the errors below before proceeding.');
      return;
    }

    setSendingOtp(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/prepare-signup', {
        ...formData,
        planId: subscriptionType === 'trial' ? 'free' : (selectedPlan?.id || 'free'),
        billingPeriod,
        currency: locale.currency,
        countryCode: locale.countryCode,
      });

      if (response.data.success) {
        setOtpSent(true);
        setSuccess('OTP sent to your email! Enter it below to proceed.');
        if (process.env.NODE_ENV === 'development' && response.data.otp) {
          console.log('OTP (Dev):', response.data.otp);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to prepare signup');
    } finally {
      setSendingOtp(false);
    }
  };

  const openRazorpay = (orderId: string, amount: number, currency: string, key: string) => {
    const options = {
      key,
      amount,
      currency,
      name: 'Vid YT',
      description: `${selectedPlan?.name || ''} Plan - ${billingPeriod === 'month' ? 'Monthly' : 'Yearly'}`,
      order_id: orderId,
      handler: async function (response: any) {
        try {
          setLoading(true);
          const verifyResponse = await axios.post(
            '/api/payments/verify-signup-payment',
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
          );
          if (verifyResponse.data.success) {
            localStorage.setItem('token', verifyResponse.data.token);
            if (verifyResponse.data.uniqueId) localStorage.setItem('uniqueId', verifyResponse.data.uniqueId);
            setSuccess(`Account Created Successfully! Your Unique ID: ${verifyResponse.data.uniqueId}`);
            setTimeout(() => {
              router.push(`/user/${verifyResponse.data.uniqueId}`);
            }, 3000);
          } else {
            setError('Payment verification failed');
            setLoading(false);
          }
        } catch (err: any) {
          setError(err.response?.data?.error || 'Payment verification failed');
          setLoading(false);
        }
      },
      prefill: { email: formData.email, name: formData.name },
      theme: { color: '#8B5CF6' },
      modal: {
        ondismiss: function () {
          setLoading(false);
          setError('Payment cancelled. You can retry by clicking Verify OTP & Pay again.');
        }
      }
    };
    try {
      // @ts-ignore
      const Rzp = window.Razorpay;
      if (!Rzp) {
        setError('Payment gateway failed to load. Refresh the page and try again.');
        setLoading(false);
        return;
      }
      if (!key || !orderId) {
        setError('Payment could not be started. Please try again.');
        setLoading(false);
        return;
      }
      const rzp = new Rzp(options);
      rzp.open();
      setLoading(false);
    } catch (e) {
      console.error('Razorpay open failed:', e);
      setError('Could not open payment window. Please try Verify OTP & Pay again.');
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
          if (!formData.uniqueId || !formData.loginPin) {
            setError('Please enter your 6-digit Unique ID and PIN');
            setLoading(false);
            return;
          }

          console.log('[Auth] Attempting PIN login for Unique ID:', formData.uniqueId);
          const response = await axios.post('/api/auth/login-pin', {
            uniqueId: formData.uniqueId,
            loginPin: formData.loginPin,
          });

          if (response.data.token && response.data.user.uniqueId) {
            console.log('[Auth] PIN login successful. Redirecting...');
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('uniqueId', response.data.user.uniqueId);
            
            const target = response.data.user?.role === 'super-admin' ? '/admin/super' : `/user/${response.data.user.uniqueId}`;
            console.log('[Auth] Redirecting to:', target);
            router.push(target);
          } else {
            console.error('[Auth] PIN login failed: missing token or uniqueId');
            setError('Login failed. Please check your credentials.');
            setLoading(false);
          }
        } else {
          if (!formData.email || !formData.password) {
            setError('Please enter your email and password');
            setLoading(false);
            return;
          }

          console.log('[Auth] Attempting email login for:', formData.email);
          const response = await axios.post('/api/auth/login', {
            email: formData.email,
            password: formData.password,
          });

          if (response.data.token) {
            console.log('[Auth] Email login successful. Redirecting...');
            localStorage.setItem('token', response.data.token);
            if (response.data.user?.uniqueId) {
              localStorage.setItem('uniqueId', response.data.user.uniqueId);
            }
            
            let target = '/dashboard';
            if (response.data.user?.role === 'super-admin') {
              target = '/admin/super';
            } else if (response.data.user?.uniqueId) {
              target = `/user/${response.data.user.uniqueId}`;
            }
            
            console.log('[Auth] Redirecting to:', target);
            router.push(target);
          } else {
            console.error('[Auth] Email login failed: missing token');
            setError('Login failed. Please check your credentials.');
            setLoading(false);
          }
        }
      } else {
        // Signup flow logic
        if (!isFormValid()) {
          setError('Please fill all required fields correctly.');
          setLoading(false);
          return;
        }

        if (otp.length !== 6) {
          setError('Please enter the 6-digit OTP to proceed.');
          setLoading(false);
          return;
        }

        console.log('[Auth] Verifying OTP for:', formData.email);
        const response = await axios.post('/api/auth/verify-and-pay', {
          email: formData.email,
          otp,
        });

        if (response.data.isFree) {
          console.log('[Auth] Signup successful (Free). Redirecting...');
          localStorage.setItem('token', response.data.token);
          if (response.data.uniqueId) localStorage.setItem('uniqueId', response.data.uniqueId);
          setSuccess(`Account created! Your Unique ID: ${response.data.uniqueId}. Please save this for login.`);
          setLoading(false);
          setTimeout(() => {
            router.push(`/user/${response.data.uniqueId}`);
          }, 3000);
        } else {
          console.log('[Auth] Signup successful (Paid). Opening Razorpay...');
          openRazorpay(response.data.orderId, response.data.amount, response.data.currency, response.data.key);
        }
      }
    } catch (err: any) {
      console.error('[Auth] Submit error:', err);
      setError(err.response?.data?.error || `${isLogin ? 'Login' : 'Registration'} failed`);
      setLoading(false);
    } finally {
      // In case of a hang in external calls (e.g. router.push never completing or throwing silently)
      // we add a safety timeout to reset loading if we're still on this page after 10 seconds.
      const timer = setTimeout(() => {
        if (loading) setLoading(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  };

  const getPrice = (plan: Plan) => {
    const priceMonthly = plan.price;
    const priceYearly = plan.price * 10;
    const usd = computeSignupUsdCharge({
      planId: plan.id,
      billingPeriod,
      priceMonthly,
      priceYearly,
    });
    const suffix = billingPeriod === 'year' ? '/year' : '/month';
    if (!fxRates || locale.currency === 'USD') {
      return `$${usd}${suffix}`;
    }
    const local = convertUsdToCurrency(usd, locale.currency, fxRates);
    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: locale.currency,
      maximumFractionDigits: 0,
    }).format(local);
    return `${formatted}${suffix} (~$${usd} USD)`;
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
            <img src="/Logo.png" alt="Vid YT" className="h-72 w-auto object-contain mx-auto" />
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
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMethod === 'uniqueIdPin'
                    ? 'bg-white text-[#0F0F0F]'
                    : 'text-white hover:bg-[#212121]'
                    }`}
                >
                  Unique ID + PIN
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('emailPassword')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMethod === 'emailPassword'
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
                        className={`w-full pl-10 pr-4 py-3 bg-[#212121] border ${fieldErrors.uniqueId ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
                        placeholder="e.g. 123456"
                      />
                    </div>
                    {fieldErrors.uniqueId && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.uniqueId}
                      </p>
                    )}
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
                        className={`w-full pl-10 pr-4 py-3 bg-[#212121] border ${fieldErrors.loginPin ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
                        placeholder="••••"
                      />
                    </div>
                    {fieldErrors.loginPin && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.loginPin}
                      </p>
                    )}
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
                        className={`w-full pl-10 pr-4 py-3 bg-[#212121] border ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                      </p>
                    )}
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
                        className={`w-full pl-10 pr-11 py-3 bg-[#212121] border ${fieldErrors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
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
                type="button"
                onClick={() => {
                  setSubscriptionType('trial');
                  setSelectedPlan(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${subscriptionType === 'trial'
                  ? 'bg-white text-[#0F0F0F]'
                  : 'text-white hover:bg-[#212121]'
                  }`}
              >
                Free 7-day Trial
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubscriptionType('paid');
                  setSelectedPlan(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${subscriptionType === 'paid'
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
                <div className="flex items-center justify-center gap-4 mb-8">
                  <span className={`text-sm ${billingPeriod === 'month' ? 'text-white' : 'text-[#AAAAAA]'}`}>
                    Monthly
                  </span>
                  <button
                    type="button"
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
                    {billingPeriod === 'year' && (
                      <span className="ml-2 px-2 py-1 bg-[#FF0000]/20 text-[#FF0000] rounded text-xs font-semibold">
                        Save up to 17%
                      </span>
                    )}
                  </span>
                </div>

                {/* Enhanced Plan Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {paidPlansState.map((plan, index) => (
                    <motion.button
                      type="button"
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative rounded-xl border-2 transition-all text-left ${selectedPlan?.id === plan.id
                        ? 'border-[#FF0000] bg-[#FF0000]/10'
                        : 'border-[#333333] bg-[#212121] hover:border-[#FF0000]'
                        }`}
                    >
                      {plan.popular && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
                        >
                          <div className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                            <Star className="w-4 h-4 fill-white" />
                            Most Popular
                          </div>
                        </motion.div>
                      )}

                      <div className={`p-6 ${plan.popular ? 'pt-8' : ''} flex flex-col h-full`}>
                        {/* Header */}
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                          <p className="text-[#AAAAAA] text-sm mb-4">{plan.description}</p>
                          <div className="flex items-baseline justify-center gap-2 mb-2">
                            <span className="text-4xl font-bold text-white">
                              {getPrice(plan)}
                            </span>
                          </div>
                        </div>

                        {/* Features List */}
                        {plan.features && plan.features.length > 0 && (
                          <>
                            <div className="text-xs text-[#AAAAAA] text-center mb-3 pb-3 border-b border-[#333333]">
                              <span className="font-semibold text-white">{plan.features.length}</span> features included
                            </div>
                            <ul className="space-y-3 mb-6 max-h-80 overflow-y-auto flex-1">
                              {plan.features.map((feature, featureIndex) => (
                                <motion.li
                                  key={featureIndex}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.05 * featureIndex }}
                                  className="flex items-start gap-3"
                                >
                                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                                  <span className="text-[#AAAAAA] text-sm">{feature}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </>
                        )}

                        {/* Selection Indicator */}
                        {selectedPlan?.id === plan.id && (
                          <div className="flex items-center justify-center gap-2 p-3 bg-[#FF0000]/20 rounded-lg border border-[#FF0000]">
                            <CheckCircle className="w-5 h-5 text-[#FF0000]" />
                            <span className="text-white text-sm font-semibold">Selected</span>
                          </div>
                        )}
                      </div>
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    className={`w-full pl-10 pr-4 py-3 bg-[#212121] border ${fieldErrors.companyName ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
                    placeholder="Acme Corp"
                  />
                </div>
                {fieldErrors.companyName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.companyName}
                  </p>
                )}
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
                    className={`w-full pl-10 pr-4 py-3 bg-[#212121] border ${fieldErrors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
                    placeholder="John Doe"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.name}
                  </p>
                )}
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
                    className={`w-full pl-10 pr-4 py-3 bg-[#212121] border ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
                    placeholder="you@example.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                  </p>
                )}
                <p className="text-xs text-[#AAAAAA] mt-1">Required. Valid email address.</p>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-white mb-2">
                  Country &amp; Phone (Optional)
                </label>
                <div className="flex gap-2">
                  {/* Country Selector Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCountryMenuOpen(!countryMenuOpen)}
                      className="flex items-center gap-2 h-[50px] px-3 bg-[#212121] border border-[#333333] rounded-lg text-white hover:border-[#FF0000] transition-colors"
                    >
                      <span className="text-xl leading-none">{locale.flag}</span>
                      <span className="text-xs font-medium text-[#AAAAAA]">{locale.phoneCode}</span>
                      <ChevronDown className={`w-4 h-4 text-[#AAAAAA] transition-transform ${countryMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Country List Dropdown */}
                    <AnimatePresence>
                      {countryMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 mt-2 w-64 max-h-64 overflow-y-auto bg-[#181818] border border-[#333333] rounded-xl shadow-2xl z-50 py-2 scrollbar-thin scrollbar-thumb-[#333333]"
                        >
                          {SUPPORTED_LOCALES.map((opt) => (
                            <button
                              key={opt.countryCode}
                              type="button"
                              onClick={() => {
                                setLocale(opt);
                                setCountryMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#212121] transition-colors ${opt.countryCode === locale.countryCode ? 'bg-[#FF0000]/10' : ''
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl leading-none">{opt.flag}</span>
                                <div className="text-left">
                                  <div className="text-sm font-medium text-white">{opt.countryName}</div>
                                  <div className="text-[10px] text-[#AAAAAA] uppercase">{opt.currency} · {opt.language}</div>
                                </div>
                              </div>
                              <div className="text-xs font-mono text-[#AAAAAA]">{opt.phoneCode}</div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Phone Input */}
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                      maxLength={locale.phoneLength}
                      className={`w-full pl-10 pr-4 py-3 bg-[#212121] border ${fieldErrors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
                      placeholder={"X".repeat(locale.phoneLength)}
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#AAAAAA] mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 bg-[#FF0000] rounded-full"></span>
                  Selected: {locale.countryName} ({locale.currency}). Phone autofill: {locale.phoneCode}
                </p>
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
                    className={`w-full pl-10 pr-11 py-3 bg-[#212121] border ${fieldErrors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-[#333333]'} rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] transition-all`}
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
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                  </p>
                )}
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
              {/* Email OTP for all signups */}
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
                    onClick={() => void sendOTP()}
                    disabled={sendingOtp || !isFormValid()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 min-w-[7rem]"
                  >
                    {sendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : otpSent ? (
                      'Resend'
                    ) : (
                      'Send OTP'
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={
                  loading ||
                  otp.length !== 6 ||
                  !isFormValid() ||
                  (subscriptionType === 'paid' && !selectedPlan)
                }
                onClick={() =>
                  void handleSubmit({ preventDefault: () => { } } as unknown as React.FormEvent)
                }
                className="w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {subscriptionType === 'paid' ? 'Processing Payment...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {subscriptionType === 'trial' ? 'Create Free Account' : 'Verify OTP & Pay'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
