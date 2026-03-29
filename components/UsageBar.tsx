'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { motion } from 'framer-motion';

type UsageBlock = {
  used: number;
  limit: number;
  period?: 'day' | 'month' | null;
};

function formatCap(limit: number, period: 'day' | 'month' | null | undefined): string {
  if (limit < 0) return '∞';
  if (!period) return String(limit);
  return `${limit}${period === 'day' ? '/day' : '/mo'}`;
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

  return (
    <div className="px-3 py-3 mt-2 mb-2 border-t border-b border-[#212121] space-y-3">
      <div className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Usage</div>

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
      <div className="w-full h-1.5 bg-[#212121] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
      </div>
      {p >= 80 && p < 100 && (
        <p className="text-[9px] text-yellow-500 mt-1 font-medium">Almost at limit</p>
      )}
      {p >= 100 && (
        <p className="text-[9px] text-[#FF0000] mt-1 font-medium">Limit reached</p>
      )}
    </div>
  );
}
