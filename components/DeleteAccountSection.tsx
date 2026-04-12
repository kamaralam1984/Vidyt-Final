'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

export default function DeleteAccountSection() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'verifying' | 'completed'>('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestDeletion = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        '/api/user/delete-account',
        { action: 'request' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.requiresVerification) {
        setStep('verifying');
        setSuccess('Verification code sent to your email. Valid for 24 hours.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate deletion request');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        '/api/user/delete-account',
        { action: 'confirm', verificationCode },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.deleted) {
        setStep('completed');
        setSuccess('Your account has been permanently deleted.');
        // Redirect after 3 seconds
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('uniqueId');
          window.location.href = '/auth';
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm deletion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-red-500/20 rounded-lg flex-shrink-0">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Delete My Account</h3>
          <p className="text-sm text-[#AAAAAA]">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {step === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400 mb-1">⚠ Warning</p>
                  <p className="text-xs text-red-300">
                    Deleting your account will permanently remove all videos, analytics, settings, and connected accounts. This process cannot be reversed.
                  </p>
                </div>
              </div>
            </div>

            <motion.button
              onClick={() => setStep('confirm')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Delete My Account
            </motion.button>
          </motion.div>
        )}

        {/* CONFIRMATION STATE */}
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="space-y-4 mb-6">
              <p className="text-sm text-[#AAAAAA]">
                To confirm deletion, please type <span className="font-semibold text-white">DELETE</span> in the box below:
              </p>
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-red-500"
                onChange={(e) => {
                  if (e.target.value === 'DELETE') {
                    setError('');
                  }
                }}
              />
              <p className="text-xs text-[#888]">
                Your account will be permanently deleted. You will receive a verification code via email to confirm this action.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="flex gap-3">
              <motion.button
                onClick={() => {
                  setStep('idle');
                  setError('');
                  setVerificationCode('');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 border border-[#333333] text-white rounded-lg hover:bg-[#212121] transition font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleRequestDeletion}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* VERIFICATION STATE */}
        {step === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-300">
                ✓ Verification code sent to your registered email. Valid for 24 hours.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-white">
                Enter Verification Code
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-red-500 text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-[#888]">
                Check your email for the verification code. If you don&apos;t see it, check your spam folder.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="flex gap-3">
              <motion.button
                onClick={() => {
                  setStep('idle');
                  setError('');
                  setSuccess('');
                  setVerificationCode('');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 border border-[#333333] text-white rounded-lg hover:bg-[#212121] transition font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleConfirmDeletion}
                disabled={loading || verificationCode.length !== 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Deletion'
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* COMPLETION STATE */}
        {step === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-500" />
            </motion.div>
            <h4 className="text-lg font-semibold text-white mb-2">Account Deleted</h4>
            <p className="text-sm text-[#AAAAAA] mb-4">
              Your account and all associated data have been permanently deleted. You will be redirected to the login page.
            </p>
            <div className="flex items-center justify-center gap-1 text-xs text-[#888]">
              <Loader2 className="w-3 h-3 animate-spin" />
              Redirecting in 3 seconds...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
