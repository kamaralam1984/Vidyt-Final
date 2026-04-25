'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  LayoutDashboard, SlidersHorizontal, Users, Save, Loader2,
  Search, RefreshCw, ChevronDown, ChevronUp, CheckCircle2,
  XCircle, Shield, Star, Layers, Cpu, Globe, MonitorPlay,
  ToggleLeft, ToggleRight, AlertCircle, Zap,
} from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';

const ALL_ROLES = ['user', 'manager', 'admin', 'enterprise', 'super-admin'];
const ALL_PLANS = ['free', 'starter', 'pro', 'enterprise', 'custom', 'owner'];

const GROUP_META: Record<string, { label: string; color: string; icon: any }> = {
  dashboard: { label: 'Dashboard', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: LayoutDashboard },
  sidebar: { label: 'Sidebar', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Layers },
  platform: { label: 'Platform', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Globe },
  ai_studio: { label: 'AI Studio', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Cpu },
  yt_seo_sections: { label: 'YT SEO', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: MonitorPlay },
  channel_intelligence: { label: 'Channel Intel', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: Star },
  quick_tools: { label: 'Quick Tools', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Zap },
  other: { label: 'Other', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: SlidersHorizontal },
};

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  manager: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  enterprise: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'super-admin': 'bg-red-500/20 text-red-300 border-red-500/30',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-300',
  starter: 'bg-blue-500/20 text-blue-300',
  pro: 'bg-purple-500/20 text-purple-300',
  enterprise: 'bg-amber-500/20 text-amber-300',
  custom: 'bg-emerald-500/20 text-emerald-300',
  owner: 'bg-red-500/20 text-red-300',
};

