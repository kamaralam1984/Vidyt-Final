'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { motion } from 'framer-motion';

type UsagePeriod = 'day' | 'week' | 'month' | 'lifetime';

type UsageBlock = {
  used: number;
  limit: number;
  period?: UsagePeriod | null;
};

type FeatureUsageEntry = {
  used: number;
  limit: number;
  period: UsagePeriod;
  label: string;
  group: string;
};

const PERIOD_SUFFIX: Record<UsagePeriod, string> = {
  day: '/day',
  week: '/wk',
  month: '/mo',
  lifetime: '',
};

function formatCap(limit: number, period: UsagePeriod | null | undefined): string {
  if (limit < 0) return '∞';
  if (!period || period === 'lifetime') return String(limit);
  return `${limit}${PERIOD_SUFFIX[period] ?? ''}`;
}

function barPercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function barColor(percent: number): string {
  if (percent >= 100) return 'bg-[#FF0000]';
  if (percent >= 80) return 'bg-yellow-400';
  return 'bg-[#00E5FF]';
}

export default function UsageBar() {
  const [videoUpload, setVideoUpload] = useState<UsageBlock | null>(null);
  const [videoAnalysis, setVideoAnalysis] = useState<UsageBlock | null>(null);
  const [schedulePosts, setSchedulePosts] = useState<UsageBlock | null>(null);
  const [bulkScheduling, setBulkScheduling] = useState<UsageBlock | null>(null);
  const [featureUsage, setFeatureUsage] = useState<Record<string, FeatureUsageEntry>>({});
  const [hideAll, setHideAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await axios.get('/api/user/usage', { headers: getAuthHeaders() });
        const u = res.data?.usage;
        const plan = res.data?.subscription?.plan as string | undefined;
        if (!u) return;

        if (plan === 'owner' || u.videoAnalysis?.limit === -1) {
          setHideAll(true);
          return;
        }

        setVideoUpload(u.videoUpload);
        setVideoAnalysis(u.videoAnalysis);
        setSchedulePosts(u.schedulePosts);
        setBulkScheduling(u.bulkScheduling);
        setFeatureUsage((res.data?.featureUsage as Record<string, FeatureUsageEntry>) || {});
      } catch {
        // unauthenticated or network
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) return null;
  if (hideAll) return null;
  if (!videoAnalysis) return null;

  // Registry items rendered below the legacy 4. Skip keys that already
  // surface as legacy rows so we don't duplicate (analyses == videoAnalysis,
  // scheduledPosts == schedulePosts).
  const SKIP_LEGACY_KEYS = new Set(['analyses', 'scheduledPosts']);
  const registryItems = Object.entries(featureUsage)
    .filter(([key]) => !SKIP_LEGACY_KEYS.has(key))
    .sort((a, b) => {
      // Sort by group order then alphabetically by label.
      const groupOrder = ['core', 'ai_studio', 'analytics', 'social', 'storage', 'collaboration'];
      const ga = groupOrder.indexOf(a[1].group);
      const gb = groupOrder.indexOf(b[1].group);
      if (ga !== gb) return ga - gb;
      return a[1].label.localeCompare(b[1].label);
    });

  return (
    <div className="px-3 py-3 mt-2 mb-2 border-t border-b border-[#212121]">
      <div className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Usage</span>
        {registryItems.length > 0 && (
          <span className="text-[9px] font-mono text-[#555] normal-case tracking-normal">
            {registryItems.length + 4} features
          </span>
        )}
      </div>

      <div className="max-h-[340px] overflow-y-auto pr-1 space-y-3 usage-scroll">
        {videoUpload && (
          <UsageRow
            title="Video upload"
            cap={formatCap(videoUpload.limit, videoUpload.period ?? null)}
            used={videoUpload.used}
            limit={videoUpload.limit}
          />
        )}
        {videoAnalysis && (
          <UsageRow
            title="Video analysis"
            cap={formatCap(videoAnalysis.limit, videoAnalysis.period ?? null)}
            used={videoAnalysis.used}
            limit={videoAnalysis.limit}
          />
        )}
        {schedulePosts && (
          <UsageRow
            title="Schedule posts"
            cap={schedulePosts.limit > 0 ? `${schedulePosts.limit} limit` : undefined}
            used={schedulePosts.used}
            limit={schedulePosts.limit}
          />
        )}
        {bulkScheduling && (
          <UsageRow
            title="Bulk scheduling"
            cap={bulkScheduling.limit > 0 ? `${bulkScheduling.limit} posts` : undefined}
            used={bulkScheduling.used}
            limit={bulkScheduling.limit}
          />
        )}

        {registryItems.length > 0 && (
          <div className="pt-2 mt-2 border-t border-[#1A1A1A] space-y-3">
            {registryItems.map(([key, entry]) => (
              <UsageRow
                key={key}
                title={entry.label}
                cap={formatCap(entry.limit, entry.period)}
                used={entry.used}
                limit={entry.limit}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .usage-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .usage-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .usage-scroll::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 2px;
        }
        .usage-scroll::-webkit-scrollbar-thumb:hover {
          background: #3a3a3a;
        }
      `}</style>
    </div>
  );
}

function UsageRow({
  title,
  cap,
  used,
  limit,
}: {
  title: string;
  cap?: string;
  used: number;
  limit: number;
}) {
  if (limit === 0) {
    return (
      <div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[11px] text-[#AAA]">
            {title}
            {cap ? <span className="text-[#666]"> · {cap}</span> : null}
          </span>
          <span className="text-[10px] text-[#666] shrink-0">Plan</span>
        </div>
        <p className="text-[9px] text-[#555] mt-0.5">Not included — upgrade to unlock</p>
      </div>
    );
  }

  if (limit < 0) {
    return (
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[11px] text-[#AAA]">{title}</span>
        <span className="text-[10px] font-mono text-white shrink-0">
          {used} / ∞
        </span>
      </div>
    );
  }

  const p = barPercent(used, limit);
  const color = barColor(p);
  const danger = p >= 80;

  return (
    <div>
      <div className="flex justify-between items-baseline gap-2 mb-1">
        <span className="text-[11px] text-[#AAA] leading-tight">
          {title}
          {cap ? <span className="text-[#666]"> · {cap}</span> : null}
        </span>
        <span className="text-[10px] font-mono text-white shrink-0">
          {used} / {limit}
        </span>
      </div>
      <div className={`w-full h-1.5 bg-[#212121] rounded-full overflow-hidden relative ${danger ? 'ring-1 ring-white/10' : ''}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full ${color} ${danger ? 'shadow-[0_0_10px_rgba(255,255,255,0.2)]' : ''}`}
        />
        {danger && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '220%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-y-0 w-1/3 bg-white/20 blur-[1px]"
          />
        )}
      </div>
      <p className="text-[9px] text-[#666] mt-0.5">{Math.round(p)}% used</p>
      {p >= 80 && p < 100 && (
        <p className="text-[9px] text-yellow-500 mt-1 font-medium">Almost at limit</p>
      )}
      {p >= 100 && (
        <p className="text-[9px] text-[#FF0000] mt-1 font-medium">Limit reached</p>
      )}
    </div>
  );
}
