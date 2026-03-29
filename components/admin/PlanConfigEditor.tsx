'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings,
} from 'lucide-react';
import { navPlanAllowsFeature, type PlatformControlLean } from '@/lib/computeUserFeatureAccess';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlanLimits {
  analysesLimit: number;
  analysesPeriod: 'day' | 'month';
  titleSuggestions: number;
  hashtagCount: number;
  competitorsTracked: number;
}

interface FeatureFlags {
  advancedAiViralPrediction: boolean;
  realTimeTrendAnalysis: boolean;
  bestPostingTimePredictions: boolean;
  competitorAnalysis: boolean;
  emailSupport: boolean;
  priorityProcessing: boolean;
  teamCollaboration: boolean;
  whiteLabelReports: boolean;
  customAiModelTraining: boolean;
  dedicatedAccountManager: boolean;
  prioritySupport24x7: boolean;
  advancedAnalyticsDashboard: boolean;
  customIntegrations: boolean;
  // New AI Studio Features
  daily_ideas: boolean;
  ai_coach: boolean;
  keyword_research: boolean;
  script_writer: boolean;
  title_generator: boolean;
  channel_audit_tool: boolean;
  ai_shorts_clipping: boolean;
  ai_thumbnail_maker: boolean;
  optimize: boolean;
}

interface LimitsDisplay {
  videos: string;
  analyses: string;
  storage: string;
  support: string;
}

interface PlanConfig {
  id: string;
  planId: string;
  name: string;
  label: string;
  role: string;
  priceMonthly: number;
  limits: PlanLimits;
  featureFlags: FeatureFlags;
  limitsDisplay: LimitsDisplay;
  /** Per-plan sidebar/dashboard visibility (same as Unified Feature Matrix → Plans columns). */
  navFeatureAccess?: Record<string, boolean>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FEATURE_LABELS: Record<keyof FeatureFlags, string> = {
  advancedAiViralPrediction: 'Advanced AI Viral Prediction',
  realTimeTrendAnalysis: 'Real-time Trend Analysis',
  bestPostingTimePredictions: 'Best Posting Time Predictions',
  competitorAnalysis: 'Competitor Analysis',
  emailSupport: 'Email Support',
  priorityProcessing: 'Priority Processing',
  teamCollaboration: 'Team Collaboration',
  whiteLabelReports: 'White-label Reports',
  customAiModelTraining: 'Custom AI Model Training',
  dedicatedAccountManager: 'Dedicated Account Manager',
  prioritySupport24x7: '24/7 Priority Support',
  advancedAnalyticsDashboard: 'Advanced Analytics Dashboard',
  customIntegrations: 'Custom Integrations',
  // New AI Studio Features
  daily_ideas: 'Daily Ideas',
  ai_coach: 'AI Coach',
  keyword_research: 'Keyword Research',
  script_writer: 'Script Writer',
  title_generator: 'Title Generator',
  channel_audit_tool: 'Channel Audit Tool',
  ai_shorts_clipping: 'AI Shorts Clipping',
  ai_thumbnail_maker: 'AI Thumbnail Maker',
  optimize: 'AI Optimization Engine',
};

const ROLE_OPTIONS = [
  { value: 'user', label: 'User', color: '#888' },
  { value: 'manager', label: 'Manager', color: '#3B82F6' },
  { value: 'admin', label: 'Admin', color: '#F59E0B' },
  { value: 'enterprise', label: 'Enterprise Plan', color: '#10B981' },
  { value: 'super-admin', label: 'Super Admin', color: '#EF4444' },
  { value: 'custom', label: 'Custom', color: '#7C3AED' },
];

const PLAN_COLORS: Record<string, string> = {
  free: '#6B7280',
  starter: '#3B82F6',
  pro: '#8B5CF6',
  enterprise: '#F59E0B',
  custom: '#EF4444',
};

function sidebarItemEffectiveForPlan(
  sys: { id: string; label: string; group: string; enabled: boolean; allowedRoles: string[] },
  cfg: PlanConfig,
  platformRows: PlatformControlLean[]
): boolean {
  if (!sys.enabled) return false;
  if (!cfg.role || !sys.allowedRoles.includes(cfg.role)) return false;
  return navPlanAllowsFeature(
    { id: sys.id, group: sys.group },
    {
      planId: cfg.planId,
      featureFlags: {},
      navFeatureAccess: cfg.navFeatureAccess || {},
    },
    cfg.planId,
    platformRows
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlanConfigEditor({ propPlanId }: { propPlanId?: string }) {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [systems, setSystems] = useState<{ id: string; label: string; group: string; enabled: boolean; allowedRoles: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemsLoading, setSystemsLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // planId being saved
  const [activePlan, setActivePlan] = useState<string>('');
  const [localConfigs, setLocalConfigs] = useState<Record<string, PlanConfig>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openSection, setOpenSection] = useState<string>('role');
  const [platformRows, setPlatformRows] = useState<PlatformControlLean[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/plan-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
        if (Array.isArray(data.platformRows)) {
          setPlatformRows(data.platformRows);
        }
        const cfg: Record<string, PlanConfig> = {};
        data.plans.forEach((p: PlanConfig) => {
          cfg[p.planId] = JSON.parse(JSON.stringify(p));
          if (!cfg[p.planId].navFeatureAccess) cfg[p.planId].navFeatureAccess = {};
        });
        setLocalConfigs(cfg);
        // If propPlanId is passed, use it, otherwise use first plan
        if (propPlanId) {
          setActivePlan(propPlanId);
        } else if (!activePlan && data.plans.length > 0) {
          setActivePlan(data.plans[0].planId);
        }
      }
    } catch {
      showToast('error', 'Failed to load plan configurations');
    } finally {
      setLoading(false);
    }
  }, [activePlan, propPlanId]);

