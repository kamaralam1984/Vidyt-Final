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
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/auth/password-reset', { email });
      if (response.data.success) {
        setStep('OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await axios.put('/api/auth/password-reset', {
        email,
        otp,
        newPassword
      });

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Check if OTP is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo.png" alt="ViralBoost AI" className="h-72 w-auto object-contain mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
          <p className="text-[#AAAAAA]">
            {step === 'EMAIL' ? 'Enter your email to receive an OTP' : 'Enter the code and your new password'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#181818] border border-[#212121] rounded-xl p-8 shadow-lg">
          {success ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-[#10b981]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#10b981]" />
              </div>
              <h2 className="text-xl font-bold text-white">Password Updated!</h2>
              <p className="text-[#AAAAAA]">Your password has been reset successfully. You can now log in with your new password.</p>
              <Link href="/login" className="block w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold">
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-[#ef4444]/20 border border-[#ef4444] rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#ef4444]" />
                  <p className="text-[#ef4444] text-sm">{error}</p>
                </div>
              )}

              {step === 'EMAIL' ? (
                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg font-semibold flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                      placeholder="000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep('EMAIL')} className="w-1/3 py-3 px-4 bg-[#212121] text-white rounded-lg font-semibold">
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 px-6 bg-[#FF0000] text-white rounded-lg font-semibold flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </>
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
