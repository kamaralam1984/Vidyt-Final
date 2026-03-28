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
  Toggle2,
  Plus,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface Plan {
  planId: string;
  name: string;
  priceMonthly: number;
  role: string;
  isActive: boolean;
  _id?: string;
}

interface PlatformControl {
  platform: string;
  isEnabled: boolean;
  allowedPlans: string[];
  allowedRoles?: string[];
  features: Record<string, boolean>;
}

interface RoleDefinition {
  _id?: string;
  name: string;
  level: number;
  description: string;
  permissions: string[];
  color: string;
  isCustom?: boolean;
}

type UnifiedControlPanelProps = {
  /** When true, fits inside a parent layout (no full-screen hero, no duplicate page chrome). */
  embedded?: boolean;
};

/**
 * Unified Control Panel - Manage Plans, Roles & Platforms
 * All controls in ONE page
 */
export default function UnifiedControlPanel({ embedded = false }: UnifiedControlPanelProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [controls, setControls] = useState<PlatformControl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingPlatform, setSavingPlatform] = useState('');
  const [savingMaster, setSavingMaster] = useState(false);

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
      const res = await fetch(`/api/admin/plans/${planId}`, {
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

  const roleInfo = {
    user: { color: '#AAAAAA', badgeColor: 'bg-gray-500', level: 1 },
    manager: { color: '#FF0000', badgeColor: 'bg-red-500', level: 2 },
    admin: { color: '#FFD700', badgeColor: 'bg-amber-500', level: 3 },
  };

  const planIcons: Record<string, any> = {
    free: Sparkles,
    starter: Rocket,
    pro: Zap,
    enterprise: Crown,
    custom: Globe,
  };

  const platformIcons = {
    youtube: Youtube,
    facebook: Facebook,
    instagram: Instagram,
    support: Headphones,
  };

  const shell = embedded
    ? 'rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-6'
    : 'min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6';

  if (loading) {
    return (
      <div className={`${embedded ? 'rounded-2xl border border-white/10 bg-[#141414] p-12' : 'min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading control panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {!embedded && (
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Control Center</h1>
            <p className="text-gray-400">Manage plans, roles, and platform controls from one place</p>
          </div>
        )}

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
                      <span className={`${info.badgeColor} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                        Lvl {info.level}
                      </span>
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
    </div>
  );
}