  useEffect(() => { 
    fetchPlans();
    
    // Fetch system features
    const token = localStorage.getItem('token');
    if (token) {
      setSystemsLoading(true);
      fetch('/api/admin/features', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.features) setSystems(d.features); })
        .catch(() => {})
        .finally(() => setSystemsLoading(false));
    }
  }, []);

  useEffect(() => {
    if (propPlanId && plans.length > 0) {
      setActivePlan(propPlanId);
    }
  }, [propPlanId, plans]);

  const updateLocal = (planId: string, field: string, value: any) => {
    setLocalConfigs(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  const updateLimit = (planId: string, key: keyof PlanLimits, value: any) => {
    setLocalConfigs(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        limits: { ...prev[planId].limits, [key]: value },
      },
    }));
  };

  const updateFeature = (planId: string, key: keyof FeatureFlags, value: boolean) => {
    setLocalConfigs(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        featureFlags: { ...prev[planId].featureFlags, [key]: value },
      },
    }));
  };

  const updateDisplay = (planId: string, key: keyof LimitsDisplay, value: string) => {
    setLocalConfigs(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        limitsDisplay: { ...prev[planId].limitsDisplay, [key]: value },
      },
    }));
  };

  const savePlan = async (planId: string) => {
    setSaving(planId);
    try {
      const cfg = localConfigs[planId];
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/plan-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: cfg.planId,
          role: cfg.role,
          limits: cfg.limits,
          featureFlags: cfg.featureFlags,
          limitsDisplay: cfg.limitsDisplay,
          label: cfg.label,
          navFeatureAccess: cfg.navFeatureAccess || {},
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `✅ ${cfg.name} plan config saved successfully`);
        fetchPlans();
      } else {
        showToast('error', data.error || 'Save failed');
      }
    } catch {
      showToast('error', 'Network error while saving');
    } finally {
      setSaving(null);
    }
  };

  const activeCfg = localConfigs[activePlan];
  const planColor = PLAN_COLORS[activePlan] || '#6B7280';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="animate-spin w-6 h-6 text-[#FF0000] mr-2" />
        <span className="text-[#888]">Loading plan configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium border
          ${toast.type === 'success'
            ? 'bg-[#0D2A1A] border-green-700 text-green-400'
            : 'bg-[#2A0D0D] border-red-700 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {!propPlanId && (
        <>
          {/* Header (Only if not in plan-specific view) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF0000]/10 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-[#FF0000]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Full Plan Configuration</h2>
                <p className="text-xs text-[#666]">Set role, limits & feature flags per plan — auto-applied to all users</p>
              </div>
            </div>
            <button
              onClick={fetchPlans}
              className="flex items-center gap-2 px-3 py-2 bg-[#181818] hover:bg-[#2A2A2A] rounded-lg text-sm text-[#888] transition-colors border border-[#212121]"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Plan Tabs */}
          <div className="flex gap-2 flex-wrap">
            {plans.map((p) => (
              <button
                key={p.planId}
                onClick={() => setActivePlan(p.planId)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                  ${activePlan === p.planId
                    ? 'text-white border-transparent shadow-lg'
                    : 'bg-[#181818] border-[#2A2A2A] text-[#888] hover:text-white hover:border-[#444]'}`}
                style={activePlan === p.planId ? { backgroundColor: PLAN_COLORS[p.planId] || '#333', borderColor: 'transparent' } : {}}
              >
                {p.name}
              </button>
            ))}
          </div>
        </>
      )}

      {activeCfg && (
        <div className="bg-[#141414] border border-[#212121] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          {/* Plan Header */}
          <div className="px-6 py-6 border-b border-[#212121] flex items-center justify-between"
            style={{ background: `linear-gradient(90deg, ${planColor}15, transparent)` }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" style={{ color: planColor }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: planColor }}>{activeCfg.planId} Mode</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{activeCfg.label || activeCfg.name} Plan Control</h3>
              <p className="text-xs text-[#888] mt-1">Status: <span className="text-green-500 font-medium">Active Configuration</span></p>
            </div>
            <div className="flex gap-3">
               {!propPlanId && (
                <button
                  onClick={fetchPlans}
                  className="p-2.5 bg-[#181818] hover:bg-[#2A2A2A] rounded-xl text-[#666] transition-colors border border-[#212121]"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
               )}
              <button
                onClick={() => savePlan(activeCfg.planId)}
                disabled={saving === activeCfg.planId}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 shadow-lg shadow-black/20"
                style={{ backgroundColor: planColor }}
              >
                {saving === activeCfg.planId
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                  : <><Save className="w-4 h-4" /> Save All Changes</>}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* ── SECTION: ROLE ── */}
            <div className="bg-[#1A1A1A] rounded-xl border border-[#252525] overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1E1E1E] transition-colors"
                onClick={() => setOpenSection(openSection === 'role' ? '' : 'role')}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#FF0000]" />
                  <div>
                    <p className="text-sm font-semibold text-white">System Role Assignment</p>
                    <p className="text-xs text-[#666]">Determine the base role for users on this plan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-md font-bold text-white"
                    style={{ backgroundColor: ROLE_OPTIONS.find(r => r.value === activeCfg.role)?.color || '#888' }}>
                    {ROLE_OPTIONS.find(r => r.value === activeCfg.role)?.label.toUpperCase() || activeCfg.role.toUpperCase()}
                  </span>
                  {openSection === 'role' ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
                </div>
              </button>
              {openSection === 'role' && (
                <div className="px-5 pb-5 border-t border-[#252525] animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] text-[#555] uppercase font-bold tracking-wider mt-5 mb-3">Available Roles</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateLocal(activeCfg.planId, 'role', opt.value)}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all
                          ${activeCfg.role === opt.value
                            ? 'text-white border-transparent'
                            : 'bg-[#0F0F0F] border-[#2A2A2A] text-[#555] hover:text-[#888]'}`}
                        style={activeCfg.role === opt.value ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION: LIMITS ── */}
            <div className="bg-[#1A1A1A] rounded-xl border border-[#252525] overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1E1E1E] transition-colors"
                onClick={() => setOpenSection(openSection === 'limits' ? '' : 'limits')}
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">API & Usage Limits</p>
                    <p className="text-xs text-[#666]">Numerical constraints for features (Use -1 for unlimited)</p>
                  </div>
                </div>
                {openSection === 'limits' ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
              </button>
              {openSection === 'limits' && (
                <div className="px-5 pb-5 border-t border-[#252525] pt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2 block">Analyses Limit</label>
                      <input
                        type="number"
                        min={-1}
                        value={activeCfg.limits.analysesLimit}
                        onChange={e => updateLimit(activeCfg.planId, 'analysesLimit', Number(e.target.value))}
                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2 block">Reset Period</label>
                      <select
                        value={activeCfg.limits.analysesPeriod}
                        onChange={e => updateLimit(activeCfg.planId, 'analysesPeriod', e.target.value as 'day' | 'month')}
                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="day">Daily</option>
                        <option value="month">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2 block">Title Suggestions</label>
                      <input
                        type="number"
                        min={-1}
                        value={activeCfg.limits.titleSuggestions}
                        onChange={e => updateLimit(activeCfg.planId, 'titleSuggestions', Number(e.target.value))}
                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2 block">Hashtags / Post</label>
                      <input
                        type="number"
                        min={-1}
                        value={activeCfg.limits.hashtagCount}
                        onChange={e => updateLimit(activeCfg.planId, 'hashtagCount', Number(e.target.value))}
                        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-3">Pricing Page Display Strings</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(['videos', 'analyses', 'storage', 'support'] as (keyof LimitsDisplay)[]).map(key => (
                        <div key={key}>
                          <label className="text-[9px] text-[#444] mb-1 block capitalize">{key}</label>
                          <input
                            type="text"
                            value={activeCfg.limitsDisplay[key] || ''}
                            onChange={e => updateDisplay(activeCfg.planId, key, e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-[#444]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION: FEATURE FLAGS ── */}
            <div className="bg-[#1A1A1A] rounded-xl border border-[#252525] overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1E1E1E] transition-colors"
                onClick={() => setOpenSection(openSection === 'features' ? '' : 'features')}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Specific AI Features</p>
                    <p className="text-xs text-[#666]">Enable/Disable granular AI tools and capabilities</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#666]">
                    {Object.values(activeCfg.featureFlags || {}).filter(Boolean).length} Enabled
                  </span>
                  {openSection === 'features' ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
                </div>
              </button>
              {openSection === 'features' && (
                <div className="px-5 pb-5 border-t border-[#252525] pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(Object.keys(FEATURE_LABELS) as (keyof FeatureFlags)[]).map(key => {
                      const enabled = activeCfg.featureFlags?.[key] ?? false;
                      return (
                        <button
                          key={key}
                          onClick={() => updateFeature(activeCfg.planId, key, !enabled)}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-[11px] text-left transition-all
                            ${enabled
                              ? 'bg-yellow-900/10 border-yellow-800/40 text-yellow-200/80 shadow-inner'
                              : 'bg-[#0F0F0F] border-[#252525] text-[#555] hover:border-[#333]'}`}
                        >
                          <span className="font-medium truncate">{FEATURE_LABELS[key]}</span>
                          {enabled
                            ? <ToggleRight className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            : <ToggleLeft className="w-4 h-4 text-[#333] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION: SYSTEM FEATURE ACCESS ── */}
            <div className="bg-[#1A1A1A] rounded-xl border border-[#252525] overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1E1E1E] transition-colors"
                onClick={() => setOpenSection(openSection === 'system-access' ? '' : 'system-access')}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-[#FF0000]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Sidebar & Dashboard Layout</p>
                    <p className="text-xs text-[#666]">Control which sidebar menu items and dashboard widgets are visible</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#666] font-mono bg-black/50 px-2 py-0.5 rounded border border-[#212121]">
                    PLAN::{activeCfg.planId.toUpperCase()} · ROLE::{activeCfg.role.toUpperCase()}
                  </span>
                  {openSection === 'system-access' ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
                </div>
              </button>
              {openSection === 'system-access' && (
                <div className="px-5 pb-5 border-t border-[#252525] pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {systemsLoading ? (
                    <div className="flex justify-center py-4"><RefreshCw className="w-5 h-5 animate-spin text-[#FF0000]" /></div>
                  ) : (
                    <div className="space-y-6 pt-2">
                       <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-4 flex gap-3 text-xs">
                        <ShieldCheck className="w-6 h-6 text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-blue-100 font-semibold mb-1">Plan + role (user sidebar)</p>
                          <p className="text-[#888] leading-relaxed">
                            Toggles here update <strong>this plan only</strong> (<code className="text-[#aaa]">{activeCfg.planId}</code>) via{' '}
                            <code className="text-[#aaa]">navFeatureAccess</code> — same data as{' '}
                            <strong>Unified Feature Matrix → blue “Plans” columns</strong>.<br />
                            The user must also have role <strong>{activeCfg.role}</strong> allowed on that row (red role checkboxes in the Matrix, or System Control).
                          </p>
                        </div>
                      </div>
                      
                      {['sidebar', 'dashboard'].map(group => (
                        <div key={group} className="space-y-3">
                          <p className="text-[10px] font-bold text-[#FF0000] uppercase tracking-[0.2em] px-1 opacity-70">
                            {group === 'sidebar' ? 'Menu Layout' : 'Widget Grid'}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {systems.filter(s => s.group === group).map(sys => {
                              const hasAccess = sidebarItemEffectiveForPlan(sys, activeCfg, platformRows);
                              return (
                                <button
                                  key={sys.id}
                                  onClick={async () => {
                                    const token = localStorage.getItem('token');
                                    if (!token) return;
                                    if (!sys.allowedRoles.includes(activeCfg.role)) {
                                      showToast(
                                        'error',
                                        `Pehle Unified Feature Matrix (ya System Control) mein "${activeCfg.role}" role is row par allow karein — phir plan toggle kaam karega.`
                                      );
                                      return;
                                    }
                                    const prevNav = { ...(localConfigs[activeCfg.planId]?.navFeatureAccess || {}) };
                                    const nextVal = !hasAccess;
                                    const newNav = { ...prevNav, [sys.id]: nextVal };
                                    setLocalConfigs(prev => ({
                                      ...prev,
                                      [activeCfg.planId]: {
                                        ...prev[activeCfg.planId],
                                        navFeatureAccess: newNav,
                                      },
                                    }));
                                    try {
                                      const res = await fetch('/api/admin/plan-config', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({
                                          planId: activeCfg.planId,
                                          navFeatureAccess: newNav,
                                        }),
                                      });
                                      const data = await res.json();
                                      if (!data.success) {
                                        showToast('error', data.error || 'Failed to update menu for this plan');
                                      }
                                    } catch (err) {
                                      console.error('Error updating nav:', err);
                                      showToast('error', 'Network error');
                                    }
                                  }}
                                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs text-left transition-all
                                    ${hasAccess
                                      ? 'bg-red-900/10 border-red-900/40 text-red-100 shadow-sm'
                                      : 'bg-[#0F0F0F] border-[#252525] text-[#555] hover:border-[#333]'}`}
                                >
                                  <span className="font-semibold">{sys.label}</span>
                                  {hasAccess
                                    ? <ToggleRight className="w-5 h-5 text-[#FF0000] flex-shrink-0" />
                                    : <ToggleLeft className="w-5 h-5 text-[#333] flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save Button (bottom sticky) */}
            <div className="flex justify-end pt-4 border-t border-[#212121]">
              <button
                onClick={() => savePlan(activeCfg.planId)}
                disabled={saving === activeCfg.planId}
                className="flex items-center gap-3 px-10 py-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 shadow-xl shadow-black/40"
                style={{ backgroundColor: planColor }}
              >
                {saving === activeCfg.planId
                  ? <><RefreshCw className="w-5 h-5 animate-spin" /> Saving Configuration...</>
                  : <><Save className="w-5 h-5" /> Save {activeCfg.name} Plan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