interface Feature {
  id: string;
  label: string;
  group: string;
  enabled: boolean;
  allowedRoles: string[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscription: string;
  uniqueId?: string;
}

export default function DashboardControlPage() {
  const [activeTab, setActiveTab] = useState<'features' | 'users'>('features');
  const [activeGroup, setActiveGroup] = useState<string>('dashboard');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPages, setUserPages] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSaving, setUserSaving] = useState<string>('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [dirtyFeatures, setDirtyFeatures] = useState<Set<string>>(new Set());
  const searchDebounce = useRef<any>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async (group = activeGroup, uSearch = userSearch, uPage = userPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ group, userSearch: uSearch, userPage: String(uPage) });
      const res = await axios.get(`/api/admin/super/dashboard-control?${params}`, { headers: getAuthHeaders() });
      setFeatures(res.data.features || []);
      setUsers(res.data.users || []);
      setTotalUsers(res.data.totalUsers || 0);
      setUserPages(res.data.userPages || 1);
    } catch {
      showToast('Data load karne mein error aaya', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeGroup, userSearch, userPage]);

  useEffect(() => { fetchData(activeGroup, userSearch, userPage); }, [activeGroup, userPage]);

  const handleUserSearch = (q: string) => {
    setUserSearch(q);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => { setUserPage(1); fetchData(activeGroup, q, 1); }, 400);
  };

  const toggleFeatureEnabled = (id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    setDirtyFeatures(prev => new Set(prev).add(id));
  };

  const toggleRole = (featureId: string, role: string) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      const roles = new Set(f.allowedRoles);
      if (roles.has(role)) roles.delete(role);
      else roles.add(role);
      return { ...f, allowedRoles: Array.from(roles) };
    }));
    setDirtyFeatures(prev => new Set(prev).add(featureId));
  };

  const saveFeatures = async () => {
    const toSave = features.filter(f => dirtyFeatures.has(f.id));
    if (toSave.length === 0) return;
    setSaving(true);
    try {
      await axios.patch('/api/admin/super/dashboard-control', { features: toSave }, { headers: getAuthHeaders() });
      setDirtyFeatures(new Set());
      showToast(`${toSave.length} feature(s) save ho gayi`);
    } catch {
      showToast('Save karne mein error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveAllFeatures = async () => {
    setSaving(true);
    try {
      await axios.patch('/api/admin/super/dashboard-control', { features }, { headers: getAuthHeaders() });
      setDirtyFeatures(new Set());
      showToast('Saari features save ho gayi');
    } catch {
      showToast('Save karne mein error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateUserField = async (userId: string, field: 'role' | 'subscription', value: string) => {
    setUserSaving(userId + field);
    try {
      await axios.patch('/api/admin/super/dashboard-control', { userId, [field]: value }, { headers: getAuthHeaders() });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, [field]: value } : u));
      showToast('User update ho gaya');
    } catch {
      showToast('User update mein error', 'error');
    } finally {
      setUserSaving('');
    }
  };

  const groupedCounts = features.reduce((acc, f) => {
    acc[f.group] = (acc[f.group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const groups = Object.keys(GROUP_META);
  const filteredFeatures = features.filter(f => f.group === activeGroup);
  const enabledCount = filteredFeatures.filter(f => f.enabled).length;

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all
          ${toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-300' : 'bg-red-900/90 border-red-500/40 text-red-300'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Dashboard Control</h1>
                <p className="text-xs text-white/40">Features aur User Roles manage karo</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 text-sm text-white/70 hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {activeTab === 'features' && dirtyFeatures.size > 0 && (
              <button
                onClick={saveFeatures}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save ({dirtyFeatures.size})
              </button>
            )}
            {activeTab === 'features' && (
              <button
                onClick={saveAllFeatures}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save All
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] mb-6 w-fit">
          <button
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'features' ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Feature Matrix
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users' ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            User Roles
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">{totalUsers}</span>
          </button>
        </div>

        {/* ─── FEATURE MATRIX TAB ─── */}
        {activeTab === 'features' && (
          <div className="flex gap-6">
            {/* Group Sidebar */}
            <div className="w-48 shrink-0 space-y-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium px-2 mb-3">Groups</p>
              {groups.map(g => {
                const meta = GROUP_META[g];
                const Icon = meta.icon;
                const count = groupedCounts[g] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={g}
                    onClick={() => { setActiveGroup(g); setDirtyFeatures(new Set()); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeGroup === g
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${activeGroup === g ? 'text-red-400' : 'text-white/30'}`} />
                    <span className="flex-1 text-left truncate">{meta.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Feature List */}
            <div className="flex-1 space-y-3">
              {/* Group header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const meta = GROUP_META[activeGroup] || GROUP_META.other;
                    const Icon = meta.icon;
                    return (
                      <>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </div>
                        <span className="text-white/40 text-sm">{enabledCount}/{filteredFeatures.length} enabled</span>
                      </>
                    );
                  })()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFeatures(prev => prev.map(f => f.group === activeGroup ? { ...f, enabled: true } : f));
                      setDirtyFeatures(prev => {
                        const next = new Set(prev);
                        filteredFeatures.forEach(f => next.add(f.id));
                        return next;
                      });
                    }}
                    className="text-[11px] px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    Enable All
                  </button>
                  <button
                    onClick={() => {
                      setFeatures(prev => prev.map(f => f.group === activeGroup ? { ...f, enabled: false } : f));
                      setDirtyFeatures(prev => {
                        const next = new Set(prev);
                        filteredFeatures.forEach(f => next.add(f.id));
                        return next;
                      });
                    }}
                    className="text-[11px] px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    Disable All
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
                  ))}
                </div>
              ) : filteredFeatures.length === 0 ? (
                <div className="py-12 text-center text-white/30">
                  <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Is group mein koi feature nahi</p>
                </div>
              ) : (
                filteredFeatures.map(feature => {
                  const isExpanded = expandedFeatures.has(feature.id);
                  const isDirty = dirtyFeatures.has(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className={`rounded-xl border transition-all ${
                        feature.enabled
                          ? isDirty
                            ? 'bg-amber-500/[0.04] border-amber-500/20'
                            : 'bg-white/[0.03] border-white/[0.07]'
                          : 'bg-red-500/[0.03] border-red-500/10 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Toggle */}
                        <button
                          onClick={() => toggleFeatureEnabled(feature.id)}
                          className="shrink-0 transition-all"
                          title={feature.enabled ? 'Disable karo' : 'Enable karo'}
                        >
                          {feature.enabled ? (
                            <ToggleRight className="w-8 h-8 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-white/20" />
                          )}
                        </button>

                        {/* Feature info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold ${feature.enabled ? 'text-white' : 'text-white/40'}`}>
                              {feature.label}
                            </span>
                            {isDirty && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium uppercase tracking-wider">
                                Modified
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/30 font-mono">{feature.id}</span>
                        </div>

                        {/* Roles preview */}
                        <div className="hidden md:flex items-center gap-1 flex-wrap justify-end">
                          {ALL_ROLES.map(role => (
                            <span
                              key={role}
                              className={`text-[9px] px-1.5 py-0.5 rounded border font-medium transition-all ${
                                feature.allowedRoles.includes(role)
                                  ? ROLE_COLORS[role] || 'bg-white/10 text-white/60 border-white/10'
                                  : 'bg-transparent text-white/15 border-white/[0.05]'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>

                        {/* Expand button */}
                        <button
                          onClick={() => setExpandedFeatures(prev => {
                            const next = new Set(prev);
                            if (next.has(feature.id)) next.delete(feature.id);
                            else next.add(feature.id);
                            return next;
                          })}
                          className="shrink-0 text-white/30 hover:text-white transition-colors p-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expanded role editor */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-white/[0.05] pt-3">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-medium">Allowed Roles</p>
                          <div className="flex flex-wrap gap-2">
                            {ALL_ROLES.map(role => (
                              <button
                                key={role}
                                onClick={() => toggleRole(feature.id, role)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  feature.allowedRoles.includes(role)
                                    ? ROLE_COLORS[role] || 'bg-white/10 text-white border-white/20'
                                    : 'bg-transparent text-white/30 border-white/[0.07] hover:border-white/20 hover:text-white/60'
                                }`}
                              >
                                {feature.allowedRoles.includes(role) ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── USER ROLES TAB ─── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={userSearch}
                onChange={e => handleUserSearch(e.target.value)}
                placeholder="User naam ya email se dhundo..."
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/40 transition-colors"
              />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Roles:</span>
              {ALL_ROLES.map(r => (
                <span key={r} className={`text-[10px] px-2 py-0.5 rounded border font-medium ${ROLE_COLORS[r]}`}>{r}</span>
              ))}
              <span className="text-[10px] text-white/30 ml-4 uppercase tracking-widest">Plans:</span>
              {ALL_PLANS.map(p => (
                <span key={p} className={`text-[10px] px-2 py-0.5 rounded font-medium ${PLAN_COLORS[p]}`}>{p}</span>
              ))}
            </div>

            {/* Users table */}
            <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.02]">
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] text-[10px] text-white/30 uppercase tracking-widest font-medium px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
                <span>User</span>
                <span>Email</span>
                <span>Role</span>
                <span>Plan</span>
                <span>ID</span>
              </div>
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-white/30">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Koi user nahi mila</p>
                </div>
              ) : (
                users.map((user, idx) => (
                  <div
                    key={user._id}
                    className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr] items-center px-5 py-3 gap-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                      idx === users.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-red-400">
                          {(user.name || user.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-white truncate font-medium">{user.name || '—'}</span>
                    </div>

                    {/* Email */}
                    <span className="text-xs text-white/50 truncate">{user.email}</span>

                    {/* Role dropdown */}
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={e => updateUserField(user._id, 'role', e.target.value)}
                        disabled={userSaving === user._id + 'role'}
                        className={`w-full appearance-none text-[11px] font-semibold px-2 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all disabled:opacity-50 ${
                          ROLE_COLORS[user.role] || 'bg-white/10 text-white border-white/20'
                        }`}
                        style={{ background: 'transparent' }}
                      >
                        {ALL_ROLES.map(r => (
                          <option key={r} value={r} className="bg-[#1a1a1a] text-white">{r}</option>
                        ))}
                      </select>
                      {userSaving === user._id + 'role' && (
                        <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-white/40" />
                      )}
                    </div>

                    {/* Plan dropdown */}
                    <div className="relative">
                      <select
                        value={user.subscription || 'free'}
                        onChange={e => updateUserField(user._id, 'subscription', e.target.value)}
                        disabled={userSaving === user._id + 'subscription'}
                        className={`w-full appearance-none text-[11px] font-semibold px-2 py-1.5 rounded-lg cursor-pointer focus:outline-none transition-all disabled:opacity-50 ${
                          PLAN_COLORS[user.subscription] || 'bg-white/10 text-white'
                        }`}
                        style={{ background: 'transparent' }}
                      >
                        {ALL_PLANS.map(p => (
                          <option key={p} value={p} className="bg-[#1a1a1a] text-white">{p}</option>
                        ))}
                      </select>
                      {userSaving === user._id + 'subscription' && (
                        <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-white/40" />
                      )}
                    </div>

                    {/* Unique ID */}
                    <span className="text-[10px] text-white/25 font-mono truncate">{user.uniqueId || user._id.slice(-6)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {userPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-white/30">Total: {totalUsers} users</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setUserPage(p => Math.max(1, p - 1)); }}
                    disabled={userPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white disabled:opacity-30 transition-all"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1.5 text-sm text-white/50">{userPage} / {userPages}</span>
                  <button
                    onClick={() => { setUserPage(p => Math.min(userPages, p + 1)); }}
                    disabled={userPage === userPages}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white disabled:opacity-30 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
