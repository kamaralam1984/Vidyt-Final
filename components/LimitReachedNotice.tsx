'use client';

import Link from 'next/link';
import { Lock, Zap, RefreshCw } from 'lucide-react';
import type { LimitReachedInfo } from '@/lib/limitReachedClient';

interface Props {
  info: LimitReachedInfo;
  featureLabel?: string;
  onRetry?: () => void;
}

const periodWord = (p?: string) =>
  p === 'day' ? 'daily' : p === 'week' ? 'weekly' : p === 'month' ? 'monthly' : p === 'lifetime' ? 'lifetime' : 'daily';

export default function LimitReachedNotice({ info, featureLabel, onRetry }: Props) {
  const label = featureLabel || (info.feature ? info.feature.replace(/_/g, ' ') : 'this feature');
  const period = periodWord(info.period);
  const usedFraction =
    typeof info.limit === 'number' && info.limit > 0
      ? `${info.current ?? info.limit}/${info.limit}`
      : '';

  return (
    <div className="bg-gradient-to-br from-red-500/10 via-orange-500/5 to-purple-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 rounded-full bg-red-500/20 mx-auto mb-4 flex items-center justify-center">
        <Lock className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-2xl font-black text-white mb-2">Limit Reached</h3>
      <p className="text-[#CCC] text-sm mb-1">
        Your {period} <span className="font-bold text-white capitalize">{label}</span> limit is exhausted
        {usedFraction && <span className="text-[#888]"> ({usedFraction})</span>}.
      </p>
      <p className="text-[#888] text-xs mb-6">Upgrade your plan to keep generating results.</p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-red-500 hover:from-purple-700 hover:to-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition"
        >
          <Zap className="w-4 h-4" /> Upgrade Plan
        </Link>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-[#333] hover:border-[#555] text-[#CCC] rounded-xl font-medium text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        )}
      </div>
    </div>
  );
}
