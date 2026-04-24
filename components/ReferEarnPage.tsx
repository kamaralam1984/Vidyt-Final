'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Copy, Check, Share2, Users, Zap, Link2,
  ChevronRight, Trophy, Star, Info, ArrowRight,
} from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import { trackEvent } from './TrackingScript';

interface ReferralData {
  code: string;
  link: string;
  credited: number;
  pending: number;
  totalBonus: number;
  bonusAnalyses: number;
}

const BONUS_PER_REFERRAL = 5;

const steps = [
  {
    icon: Link2,
    title: 'Copy your link',
    desc: 'Get your unique referral link from this page.',
  },
  {
    icon: Share2,
    title: 'Share with friends',
    desc: 'Send it on WhatsApp, Instagram, YouTube community — anywhere!',
  },
  {
    icon: Users,
    title: 'They sign up',
    desc: 'Your friend creates a free account using your link.',
  },
  {
    icon: Zap,
    title: 'Both earn 5 analyses',
    desc: 'You get +5 bonus analyses. They get +5 too. No expiry!',
  },
];

export default function ReferEarnPage() {
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
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleShare = async () => {
    if (!data) return;
    trackEvent('referral_share_clicked', { code: data.code });
    const shareText = `Grow your YouTube channel with AI! Use my VidYT link and get 5 FREE bonus analyses: ${data.link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Try VidYT — AI YouTube SEO', text: shareText, url: data.link });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const shareWhatsApp = () => {
    if (!data) return;
    trackEvent('referral_whatsapp_share', { code: data.code });
    const text = encodeURIComponent(`Hey! Try VidYT — it uses AI to grow YouTube channels. Sign up with my link and we BOTH get 5 bonus analyses free!\n\n${data.link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0000] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden border border-[#FF0000]/20 p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #181818 0%, #1a0f0f 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,0,0,0.08) 0%, transparent 70%)',
        }} />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-[#FF0000]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Refer &amp; Earn</h1>
          <p className="text-[#AAAAAA] text-base max-w-md mx-auto">
            Invite friends to VidYT. You both get <span className="text-white font-bold">+{BONUS_PER_REFERRAL} free analyses</span> for every successful signup — no limit on referrals!
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Referred', value: data.credited, icon: Users, color: '#FF0000' },
            { label: 'Pending', value: data.pending, icon: Star, color: '#F59E0B' },
            { label: 'Bonus analyses', value: `+${data.bonusAnalyses}`, icon: Zap, color: '#2BA640' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#111] border border-[#212121] rounded-2xl p-4 text-center">
                <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-[#717171] text-xs mt-1">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Link section */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111] border border-[#212121] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-4 h-4 text-[#FF0000]" />
            <p className="text-white text-sm font-semibold">Your referral link</p>
          </div>

          {/* Code badge */}
          <div className="flex items-center gap-3">
            <div className="bg-[#0F0F0F] border border-[#FF0000]/30 rounded-xl px-4 py-2 inline-flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#FF0000]" />
              <span className="text-[#FF0000] font-mono font-bold tracking-widest text-sm">{data.code}</span>
            </div>
          </div>

          {/* Full link + copy */}
          <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#212121] rounded-xl px-4 py-3">
            <p className="text-[#AAAAAA] text-sm flex-1 truncate">{data.link}</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#212121] transition text-sm font-medium flex-shrink-0"
              style={{ color: copied ? '#2BA640' : '#AAAAAA' }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/20 text-[#FF0000] rounded-xl text-sm font-semibold transition"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={shareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] rounded-xl text-sm font-semibold transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.553 4.118 1.522 5.854L0 24l6.338-1.502A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.017-1.378l-.36-.214-3.727.883.936-3.619-.235-.372A9.787 9.787 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/>
              </svg>
              WhatsApp
            </button>
          </div>
        </motion.div>
      )}

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#111] border border-[#212121] rounded-2xl p-6"
      >
        <h2 className="text-white font-bold text-base mb-5 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#FF0000]" />
          How it works
        </h2>
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-[#FF0000]" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{step.title}</p>
                  <p className="text-[#717171] text-xs mt-0.5">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-[#333] mt-2.5 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Terms note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[#555] text-xs text-center px-4"
      >
        Bonus analyses are added instantly after signup. No expiry. Self-referrals are blocked. Each person can only use one referral code.
      </motion.p>
    </div>
  );
}
