'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle, Check, Zap, Crown, Sparkles, Rocket, Globe,
  Youtube, Facebook, Instagram, Headphones, Shield, Save, Loader2,
  Power, Edit2, Plus, Trash2, X, Settings, Bell, Users, Lock,
  Wrench, ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  AlertTriangle, RefreshCw, Eye, EyeOff,
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface PlanLimits {
  analysesLimit: number;
  analysesPeriod: 'day' | 'month';
  titleSuggestions: number;
  hashtagCount: number;
  competitorsTracked: number;
}

interface PlanFeatureFlags {
  daily_ideas: boolean;
  ai_coach: boolean;
  keyword_research: boolean;
  script_writer: boolean;
  title_generator: boolean;
  channel_audit_tool: boolean;
  ai_shorts_clipping: boolean;
  ai_thumbnail_maker: boolean;
  optimize: boolean;
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
}

interface Plan {
  planId: string;
  name: string;
  label?: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  role: string;
  isActive: boolean;
  features: string[];
  limits: PlanLimits;
  limitsDisplay?: { videos: string; analyses: string; storage: string; support: string };
  featureFlags: PlanFeatureFlags;
  _id?: string;
}

interface PlatformControl {
  platform: string;
  isEnabled: boolean;
  allowedPlans: string[];
  allowedRoles?: string[];
  features: Record<string, boolean>;
}

