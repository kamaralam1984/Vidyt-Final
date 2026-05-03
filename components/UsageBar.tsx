'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const COLLAPSE_STORAGE_KEY = 'usage-widget-collapsed';

type UsagePeriod = 'day' | 'week' | 'month' | 'lifetime';

type SidebarUsageEntry = {
  id: string;
  label: string;
  limitKey?: string;
  used?: number;
  limit?: number;
  period?: UsagePeriod;
};

const PERIOD_SUFFIX: Record<UsagePeriod, string> = {
  day: '/day',
  week: '/week',
  month: '/month',
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

// 3-tier health: green = plenty left, amber = getting close, red = near/at limit.
// Thresholds tuned so users notice the colour shift before they hit the wall.
function barColor(percent: number): string {
  if (percent >= 85) return 'bg-red-500';
  if (percent >= 60) return 'bg-amber-400';
  return 'bg-emerald-500';
}

export default function UsageBar() {
  const [sidebarUsage, setSidebarUsage] = useState<SidebarUsageEntry[]>([]);
  const [hideAll, setHideAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<boolean>(() => {
    // Restore collapsed/expanded state across page navigations.
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) !== '1';
  });

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '0' : '1');
      } catch {
        /* storage disabled */
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await axios.get('/api/user/usage', { headers: getAuthHeaders() });
        const plan = res.data?.subscription?.plan as string | undefined;

        // Owner / super-admin sees no usage caps.
        if (plan === 'owner') {
          setHideAll(true);
          return;
        }

        setSidebarUsage((res.data?.sidebarUsage as SidebarUsageEntry[]) || []);
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
  if (sidebarUsage.length === 0) return null;

  return (
    <div className="px-3 py-3 mt-2 mb-2 border-t border-b border-[#212121]">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="w-full text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider mb-2 flex items-center justify-between hover:text-white transition-colors group"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#666] group-hover:text-white transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
          Usage
        </span>
        <span className="text-[9px] font-mono text-[#555] normal-case tracking-normal">
          {sidebarUsage.length} features
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="usage-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="max-h-[340px] overflow-y-auto pr-1 space-y-3 usage-scroll">
              {sidebarUsage.map((entry) => {
                // Items without a configured limit render as label-only rows.
                if (entry.limit === undefined) {
                  return (
                    <div key={entry.id} className="flex justify-between items-baseline gap-2">
                      <span className="text-[11px] text-[#AAA]">{entry.label}</span>
                      <span className="text-[9px] text-[#555] uppercase tracking-wider">Available</span>
                    </div>
                  );
                }
                return (
                  <UsageRow
                    key={entry.id}
                    title={entry.label}
                    cap={formatCap(entry.limit, entry.period ?? null)}
                    used={entry.used ?? 0}
                    limit={entry.limit}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
  const warning = p >= 60 && p < 85;
  const danger = p >= 85;

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
      {warning && (
        <p className="text-[9px] text-amber-400 mt-1 font-medium">Usage getting high</p>
      )}
      {danger && p < 100 && (
        <p className="text-[9px] text-red-500 mt-1 font-medium">Almost at limit</p>
      )}
      {p >= 100 && (
        <p className="text-[9px] text-[#FF0000] mt-1 font-medium">Limit reached</p>
      )}
    </div>
  );
}
