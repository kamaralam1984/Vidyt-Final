'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import { Sparkles, Lock, Loader2, AlertCircle, Check, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!token) {
      setError('Invalid reset token');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put('/api/auth/password-reset', {
        token,
        newPassword: password,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#181818] border border-[#212121] rounded-xl p-8 shadow-lg text-center"
          >
            <AlertCircle className="w-12 h-12 text-[#ef4444] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
            <p className="text-[#AAAAAA] mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold"
            >
              Request New Reset Link
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-[#FF0000]" />
            <span className="text-3xl font-bold text-white">
              <span className="text-[#FF0000]">ViralBoost</span> AI
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
          <p className="text-[#AAAAAA]">Enter your new password below</p>
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
                <p className="text-[#10b981] text-sm font-semibold">Password reset successful!</p>
                <p className="text-[#10b981] text-xs mt-1">Redirecting to login...</p>
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
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-[#AAAAAA] mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
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
                    Resetting password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-[#AAAAAA] mb-4">
                Your password has been reset successfully!
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold"
              >
                Go to Login
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[#AAAAAA] hover:text-white transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
