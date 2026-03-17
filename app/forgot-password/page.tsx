'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import { Mail, Loader2, AlertCircle, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    // Check database connection status
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await axios.post('/api/auth/password-reset', {
        email,
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block mb-4">
            <img src="/logo.png" alt="ViralBoost AI" className="h-72 w-auto object-contain mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
          <p className="text-[#AAAAAA]">Enter your email to receive a password reset link</p>

          {/* Database Status Indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex items-center justify-center gap-2"
          >
            {dbStatus === 'checking' ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#f59e0b]" />
            ) : dbStatus === 'connected' ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-[#10b981] rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-[#10b981] rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-xs text-[#10b981] font-medium">Database Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#ef4444] rounded-full"></div>
                <span className="text-xs text-[#ef4444] font-medium">Database Disconnected</span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Reset Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#181818] border border-[#212121] rounded-xl p-8 shadow-lg"
        >
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-[#10b981]/20 border border-[#10b981] rounded-lg flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-[#10b981]" />
              <div>
                <p className="text-[#10b981] text-sm font-semibold">Reset link sent!</p>
                <p className="text-[#10b981] text-xs mt-1">
                  Check your email for password reset instructions.
                </p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-[#ef4444]/20 border border-[#ef4444] rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-[#ef4444]" />
              <p className="text-[#ef4444] text-sm">{error}</p>
            </motion.div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
                <p className="text-xs text-[#AAAAAA] mt-2">
                  We&apos;ll send you a link to reset your password
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[#212121] rounded-lg">
                <p className="text-[#AAAAAA] text-sm">
                  If an account exists with this email, you&apos;ll receive password reset instructions shortly.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full py-3 px-6 bg-[#212121] text-white rounded-lg hover:bg-[#333333] transition-colors font-semibold text-center flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-[#AAAAAA] text-sm">
              Remember your password?{' '}
              <Link href="/login" className="text-[#FF0000] hover:text-[#CC0000] font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center"
        >
          <Link
            href="/"
            className="text-[#AAAAAA] hover:text-white text-sm transition-colors inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