function humanize(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

export default function UnifiedControlPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [controls, setControls] = useState<PlatformControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingPlatform, setSavingPlatform] = useState('');
  const [savingMaster, setSavingMaster] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'platforms' | 'site'>('plans');
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  // Site controls state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);

  const availablePlans = ['free', 'starter', 'pro', 'enterprise', 'owner'];
  const defaultFeatures: Record<string, string[]> = {
    youtube: ['upload', 'seo', 'live', 'ai_engine'],
    facebook: ['seo', 'audit'],
    instagram: ['seo', 'audit'],
    support: ['ai_auto_reply', 'human_support', 'priority_support', '24_7_mode'],
  };

  const roleInfo: Record<string, { color: string; bg: string; level: number }> = {
    user: { color: 'text-[#888]', bg: 'bg-[#333]', level: 1 },
    manager: { color: 'text-[#FF0000]', bg: 'bg-[#FF0000]', level: 2 },
    admin: { color: 'text-amber-400', bg: 'bg-amber-500', level: 3 },
    'super-admin': { color: 'text-purple-400', bg: 'bg-purple-500', level: 4 },
  };

  const planIcons: Record<string, React.ComponentType<any>> = {
    free: Sparkles, starter: Rocket, pro: Zap, enterprise: Crown, custom: Globe, owner: Crown,
  };

  const platformIcons: Record<string, React.ComponentType<any>> = {
    youtube: Youtube, facebook: Facebook, instagram: Instagram, support: Headphones,
  };

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, controlsRes] = await Promise.all([
        fetch('/api/admin/plans', { headers: getAuthHeaders() as any }),
        axios.get('/api/admin/super/controls', { headers: getAuthHeaders() }).catch(() => ({ data: { controls: [] } })),
      ]);

      const plansData = await plansRes.json();
      if (plansData.success) setPlans(plansData.plans);

      if (controlsRes.data?.controls) {
        const fetched: PlatformControl[] = controlsRes.data.controls;
        const basePlatforms = ['youtube', 'facebook', 'instagram', 'support'];
        setControls(basePlatforms.map(p => {
          const existing = fetched.find(c => c.platform === p);
          if (existing) return { ...existing, features: existing.features || {} };
          return {
            platform: p, isEnabled: true, allowedPlans: availablePlans,
            features: defaultFeatures[p].reduce((acc, curr) => ({ ...acc, [curr]: true }), {}),
          };
        }));
      }

      // Load site settings
      try {
        const siteRes = await axios.get('/api/admin/super/controls/site-settings', { headers: getAuthHeaders() }).catch(() => null);
        if (siteRes?.data) {
          setMaintenanceMode(siteRes.data.maintenanceMode || false);
          setRegistrationOpen(siteRes.data.registrationOpen !== false);
          setAnnouncement(siteRes.data.announcement || '');
          setAnnouncementActive(siteRes.data.announcementActive || false);
        }
      } catch { /* site settings endpoint may not exist yet */ }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const handleUpdatePlanRole = async (planId: string, newRole: string) => {
    setError(null);
    try {
      const plan = plans.find(p => p.planId === planId);
      const res = await axios.patch('/api/admin/plans', { id: plan?._id, role: newRole }, { headers: getAuthHeaders() });
      if (res.data.success) { showSuccess(`${plan?.name} updated to ${newRole}`); fetchAllData(); }
      else setError(res.data.error);
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  const handleTogglePlanActive = async (plan: Plan) => {
    try {
      const res = await axios.patch('/api/admin/plans', { id: plan._id, isActive: !plan.isActive }, { headers: getAuthHeaders() });
      if (res.data.success) { showSuccess(`${plan.name} ${!plan.isActive ? 'activated' : 'deactivated'}`); fetchAllData(); }
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setIsSavingPlan(true);
    setError(null);
    try {
      const res = await axios.patch('/api/admin/plans', {
        id: editingPlan._id, name: editingPlan.name, label: editingPlan.label,
        description: editingPlan.description, priceMonthly: editingPlan.priceMonthly,
        priceYearly: editingPlan.priceYearly, features: editingPlan.features,
        role: editingPlan.role, limits: editingPlan.limits, limitsDisplay: editingPlan.limitsDisplay,
        featureFlags: editingPlan.featureFlags, isActive: editingPlan.isActive,
      }, { headers: getAuthHeaders() });
      if (res.data.success) { showSuccess(`${editingPlan.name} saved`); setEditingPlan(null); fetchAllData(); }
      else setError(res.data.error);
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setIsSavingPlan(false); }
  };

  const handleUpdateControl = (idx: number, updates: Partial<PlatformControl>) => {
    const next = [...controls];
    next[idx] = { ...next[idx], ...updates };
    setControls(next);
  };

  const savePlatformConfig = async (idx: number) => {
    const control = controls[idx];
    setSavingPlatform(control.platform);
    try {
      await axios.post('/api/admin/super/controls', control, { headers: getAuthHeaders() });
      showSuccess(`${control.platform} saved`);
    } catch { setError(`Failed to save ${control.platform}`); }
    finally { setSavingPlatform(''); }
  };

  const handleMasterToggle = async (enableAll: boolean) => {
    if (!confirm(`${enableAll ? 'ENABLE' : 'DISABLE'} all platforms globally?`)) return;
    setSavingMaster(true);
    try {
      await axios.post('/api/admin/super/controls/master-toggle', { isEnabled: enableAll }, { headers: getAuthHeaders() });
      showSuccess(`All platforms ${enableAll ? 'enabled' : 'disabled'}`);
      fetchAllData();
    } catch { setError('Failed to execute master toggle'); }
    finally { setSavingMaster(false); }
  };

  const handleSaveSiteSettings = async () => {
    setSavingSite(true);
    try {
      await axios.post('/api/admin/super/controls/site-settings', {
        maintenanceMode, registrationOpen, announcement, announcementActive,
      }, { headers: getAuthHeaders() });
      showSuccess('Site settings saved');
    } catch { setError('Failed to save site settings'); }
    finally { setSavingSite(false); }
  };

  const tabs = [
    { id: 'plans' as const, label: 'Plans & Roles', icon: Zap },
    { id: 'platforms' as const, label: 'Platforms', icon: Shield },
    { id: 'site' as const, label: 'Site Controls', icon: Settings },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF0000] mx-auto mb-3" />
        <p className="text-[#555] text-sm">Loading Control Center...</p>
      </div>
    </div>
  );

  const activePlans = plans.filter(p => p.isActive).length;
  const enabledPlatforms = controls.filter(c => c.isEnabled).length;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#FF0000]" /> Control Center
          </h1>
          <p className="text-xs text-[#555] mt-1">Manage plans, platforms, and site-wide settings</p>
        </div>
        <button onClick={fetchAllData} className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-xs text-[#666] hover:text-white transition">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400 text-sm">
          <Check className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold">Total Plans</p>
          <p className="text-lg font-bold text-white mt-1">{plans.length}</p>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold">Active Plans</p>
          <p className="text-lg font-bold text-green-400 mt-1">{activePlans}</p>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold">Platforms</p>
          <p className="text-lg font-bold text-blue-400 mt-1">{enabledPlatforms}/{controls.length}</p>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold">Maintenance</p>
          <p className={`text-lg font-bold mt-1 ${maintenanceMode ? 'text-red-400' : 'text-green-400'}`}>{maintenanceMode ? 'ON' : 'OFF'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === id ? 'bg-[#FF0000] text-white' : 'bg-[#111] text-[#666] hover:text-white border border-[#1f1f1f]'
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ══════ PLANS TAB ══════ */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {plans.map(plan => {
              const Icon = planIcons[plan.planId] || Globe;
              const info = roleInfo[plan.role] || roleInfo.user;
              const flagCount = plan.featureFlags ? Object.values(plan.featureFlags).filter(Boolean).length : 0;

              return (
                <div key={plan.planId} className={`bg-[#111] border rounded-xl p-4 sm:p-5 transition-all duration-300 ${
                  plan.isActive
                    ? 'border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_15px_rgba(255,191,0,0.08)] hover:shadow-[0_0_25px_rgba(255,191,0,0.15)]'
                    : 'border-red-500/20 opacity-60'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#1a1a1a]">
                        <Icon className="w-5 h-5 text-[#FF0000]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                        <p className="text-[10px] text-[#444] font-mono">{plan.planId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleTogglePlanActive(plan)} title={plan.isActive ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg hover:bg-[#1a1a1a] transition">
                        {plan.isActive ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                      </button>
                      <button onClick={() => setEditingPlan(plan)} title="Edit"
                        className="p-1.5 rounded-lg hover:bg-[#1a1a1a] transition">
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3 pb-3 border-b border-[#1a1a1a]">
                    <span className="text-xl font-bold text-white">₹{plan.priceMonthly}</span>
                    <span className="text-[10px] text-[#555] ml-1">/mo</span>
                    {plan.priceYearly ? (
                      <span className="text-[10px] text-[#444] ml-2">₹{plan.priceYearly}/yr</span>
                    ) : null}
                  </div>

                  {/* Role + Stats */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`${info.bg} text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider`}>
                      {plan.role}
                    </span>
                    <span className="text-[10px] text-[#555]">{flagCount} features enabled</span>
                  </div>

                  {/* Quick Role Switch */}
                  <div className="flex gap-1">
                    {['user', 'manager', 'admin'].map(role => {
                      const ri = roleInfo[role];
                      const active = plan.role === role;
                      return (
                        <button key={role} onClick={() => !active && handleUpdatePlanRole(plan.planId, role)}
                          disabled={active}
                          className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition ${
                            active ? `${ri.bg} text-white opacity-60` : 'bg-[#1a1a1a] text-[#666] hover:text-white hover:bg-[#252525]'
                          }`}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════ PLATFORMS TAB ══════ */}
      {activeTab === 'platforms' && (
        <div className="space-y-3">
          {/* Master Toggle */}
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => handleMasterToggle(true)} disabled={savingMaster}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50">
              <Power className="w-3.5 h-3.5" /> Enable All
            </button>
            <button onClick={() => handleMasterToggle(false)} disabled={savingMaster}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50">
              <AlertCircle className="w-3.5 h-3.5" /> Disable All
            </button>
          </div>

          {controls.map((control, idx) => {
            const PIcon = platformIcons[control.platform] || Shield;
            const isOpen = expandedPlatform === control.platform;
            const featureCount = Object.values(control.features).filter(Boolean).length;
            const totalFeatures = Object.keys(control.features).length;

            return (
              <div key={control.platform} className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
                {/* Platform Header */}
                <button onClick={() => setExpandedPlatform(isOpen ? null : control.platform)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0d0d0d] transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${control.isEnabled ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-400'}`} />
                    <PIcon className="w-5 h-5 text-white" />
                    <div>
                      <span className="text-sm font-bold text-white capitalize">{control.platform}</span>
                      <span className="text-[10px] text-[#555] ml-2">{featureCount}/{totalFeatures} features</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer" onClick={e => e.stopPropagation()}>
                      <span className={`text-[10px] font-bold ${control.isEnabled ? 'text-green-400' : 'text-[#555]'}`}>
                        {control.isEnabled ? 'ON' : 'OFF'}
                      </span>
                      <div className="relative" onClick={() => handleUpdateControl(idx, { isEnabled: !control.isEnabled })}>
                        <div className={`w-10 h-5 rounded-full transition ${control.isEnabled ? 'bg-green-500' : 'bg-[#333]'}`} />
                        <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${control.isEnabled ? 'translate-x-5' : ''}`} />
                      </div>
                    </label>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-[#555]" /> : <ChevronRight className="w-4 h-4 text-[#555]" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                  <div className={`border-t border-[#1a1a1a] p-4 ${!control.isEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Plan Access */}
                      <div>
                        <h4 className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-2">Plan Access</h4>
                        <div className="space-y-1.5">
                          {availablePlans.map(plan => (
                            <label key={plan} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[#1a1a1a] transition">
                              <input type="checkbox" checked={control.allowedPlans.includes(plan)}
                                onChange={() => {
                                  const s = new Set(control.allowedPlans);
                                  s.has(plan) ? s.delete(plan) : s.add(plan);
                                  handleUpdateControl(idx, { allowedPlans: Array.from(s) });
                                }}
                                className="w-3.5 h-3.5 rounded accent-[#FF0000]" />
                              <span className="text-xs text-[#ccc] capitalize">{plan}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Role Access */}
                      <div>
                        <h4 className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-2">Role Access</h4>
                        <div className="space-y-1.5">
                          {['user', 'manager', 'admin'].map(role => {
                            const ri = roleInfo[role];
                            const allowed = control.allowedRoles || ['user', 'manager', 'admin'];
                            return (
                              <label key={role} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[#1a1a1a] transition">
                                <input type="checkbox" checked={allowed.includes(role)}
                                  onChange={() => {
                                    const s = new Set(allowed);
                                    s.has(role) ? s.delete(role) : s.add(role);
                                    handleUpdateControl(idx, { allowedRoles: Array.from(s) });
                                  }}
                                  className="w-3.5 h-3.5 rounded accent-blue-500" />
                                <span className={`${ri.bg} text-white px-2 py-0.5 rounded text-[9px] font-bold capitalize`}>{role}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div>
                        <h4 className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-2">Features</h4>
                        <div className="space-y-1.5">
                          {Object.keys(control.features).map(key => (
                            <div key={key} className="flex items-center justify-between p-1.5 rounded hover:bg-[#1a1a1a] transition">
                              <span className="text-xs text-[#ccc]">{humanize(key)}</span>
                              <div className="relative cursor-pointer" onClick={() => {
                                const f = { ...control.features, [key]: !control.features[key] };
                                handleUpdateControl(idx, { features: f });
                              }}>
                                <div className={`w-8 h-4 rounded-full transition ${control.features[key] ? 'bg-blue-500' : 'bg-[#333]'}`} />
                                <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${control.features[key] ? 'translate-x-4' : ''}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button onClick={() => savePlatformConfig(idx)} disabled={savingPlatform === control.platform}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-lg text-xs font-bold transition disabled:opacity-50">
                        {savingPlatform === control.platform ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save {control.platform}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ SITE CONTROLS TAB ══════ */}
      {activeTab === 'site' && (
        <div className="space-y-3">
          {/* Maintenance Mode */}
          <div className={`bg-[#111] border rounded-xl p-4 sm:p-5 ${maintenanceMode ? 'border-red-500/30' : 'border-[#1f1f1f]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${maintenanceMode ? 'bg-red-500/15' : 'bg-[#1a1a1a]'}`}>
                  <AlertTriangle className={`w-5 h-5 ${maintenanceMode ? 'text-red-400' : 'text-[#555]'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Maintenance Mode</h3>
                  <p className="text-[10px] text-[#555]">When enabled, users see a maintenance page. Only super-admins can access the site.</p>
                </div>
              </div>
              <div className="relative cursor-pointer shrink-0" onClick={() => setMaintenanceMode(!maintenanceMode)}>
                <div className={`w-12 h-6 rounded-full transition ${maintenanceMode ? 'bg-red-500' : 'bg-[#333]'}`} />
                <div className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : ''}`} />
              </div>
            </div>
          </div>

          {/* Registration Toggle */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#1a1a1a]">
                  <Users className={`w-5 h-5 ${registrationOpen ? 'text-green-400' : 'text-[#555]'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">User Registration</h3>
                  <p className="text-[10px] text-[#555]">Control whether new users can sign up. Existing users can still log in.</p>
                </div>
              </div>
              <div className="relative cursor-pointer shrink-0" onClick={() => setRegistrationOpen(!registrationOpen)}>
                <div className={`w-12 h-6 rounded-full transition ${registrationOpen ? 'bg-green-500' : 'bg-[#333]'}`} />
                <div className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${registrationOpen ? 'translate-x-6' : ''}`} />
              </div>
            </div>
          </div>

          {/* Announcement Banner */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#1a1a1a]">
                  <Bell className={`w-5 h-5 ${announcementActive ? 'text-amber-400' : 'text-[#555]'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Site Announcement</h3>
                  <p className="text-[10px] text-[#555]">Show a banner message to all users across the platform.</p>
                </div>
              </div>
              <div className="relative cursor-pointer shrink-0" onClick={() => setAnnouncementActive(!announcementActive)}>
                <div className={`w-12 h-6 rounded-full transition ${announcementActive ? 'bg-amber-500' : 'bg-[#333]'}`} />
                <div className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${announcementActive ? 'translate-x-6' : ''}`} />
              </div>
            </div>
            <textarea
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="e.g. We're upgrading our servers tonight at 11 PM IST. Expect brief downtime."
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#252525] rounded-lg text-white text-sm placeholder-[#444] focus:outline-none focus:border-amber-500/50 transition h-16 resize-none"
            />
          </div>

          {/* Save Site Settings */}
          <div className="flex justify-end">
            <button onClick={handleSaveSiteSettings} disabled={savingSite}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-lg text-xs font-bold transition disabled:opacity-50">
              {savingSite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Site Settings
            </button>
          </div>
        </div>
      )}

      {/* ══════ PLAN EDITOR MODAL ══════ */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl w-full max-w-4xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-400" /> Edit: {editingPlan.name}
                </h2>
                <p className="text-[10px] text-[#555] mt-0.5">Configure pricing, limits, and features</p>
              </div>
              <button onClick={() => setEditingPlan(null)} className="p-2 hover:bg-[#1a1a1a] rounded-lg transition text-[#555] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#555] uppercase tracking-wider">Basic Information</h3>
                {[
                  { label: 'Plan Name', value: editingPlan.name, key: 'name' },
                  { label: 'Display Label', value: editingPlan.label || '', key: 'label' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">{f.label}</label>
                    <input type="text" value={f.value}
                      onChange={e => setEditingPlan({ ...editingPlan, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 bg-[#111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF0000]/50 transition" />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Description</label>
                  <textarea value={editingPlan.description || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF0000]/50 transition h-16 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Monthly (₹)</label>
                    <input type="number" value={editingPlan.priceMonthly}
                      onChange={e => setEditingPlan({ ...editingPlan, priceMonthly: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF0000]/50 transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Yearly (₹)</label>
                    <input type="number" value={editingPlan.priceYearly || 0}
                      onChange={e => setEditingPlan({ ...editingPlan, priceYearly: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF0000]/50 transition" />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#555] uppercase tracking-wider">Usage Limits</h3>
                <p className="text-[10px] text-[#444] bg-blue-500/5 border border-blue-500/10 rounded-lg p-2">-1 = unlimited. Display labels are shown on pricing cards.</p>
                {[
                  { label: 'Analyses Limit', numKey: 'analysesLimit', dispKey: 'analyses' },
                  { label: 'Title Suggestions', numKey: 'titleSuggestions', dispKey: 'videos' },
                ].map(f => (
                  <div key={f.numKey} className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#555] font-bold mb-1">{f.label}</label>
                      <input type="number" value={(editingPlan.limits as any)[f.numKey]}
                        onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, [f.numKey]: parseInt(e.target.value) || 0 } })}
                        className="w-full px-3 py-2 bg-[#111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#555] font-bold mb-1">Display</label>
                      <input type="text" value={editingPlan.limitsDisplay?.[f.dispKey as keyof typeof editingPlan.limitsDisplay] || ''}
                        onChange={e => setEditingPlan({ ...editingPlan, limitsDisplay: { ...editingPlan.limitsDisplay || { videos: '', analyses: '', storage: '', support: '' }, [f.dispKey]: e.target.value } })}
                        className="w-full px-3 py-2 bg-[#111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none transition" placeholder="e.g. 500/mo" />
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#555] font-bold mb-1">Display Storage</label>
                    <input type="text" value={editingPlan.limitsDisplay?.storage || ''}
                      onChange={e => setEditingPlan({ ...editingPlan, limitsDisplay: { ...editingPlan.limitsDisplay || { videos: '', analyses: '', storage: '', support: '' }, storage: e.target.value } })}
                      className="w-full px-3 py-2 bg-[#111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none transition" placeholder="e.g. 10GB" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#555] font-bold mb-1">Display Support</label>
                    <input type="text" value={editingPlan.limitsDisplay?.support || ''}
                      onChange={e => setEditingPlan({ ...editingPlan, limitsDisplay: { ...editingPlan.limitsDisplay || { videos: '', analyses: '', storage: '', support: '' }, support: e.target.value } })}
                      className="w-full px-3 py-2 bg-[#111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none transition" placeholder="e.g. Priority" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Features List */}
              <div>
                <h3 className="text-xs font-bold text-[#555] uppercase tracking-wider mb-2">Marketing Features</h3>
                <div className="space-y-1.5 max-h-52 overflow-y-auto mb-2">
                  {editingPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input type="text" value={feature}
                        onChange={e => { const f = [...editingPlan.features]; f[idx] = e.target.value; setEditingPlan({ ...editingPlan, features: f }); }}
                        className="flex-1 px-2.5 py-1.5 bg-[#111] border border-[#252525] rounded-lg text-white text-xs focus:outline-none transition" />
                      <button onClick={() => setEditingPlan({ ...editingPlan, features: editingPlan.features.filter((_, i) => i !== idx) })}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setEditingPlan({ ...editingPlan, features: [...editingPlan.features, ''] })}
                  className="w-full py-2 border border-dashed border-[#252525] rounded-lg text-[#555] hover:text-white hover:border-[#444] transition text-xs flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Add Feature
                </button>
              </div>

              {/* Feature Flags */}
              <div>
                <h3 className="text-xs font-bold text-[#555] uppercase tracking-wider mb-2">Feature Flags</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {[
                    { label: 'AI Studio', flags: ['daily_ideas', 'ai_coach', 'keyword_research', 'script_writer', 'title_generator', 'channel_audit_tool', 'ai_shorts_clipping', 'ai_thumbnail_maker', 'optimize'] },
                    { label: 'Growth & Analytics', flags: ['advancedAiViralPrediction', 'realTimeTrendAnalysis', 'bestPostingTimePredictions', 'competitorAnalysis', 'advancedAnalyticsDashboard'] },
                    { label: 'Support & Enterprise', flags: ['emailSupport', 'prioritySupport24x7', 'priorityProcessing', 'teamCollaboration', 'whiteLabelReports', 'customAiModelTraining', 'dedicatedAccountManager', 'customIntegrations'] },
                  ].map(group => (
                    <div key={group.label}>
                      <p className="text-[9px] text-[#444] uppercase tracking-wider font-bold mb-1">{group.label}</p>
                      <div className="space-y-0.5">
                        {group.flags.map(flag => (
                          <label key={flag} className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-[#111] transition">
                            <span className="text-[11px] text-[#888]">{humanize(flag)}</span>
                            <div className="relative" onClick={e => { e.preventDefault(); setEditingPlan({ ...editingPlan, featureFlags: { ...editingPlan.featureFlags, [flag]: !editingPlan.featureFlags[flag as keyof PlanFeatureFlags] } }); }}>
                              <div className={`w-8 h-4 rounded-full transition ${editingPlan.featureFlags[flag as keyof PlanFeatureFlags] ? 'bg-blue-500' : 'bg-[#333]'}`} />
                              <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editingPlan.featureFlags[flag as keyof PlanFeatureFlags] ? 'translate-x-4' : ''}`} />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1a1a1a]">
              <button onClick={() => setEditingPlan(null)}
                className="px-5 py-2 rounded-lg text-xs font-bold text-[#666] hover:text-white hover:bg-[#1a1a1a] transition">
                Cancel
              </button>
              <button onClick={handleSavePlan} disabled={isSavingPlan}
                className="flex items-center gap-1.5 px-6 py-2 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-lg text-xs font-bold transition disabled:opacity-50">
                {isSavingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
