'use client';

/**
 * ReferralCard — viral growth component.
 * Place in Dashboard to let users share their referral link.
 * Shows earned bonus credits and pending referrals.
 *
 * Usage: <ReferralCard />
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Users, Zap } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import { trackEvent } from './TrackingScript';

interface ReferralData {
  code: string;
  link: string;
  credited: number;
  pending: number;
  totalBonus: number;
}

export default function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) { setLoading(false); return; }

    fetch('/api/referral', { headers })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      trackEvent('referral_link_copied', { code: data.code });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (!data) return;
    trackEvent('referral_share_clicked', { code: data.code });
    if (navigator.share) {
      await navigator.share({
        title: 'Try VidYT — AI YouTube SEO',
        text: `Grow your YouTube channel with AI! Use my link to get 5 bonus analyses free: ${data.link}`,
        url: data.link,
      });
    } else {
      handleCopy();
    }
  };

  if (loading) return null;
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#181818] to-[#1a1218] border border-[#FF0000]/20 rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[#FF0000]/10 flex items-center justify-center flex-shrink-0">
          <Gift className="w-4 h-4 text-[#FF0000]" />
        </div>
        <div>
          <p className="text-white text-sm font-bold">Refer & Earn</p>
          <p className="text-[#717171] text-xs">Give 5 bonus analyses, get 5 for yourself</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0F0F0F] rounded-xl p-3 text-center">
          <p className="text-[#FF0000] text-xl font-black">{data.credited}</p>
          <p className="text-[#717171] text-xs mt-0.5 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Referred
          </p>
        </div>
        <div className="bg-[#0F0F0F] rounded-xl p-3 text-center">
          <p className="text-[#2BA640] text-xl font-black">+{data.totalBonus}</p>
          <p className="text-[#717171] text-xs mt-0.5 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" /> Bonus earned
          </p>
        </div>
      </div>

      {/* Link */}
      <div className="bg-[#0F0F0F] border border-[#212121] rounded-xl px-3 py-2 flex items-center gap-2 mb-3">
        <p className="text-[#AAAAAA] text-xs flex-1 truncate">{data.link}</p>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-[#181818] hover:bg-[#212121] transition flex-shrink-0"
          title="Copy link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#2BA640]" /> : <Copy className="w-3.5 h-3.5 text-[#717171]" />}
        </button>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/20 text-[#FF0000] rounded-xl text-sm font-semibold transition"
      >
        <Share2 className="w-4 h-4" />
        Share your link
      </button>
    </motion.div>
  );
}
