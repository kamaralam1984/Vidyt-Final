'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams?.get('session_id');
  const gateway = searchParams?.get('gateway');
  const [loading, setLoading] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const isStripeSession =
      Boolean(sessionId) &&
      (gateway === 'stripe' || (sessionId as string).startsWith('cs_'));

    if (isStripeSession && sessionId) {
      (async () => {
        try {
          const token =
            typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          if (!token) {
            setVerifyError('Please log in again if your plan does not update automatically.');
            setLoading(false);
            return;
          }
          await axios.post(
            '/api/payments/stripe/verify-session',
            { sessionId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setVerifyError(null);
        } catch (e: any) {
          console.error('Stripe verify-session:', e);
          setVerifyError(
            e.response?.data?.error ||
              'We could not confirm the payment immediately. If you were charged, your plan usually activates within a minute (webhook).'
          );
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [sessionId, gateway]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#181818] border border-[#212121] rounded-2xl p-8 text-center shadow-2xl"
      >
        {loading ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-[#FF0000] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verifying Payment...</h1>
            <p className="text-[#AAAAAA]">
              We are almost there! Please wait while we confirm your subscription.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
            <p className="text-[#AAAAAA]">
              Your subscription is now active. Welcome to the premium club of ViralBoost AI!
            </p>
            {verifyError && (
              <p className="text-amber-400/90 text-sm border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/10">
                {verifyError}
              </p>
            )}
            <div className="pt-6 space-y-3">
              <Link
                href="/dashboard"
                className="w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#CC0000] transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/subscription"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors"
              >
                View subscription details
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SubscriptionSuccess() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#FF0000]" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </DashboardLayout>
  );
}
