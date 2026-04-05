'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  Zap,
  Crown,
  Sparkles,
  Rocket,
  Globe,
  Youtube,
  Facebook,
  Instagram,
  Headphones,
  Shield,
  Save,
  Loader2,
  Power,
  Edit2,
  Plus,
  Trash2,
  X,
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
  // AI Studio Features
  daily_ideas: boolean;
  ai_coach: boolean;
  keyword_research: boolean;
  script_writer: boolean;
  title_generator: boolean;
  channel_audit_tool: boolean;
  ai_shorts_clipping: boolean;
  ai_thumbnail_maker: boolean;
  optimize: boolean;
  // Core Platform Features
  advancedAiViralPrediction: boolean;
  realTimeTrendAnalysis: boolean;
  bestPostingTimePredictions: boolean;
  competitorAnalysis: boolean;
  emailSupport: boolean;
  priorityProcessing: boolean;
  // Enterprise & Advanced Features
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
  limitsDisplay?: {
    videos: string;
    analyses: string;
    storage: string;
    support: string;
  };
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

interface RoleInfo {
  color: string;
  badgeColor: string;
  level: number;
}

/**
 * Unified Control Panel - Manage Plans, Roles & Platforms
 * All controls in ONE page
 */
export default function UnifiedControlPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [controls, setControls] = useState<PlatformControl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingPlatform, setSavingPlatform] = useState('');
  const [savingMaster, setSavingMaster] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const availablePlans = ['free', 'pro', 'enterprise', 'owner'];
  const defaultFeatures: Record<string, string[]> = {
    youtube: ['upload', 'seo', 'live', 'ai_engine'],
    facebook: ['seo', 'audit'],
    instagram: ['seo', 'audit'],
    support: ['ai_auto_reply', 'human_support', 'priority_support', '24_7_mode'],
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, controlsRes] = await Promise.all([
        fetch('/api/admin/plans'),
        axios.get('/api/admin/super/controls', { headers: getAuthHeaders() }).catch(err => {
          console.error('Controls API error:', err);
          return { data: { controls: [] } };
        }),
      ]);

      const plansData = await plansRes.json();
      if (plansData.success) {
        setPlans(plansData.plans);
      }

      if (controlsRes.data?.controls) {
        const fetchedControls: PlatformControl[] = controlsRes.data.controls;
        const basePlatforms = ['youtube', 'facebook', 'instagram', 'support'];

        const mergedControls = basePlatforms.map((p) => {
          const existing = fetchedControls.find((c) => c.platform === p);
          if (existing) {
            return { ...existing, features: existing.features || {} };
          }
          return {
            platform: p,
            isEnabled: true,
            allowedPlans: availablePlans,
            features: defaultFeatures[p].reduce((acc, curr) => ({ ...acc, [curr]: true }), {}),
          };
        });

        setControls(mergedControls);
      } else {
        // Fallback to default controls if API fails
        const basePlatforms = ['youtube', 'facebook', 'instagram', 'support'];
        const defaultControls = basePlatforms.map((p) => ({
          platform: p,
          isEnabled: true,
          allowedPlans: availablePlans,
          features: defaultFeatures[p].reduce((acc, curr) => ({ ...acc, [curr]: true }), {}),
        }));
        setControls(defaultControls);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch data');
      // Set default controls so UI still shows
      const basePlatforms = ['youtube', 'facebook', 'instagram', 'support'];
      const defaultControls = basePlatforms.map((p) => ({
        platform: p,
        isEnabled: true,
        allowedPlans: availablePlans,
        features: defaultFeatures[p].reduce((acc, curr) => ({ ...acc, [curr]: true }), {}),
      }));
      setControls(defaultControls);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlanRole = async (planId: string, newRole: string) => {
    setLoading(true);
    setError(null);
    try {
      const plan = plans.find((p) => p.planId === planId);
      const res = await fetch(`/api/admin/plans`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plan?._id,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`✓ ${plan?.name} updated to ${newRole} role`);
        setTimeout(() => setSuccess(null), 3000);
        fetchAllData();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setIsSavingPlan(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/plans`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlan._id,
          name: editingPlan.name,
          label: editingPlan.label,
          description: editingPlan.description,
          priceMonthly: editingPlan.priceMonthly,
          priceYearly: editingPlan.priceYearly,
          features: editingPlan.features,
          role: editingPlan.role,
          limits: editingPlan.limits,
          limitsDisplay: editingPlan.limitsDisplay,
          featureFlags: editingPlan.featureFlags,
          isActive: editingPlan.isActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`✓ ${editingPlan.name} saved successfully`);
        setTimeout(() => setSuccess(null), 3000);
        setEditingPlan(null);
        fetchAllData();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleUpdateControl = (platformIdx: number, updates: Partial<PlatformControl>) => {
    const newControls = [...controls];
    newControls[platformIdx] = { ...newControls[platformIdx], ...updates };
    setControls(newControls);
  };

  const togglePlan = (platformIdx: number, plan: string) => {
    const currentControl = controls[platformIdx];
    const planSet = new Set(currentControl.allowedPlans);
    if (planSet.has(plan)) planSet.delete(plan);
    else planSet.add(plan);
    handleUpdateControl(platformIdx, { allowedPlans: Array.from(planSet) });
  };

  const toggleRole = (platformIdx: number, role: string) => {
    const currentControl = controls[platformIdx];
    const allowedRoles = currentControl.allowedRoles || ['user', 'manager', 'admin'];
    const roleSet = new Set(allowedRoles);
    if (roleSet.has(role)) roleSet.delete(role);
    else roleSet.add(role);
    handleUpdateControl(platformIdx, { allowedRoles: Array.from(roleSet) });
  };

  const toggleFeature = (platformIdx: number, featureKey: string) => {
    const currentControl = controls[platformIdx];
    const newFeatures = { ...currentControl.features };
    newFeatures[featureKey] = !newFeatures[featureKey];
    handleUpdateControl(platformIdx, { features: newFeatures });
  };

  const savePlatformConfig = async (platformIdx: number) => {
    const control = controls[platformIdx];
    setSavingPlatform(control.platform);
    try {
      await axios.post('/api/admin/super/controls', control, { headers: getAuthHeaders() });
      setSuccess(`✓ ${control.platform} saved successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(`Failed to save ${control.platform} config`);
    } finally {
      setSavingPlatform('');
    }
  };

  const handleMasterToggle = async (enableAll: boolean) => {
    if (!confirm(`Are you sure you want to ${enableAll ? 'ENABLE' : 'DISABLE'} all platforms globally?`))
      return;

    setSavingMaster(true);
    try {
      await axios.post(
        '/api/admin/super/controls/master-toggle',
        { isEnabled: enableAll },
        { headers: getAuthHeaders() }
      );
      setSuccess(`✓ All platforms ${enableAll ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccess(null), 3000);
      fetchAllData();
    } catch (error: any) {
      setError('Failed to execute master toggle');
    } finally {
      setSavingMaster(false);
    }
  };

  const roleInfo: Record<string, RoleInfo> = {
    user: { color: '#AAAAAA', badgeColor: 'bg-gray-500', level: 1 },
    manager: { color: '#FF0000', badgeColor: 'bg-red-500', level: 2 },
    admin: { color: '#FFD700', badgeColor: 'bg-amber-500', level: 3 },
  };

  const planIcons: Record<string, React.ComponentType<any>> = {
    free: Sparkles,
    starter: Rocket,
    pro: Zap,
    enterprise: Crown,
    custom: Globe,
    owner: Crown,
  };

  const platformIcons: Record<string, React.ComponentType<any>> = {
    youtube: Youtube,
    facebook: Facebook,
    instagram: Instagram,
    support: Headphones,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading control panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Control Center</h1>
          <p className="text-gray-400">Manage plans, roles, and platform controls from one place</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* ============== PLANS & ROLES SECTION ============== */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-400" /> Plans & Roles
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No plans found</p>
              </div>
            ) : (
              plans.map((plan) => {
                const Icon = planIcons[plan.planId] || Globe;
                const info = roleInfo[plan.role] || roleInfo.user;

                return (
                  <div key={plan.planId} className="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
                    {/* Icon & Name */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${info.color}20` }}>
                          <Icon className="w-6 h-6" style={{ color: info.color }} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                          <p className="text-gray-400 text-xs">{plan.planId}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`${info.badgeColor} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                          Lvl {info.level}
                        </span>
                        <button
                          onClick={() => setEditingPlan(plan)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4 pb-4 border-b border-gray-700">
                      <div className="text-2xl font-bold text-white">
                        ${plan.priceMonthly}
                        <span className="text-sm text-gray-400 ml-1">/mo</span>
                      </div>
                    </div>

                    {/* Current Role */}
                    <div className="mb-4 pb-4 border-b border-gray-700">
                      <div className="text-sm text-gray-400 mb-2">Current Role</div>
                      <span className={`${info.badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                        {plan.role.charAt(0).toUpperCase() + plan.role.slice(1)}
                      </span>
                    </div>

                    {/* Change Role */}
                    <div>
                      <div className="text-xs text-gray-400 font-semibold mb-2">Change Role</div>
                      <div className="grid grid-cols-3 gap-2">
                        {['user', 'manager', 'admin'].map((role) => {
                          const roleData = roleInfo[role];
                          return (
                            <button
                              key={role}
                              onClick={() => handleUpdatePlanRole(plan.planId, role)}
                              disabled={loading || plan.role === role}
                              className={`px-3 py-2 rounded text-xs font-semibold transition ${
                                plan.role === role
                                  ? `${roleData.badgeColor} text-white opacity-50 cursor-not-allowed`
                                  : `${roleData.badgeColor} text-white hover:opacity-80 disabled:opacity-50`
                              }`}
                            >
                              {role === 'user' ? 'User' : role === 'manager' ? 'Mgr' : 'Admin'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Status</span>
                        <span className={`${plan.isActive ? 'text-green-400' : 'text-red-400'} font-semibold`}>
                          {plan.isActive ? '● Active' : '● Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============== PLATFORM CONTROLS SECTION ============== */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-400" /> Platform Controls
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMasterToggle(true)}
                disabled={savingMaster}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 text-sm"
              >
                <Power className="w-4 h-4" /> Enable All
              </button>
              <button
                onClick={() => handleMasterToggle(false)}
                disabled={savingMaster}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 text-sm"
              >
                <AlertCircle className="w-4 h-4" /> Disable All
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {controls.map((control, idx) => {
              const PlatformIcon = platformIcons[control.platform as keyof typeof platformIcons] || Shield;

              return (
                <div key={control.platform} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-gray-700/50 px-6 py-4 flex items-center justify-between border-b border-gray-700">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-white capitalize">
                      <PlatformIcon className="w-5 h-5" />
                      {control.platform}
                    </h3>

                    {/* Global Toggle */}
                    <label className="flex items-center cursor-pointer gap-3">
                      <span
                        className={`text-sm font-medium ${control.isEnabled ? 'text-green-400' : 'text-gray-500'}`}
                      >
                        {control.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={control.isEnabled}
                          onChange={(e) => handleUpdateControl(idx, { isEnabled: e.target.checked })}
                        />
                        <div
                          className={`block w-14 h-8 rounded-full transition-colors ${
                            control.isEnabled ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                            control.isEnabled ? 'translate-x-6' : ''
                          }`}
                        ></div>
                      </div>
                    </label>
                  </div>

                  {/* Card Body */}
                  <div className={`p-6 ${!control.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Plan Restrictions */}
                      <div>
                        <h4 className="font-semibold mb-4 text-sm text-gray-300">Plan Access</h4>
                        <div className="space-y-3">
                          {availablePlans.map((plan) => (
                            <label key={plan} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={control.allowedPlans.includes(plan)}
                                onChange={() => togglePlan(idx, plan)}
                                className="w-4 h-4 rounded border-gray-500 text-red-500 focus:ring-red-500 accent-red-500"
                              />
                              <span className="text-gray-300 capitalize text-sm">{plan}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Role Access */}
                      <div>
                        <h4 className="font-semibold mb-4 text-sm text-gray-300">Role Access</h4>
                        <div className="space-y-3">
                          {['user', 'manager', 'admin'].map((role) => {
                            const roleData = roleInfo[role];
                            const allowedRoles = control.allowedRoles || ['user', 'manager', 'admin'];
                            return (
                              <label key={role} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={allowedRoles.includes(role)}
                                  onChange={() => toggleRole(idx, role)}
                                  className="w-4 h-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500 accent-blue-500"
                                />
                                <span className={`${roleData.badgeColor} text-white px-2 py-0.5 rounded text-xs font-semibold capitalize`}>
                                  {role}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div>
                        <h4 className="font-semibold mb-4 text-sm text-gray-300">Sub-Features</h4>
                        <div className="space-y-3">
                          {Object.keys(control.features).map((featureKey) => (
                            <div key={featureKey} className="flex items-center justify-between">
                              <span className="capitalize text-sm text-gray-300">{featureKey.replace('_', ' ')}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={!!control.features[featureKey]}
                                  onChange={() => toggleFeature(idx, featureKey)}
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => savePlatformConfig(idx)}
                        disabled={savingPlatform === control.platform}
                        className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {savingPlatform === control.platform ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Edit2 className="w-6 h-6 text-blue-400" /> Edit Plan: {editingPlan.name}
                </h2>
                <p className="text-gray-400 text-sm mt-1">Configure pricing, limits, and features for this plan</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2 mb-4">Basic Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Display Label (e.g. Starter Plan)</label>
                  <input
                    type="text"
                    value={editingPlan.label || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, label: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    value={editingPlan.description || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition h-20"
                  />
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Price Monthly (USD)</label>
                    <input
                      type="number"
                      value={editingPlan.priceMonthly}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: parseFloat(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Price Yearly (USD)</label>
                    <input
                      type="number"
                      value={editingPlan.priceYearly || 0}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: parseFloat(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

                {/* Usage Limits */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2 mb-4">Hard Usage Limits & Display</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-full bg-blue-900/10 p-3 rounded border border-blue-800/30 mb-2">
                    <p className="text-xs text-blue-300">Numerical limits are enforced by the system. Display labels are what users see on pricing cards.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Analyses Limit (-1 = ∞)</label>
                    <input
                      type="number"
                      value={editingPlan.limits.analysesLimit}
                      onChange={(e) => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, analysesLimit: parseInt(e.target.value) }})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Display Analyses (e.g. 500/mo)</label>
                    <input
                      type="text"
                      value={editingPlan.limitsDisplay?.analyses || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, limitsDisplay: { ...editingPlan.limitsDisplay || { videos: '', analyses: '', storage: '', support: '' }, analyses: e.target.value }})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title Suggestions Limit</label>
                    <input
                      type="number"
                      value={editingPlan.limits.titleSuggestions}
                      onChange={(e) => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, titleSuggestions: parseInt(e.target.value) }})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Display Videos (e.g. 5 Videos)</label>
                    <input
                      type="text"
                      value={editingPlan.limitsDisplay?.videos || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, limitsDisplay: { ...editingPlan.limitsDisplay || { videos: '', analyses: '', storage: '', support: '' }, videos: e.target.value }})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Display Storage (e.g. 10GB)</label>
                    <input
                      type="text"
                      value={editingPlan.limitsDisplay?.storage || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, limitsDisplay: { ...editingPlan.limitsDisplay || { videos: '', analyses: '', storage: '', support: '' }, storage: e.target.value }})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Display Support</label>
                    <input
                      type="text"
                      value={editingPlan.limitsDisplay?.support || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, limitsDisplay: { ...editingPlan.limitsDisplay || { videos: '', analyses: '', storage: '', support: '' }, support: e.target.value }})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Features List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2 mb-4">Marketing Features List</h3>
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {editingPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                       <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...editingPlan.features];
                          newFeatures[idx] = e.target.value;
                          setEditingPlan({ ...editingPlan, features: newFeatures });
                        }}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
                      />
                      <button
                        onClick={() => {
                          const newFeatures = editingPlan.features.filter((_, i) => i !== idx);
                          setEditingPlan({ ...editingPlan, features: newFeatures });
                        }}
                        className="p-1 hover:bg-gray-800 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingPlan({ ...editingPlan, features: [...editingPlan.features, ''] })}
                    className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-white hover:border-gray-500 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Feature
                  </button>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2 mb-4">Functional Feature Flags</h3>
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                  {[
                    {
                      label: 'AI Studio Tools',
                      flags: ['daily_ideas', 'ai_coach', 'keyword_research', 'script_writer', 'title_generator', 'channel_audit_tool', 'ai_shorts_clipping', 'ai_thumbnail_maker', 'optimize']
                    },
                    {
                      label: 'Growth & Analytics',
                      flags: ['advancedAiViralPrediction', 'realTimeTrendAnalysis', 'bestPostingTimePredictions', 'competitorAnalysis', 'advancedAnalyticsDashboard']
                    },
                    {
                      label: 'Support & Enterprise',
                      flags: ['emailSupport', 'prioritySupport24x7', 'priorityProcessing', 'teamCollaboration', 'whiteLabelReports', 'customAiModelTraining', 'dedicatedAccountManager', 'customIntegrations']
                    }
                  ].map((group) => (
                    <div key={group.label} className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.label}</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {group.flags.map((flag) => (
                          <label key={flag} className="flex items-center justify-between cursor-pointer group p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-gray-800">
                            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{flag.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={!!editingPlan.featureFlags[flag as keyof PlanFeatureFlags]}
                                onChange={(e) => setEditingPlan({
                                  ...editingPlan,
                                  featureFlags: { ...editingPlan.featureFlags, [flag]: e.target.checked }
                                })}
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${editingPlan.featureFlags[flag as keyof PlanFeatureFlags] ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
                              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editingPlan.featureFlags[flag as keyof PlanFeatureFlags] ? 'translate-x-4' : ''}`}></div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-4 mt-12 border-t border-gray-800 pt-8">
               <button
                onClick={() => setEditingPlan(null)}
                className="px-6 py-2.5 rounded-lg font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                disabled={isSavingPlan}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isSavingPlan ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
