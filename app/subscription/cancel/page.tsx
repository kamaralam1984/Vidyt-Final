'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionCancel() {
  return (
    <DashboardLayout>
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#181818] border border-[#212121] rounded-2xl p-8 text-center shadow-2xl"
        >
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-red-500/20 p-4 rounded-full">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">Payment Cancelled</h1>
            <p className="text-[#AAAAAA]">
              The payment process was cancelled. No charges were made. If you encountered an issue, feel free to try again or contact support.
            </p>
            <div className="pt-6 space-y-3">
              <Link
                href="/pricing"
                className="w-full py-3 px-6 bg-[#FF0000] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#CC0000] transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </Link>
              <Link
                href="/dashboard"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
