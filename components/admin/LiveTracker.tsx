'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Globe, Clock, MapPin, Filter, ArrowUp, ArrowDown } from 'lucide-react';

interface LiveUser {
  sessionId: string;
  userId: string;
  uniqueId?: string;
  name: string;
  email: string;
  plan: string;
  currentPage: string;
  country?: string;
  state?: string;
  city?: string;
  distanceFromAdmin?: number;
  sessionStart: string;
  lastSeen: string;
  isActive: boolean;
  sessionDurationMinutes: number;
  pageTimeSpentSeconds?: number;
}


interface LiveTrackerProps {
  users: LiveUser[];
  recentHistory?: LiveUser[];
  loading?: boolean;
  isLive?: boolean; // true = socket mode, false = polling
}


const PLAN_DOT: Record<string, string> = {
  free: 'bg-white/30',
  starter: 'bg-blue-400',
  pro: 'bg-violet-400',
  enterprise: 'bg-amber-400',
  custom: 'bg-emerald-400',
  owner: 'bg-red-400',
};

// Per-row live session timer, ticks every second
function SessionTimer({ sessionStart }: { sessionStart: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(sessionStart).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [sessionStart]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="font-mono tabular-nums">
      {mins}m {String(secs).padStart(2, '0')}s
    </span>
  );
}

function PageTimer({ initialSeconds }: { initialSeconds: number }) {
  const [elapsed, setElapsed] = useState(Math.max(0, initialSeconds || 0));

  useEffect(() => {
    setElapsed(Math.max(0, initialSeconds || 0));
    const id = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [initialSeconds]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="font-mono tabular-nums">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

type DistanceFilter = 'all' | '0-500' | '500-1000' | '1000-4000';
type SortMode = 'none' | 'nearest' | 'farthest';

export default function LiveTracker({ users, recentHistory = [], loading, isLive = false }: LiveTrackerProps) {
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('none');

  const allUsers = useMemo(() => {
    // Merge live users and recent history, prioritizing live
    const liveIds = new Set(users.map(u => u.sessionId));
    const combined = [...users, ...recentHistory.filter(r => !liveIds.has(r.sessionId))];
    return combined;
  }, [users, recentHistory]);

  const filtered = useMemo(() => {
    let list = [...allUsers];

    // Distance filter
    if (distanceFilter !== 'all') {
      const [min, max] = distanceFilter.split('-').map(Number);
      list = list.filter(u => {
        const d = u.distanceFromAdmin ?? Infinity;
        return d >= min && d <= max;
      });
    }

    // Sort
    if (sortMode === 'nearest') {
      list.sort((a, b) => (a.distanceFromAdmin ?? Infinity) - (b.distanceFromAdmin ?? Infinity));
    } else if (sortMode === 'farthest') {
      list.sort((a, b) => (b.distanceFromAdmin ?? -1) - (a.distanceFromAdmin ?? -1));
    }

    return list;
  }, [allUsers, distanceFilter, sortMode]);

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className={`w-5 h-5 ${users.length > 0 ? 'text-red-400' : 'text-white/20'}`} />
            {users.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Activity Tracking</h2>
            <p className="text-xs text-white/40 flex items-center gap-1.5">
              <span className="text-white/60 font-medium">{users.length} live</span>
              <span className="text-white/20">·</span>
              <span>{recentHistory.length} recent</span>
              {isLive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-1" />
                  <span className="text-emerald-400">WebSocket</span>
                </>
              ) : (
                <span className="ml-1 opacity-50 tabular-nums">· polling</span>
              )}
            </p>
          </div>
        </div>


        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Distance Filter */}
          <div className="relative flex items-center gap-1">
            <Filter className="w-3 h-3 text-white/30 absolute left-2 z-10" />
            <select
              value={distanceFilter}
              onChange={e => setDistanceFilter(e.target.value as DistanceFilter)}
              className="pl-6 pr-3 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 appearance-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
            >
              <option value="all">All distances</option>
              <option value="0-500">0 – 500 km</option>
              <option value="500-1000">500 – 1000 km</option>
              <option value="1000-4000">1000 – 4000 km</option>
            </select>
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortMode(m => m === 'nearest' ? 'farthest' : m === 'farthest' ? 'none' : 'nearest')}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-colors ${
              sortMode !== 'none'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {sortMode === 'farthest' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
            {sortMode === 'none' ? 'Sort distance' : sortMode === 'nearest' ? 'Nearest' : 'Farthest'}
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="divide-y divide-white/3 max-h-[600px] overflow-y-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex gap-4">
              <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded animate-pulse w-1/3" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Radio className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">
              {users.length === 0 ? 'No users currently online' : 'No users match the distance filter'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((user, i) => (
              <motion.div
                key={user.sessionId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.04 }}
                className="px-6 py-4 flex items-start gap-4 hover:bg-white/3 transition-colors"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/40 to-red-800/40 border border-red-500/20 flex items-center justify-center text-white font-bold text-sm">
                    {(user.name || 'U')[0].toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#141414] rounded-full ${
                    user.isActive ? 'bg-emerald-500' : 'bg-white/20'
                  }`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${user.isActive ? 'text-white' : 'text-white/40'}`}>{user.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${PLAN_DOT[user.plan] || 'bg-white/30'} ${!user.isActive && 'opacity-30'}`} title={user.plan} />
                    <span className="text-xs text-white/30">{user.plan}</span>
                    {!user.isActive && <span className="text-[10px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Recent</span>}
                  </div>

                  <p className="text-xs text-white/40 truncate">{user.email}</p>
                  <p className="text-[11px] text-white/35 mt-1">
                    User ID: <span className="font-mono">{user.uniqueId || user.userId || '—'}</span>
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                    <div className="flex items-center gap-1 text-[11px] text-white/50">
                      <Globe className="w-3 h-3" />
                      <span className="font-mono truncate max-w-[140px] text-red-400/80">{user.currentPage}</span>
                    </div>
                    {user.country && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-[11px] text-white/50">
                          <MapPin className="w-3 h-3" />
                          <span>{[user.city, user.state, user.country].filter(Boolean).join(', ') || 'Unknown'}</span>
                        </div>
                        {user.distanceFromAdmin !== undefined && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            user.distanceFromAdmin < 500 ? 'bg-emerald-500/20 text-emerald-400' :
                            user.distanceFromAdmin < 1000 ? 'bg-blue-500/20 text-blue-400' :
                            'bg-white/5 text-white/30'
                          }`}>
                            {user.distanceFromAdmin.toLocaleString()} km
                          </span>
                        )}
                      </div>
                    )}
                    {/* Live session timer */}
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Clock className="w-3 h-3" />
                      Online for: <SessionTimer sessionStart={user.sessionStart} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      <Clock className="w-3 h-3" />
                      On this page: <PageTimer initialSeconds={user.pageTimeSpentSeconds || 0} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
