'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Shield, Users } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { ALL_FEATURES } from '@/utils/features';
import { FEATURE_LIMITS_REGISTRY, type FeaturePeriod } from '@/lib/featureLimits';

interface Plan {
  id: string;
  planId: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
  currency: string;
  features: string[];
  isCustom: boolean;
  isActive: boolean;
  billingPeriod: string;
  limits?: {
    analysesLimit?: number;
    analysesPeriod?: 'day' | 'month';
    titleSuggestions?: number;
    hashtagCount?: number;
    competitorsTracked?: number;
    featureLimits?: Record<string, { value: number; period: 'day' | 'week' | 'month' | 'lifetime' }>;
  };
  limitsDisplay?: {
    videos?: string;
    analyses?: string;
    storage?: string;
    support?: string;
  };
  navFeatureAccess?: Record<string, boolean>;
}

/**
 * All features the super-admin can toggle per plan, derived live from
 * utils/features.ts so this form never falls out of sync with the registry.
 * Grouped by category for readability. Sidebar.tsx + UnifiedFeatureMatrix +
 * computeUserFeatureAccess all read plan.navFeatureAccess[id], so saving here
 * flows to every connected user via the plan:updated socket push.
 */
const FEATURE_GROUP_LABELS: Record<string, string> = {
  sidebar: 'Sidebar Items',
  dashboard: 'Dashboard Widgets & Buttons',
  ai_studio: 'AI Studio & Plan Features',
  platform: 'Platform Access',
  yt_seo_sections: 'YouTube SEO Sections',
  channel_intelligence: 'Channel Intelligence',
  quick_tools: 'Quick Tools',
  other: 'Other',
};

const FEATURES_BY_GROUP: { group: string; label: string; items: { id: string; label: string }[] }[] = [
  'sidebar',
  'dashboard',
  'ai_studio',
  'platform',
  'yt_seo_sections',
  'channel_intelligence',
  'quick_tools',
  'other',
]
  .map((group) => ({
    group,
    label: FEATURE_GROUP_LABELS[group] || group,
    items: ALL_FEATURES.filter((f) => f.group === group).map((f) => ({ id: f.id, label: f.label })),
  }))
  .filter((g) => g.items.length > 0);

const ALL_FEATURE_IDS: string[] = ALL_FEATURES.map((f) => f.id);

/** Period dropdown options for per-feature limits. */
const PERIOD_OPTIONS: { value: FeaturePeriod; label: string }[] = [
  { value: 'day', label: 'Per Day' },
  { value: 'week', label: 'Per Week' },
  { value: 'month', label: 'Per Month' },
  { value: 'lifetime', label: 'Lifetime' },
];

const FEATURE_LIMIT_GROUP_LABELS: Record<string, string> = {
  core: 'Core Quotas',
  ai_studio: 'AI Studio Quotas',
  analytics: 'Analytics Quotas',
  social: 'Social Quotas',
  storage: 'Storage Quotas',
  collaboration: 'Collaboration Quotas',
};

const LIMITS_BY_GROUP = ['core', 'ai_studio', 'analytics', 'social', 'storage', 'collaboration']
  .map((group) => ({
    group,
    label: FEATURE_LIMIT_GROUP_LABELS[group] || group,
    items: FEATURE_LIMITS_REGISTRY.filter((d) => d.group === group),
  }))
  .filter((g) => g.items.length > 0);

/**
 * Build a complete featureLimits map covering every registry key — uses the
 * existing per-plan value if present, otherwise the registry default. Ensures
 * the form always shows every quota even for plans seeded before a key existed.
 */
function hydrateFeatureLimits(
  existing?: Record<string, { value?: number; period?: string }>
): Record<string, { value: number; period: FeaturePeriod }> {
  const out: Record<string, { value: number; period: FeaturePeriod }> = {};
  for (const def of FEATURE_LIMITS_REGISTRY) {
    const cur = existing?.[def.key];
    out[def.key] = {
      value: typeof cur?.value === 'number' ? cur.value : def.defaultValue,
      period: ((cur?.period as FeaturePeriod) || def.defaultPeriod) as FeaturePeriod,
    };
  }
  return out;
}

const EMPTY_LIMITS = {
  analysesLimit: 5,
  analysesPeriod: 'month' as 'day' | 'month',
  titleSuggestions: 3,
  hashtagCount: 10,
  competitorsTracked: 3,
};

const EMPTY_LIMITS_DISPLAY = {
  videos: '',
  analyses: '',
  storage: '',
  support: '',
};

/** One row from GET /api/admin/unified-feature-matrix */
interface MatrixFeatureRow {
  id: string;
  label: string;
  group: string;
  enabled: boolean;
  allowedRoles: string[];
  planAccess: Record<string, boolean> | null;
}

const ROLE_COLORS: Record<string, string> = {
  'free':        'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  'user':        'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  'starter':     'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'pro':         'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  'manager':     'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  'enterprise':  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'admin':       'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'custom':      'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  'super-admin': 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const ROLE_LABELS: Record<string, string> = {
  'free':        'Free',
  'user':        'Free',
  'starter':     'Starter',
  'pro':         'Pro',
  'manager':     'Pro',
  'enterprise':  'Enterprise',
  'admin':       'Enterprise',
  'custom':      'Custom',
  'super-admin': 'Super Admin',
};

const MATRIX_GROUP_ORDER = ['sidebar', 'dashboard', 'ai_studio', 'platform', 'yt_seo_sections', 'other'];

/**
 * Labels to show on Manage Plans — aligned with Unified Feature Matrix:
 * globally enabled, at least one allowed role, and (if the row has plan columns) this plan is on.
 */
function matrixFeatureLabelsForPlan(rows: MatrixFeatureRow[], planId: string): string[] {
  const picked: { label: string; group: string }[] = [];
  for (const f of rows) {
    if (!f.enabled) continue;
    if (!f.allowedRoles || f.allowedRoles.length === 0) continue;
    if (f.planAccess != null && !f.planAccess[planId]) continue;
    picked.push({ label: f.label, group: f.group || 'other' });
  }
  picked.sort((a, b) => {
    const ga = MATRIX_GROUP_ORDER.indexOf(a.group);
    const gb = MATRIX_GROUP_ORDER.indexOf(b.group);
    const oa = ga === -1 ? 99 : ga;
    const ob = gb === -1 ? 99 : gb;
    if (oa !== ob) return oa - ob;
    return a.label.localeCompare(b.label);
  });
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of picked) {
    if (seen.has(p.label)) continue;
    seen.add(p.label);
    unique.push(p.label);
  }
  return unique;
}

export default function PlanManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    planId: '',
    name: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    features: '',
    billingPeriod: 'both',
    // Numeric quotas surfaced on /pricing Plan Quotas section
    analysesLimit: EMPTY_LIMITS.analysesLimit,
    analysesPeriod: EMPTY_LIMITS.analysesPeriod,
    titleSuggestions: EMPTY_LIMITS.titleSuggestions,
    hashtagCount: EMPTY_LIMITS.hashtagCount,
    competitorsTracked: EMPTY_LIMITS.competitorsTracked,
    // Friendly display strings shown in 4-cell grid (Videos / Analyses / Storage / Support)
    limitsDisplayVideos: EMPTY_LIMITS_DISPLAY.videos,
    limitsDisplayAnalyses: EMPTY_LIMITS_DISPLAY.analyses,
    limitsDisplayStorage: EMPTY_LIMITS_DISPLAY.storage,
    limitsDisplaySupport: EMPTY_LIMITS_DISPLAY.support,
    // Per-feature toggles (any group: sidebar / dashboard / ai_studio / platform / etc.)
    navFeatureAccess: {} as Record<string, boolean>,
    // Registry-driven per-feature numeric quotas. -1 = Unlimited.
    featureLimits: {} as Record<string, { value: number; period: FeaturePeriod }>,
  });

  // Role access data: planId -> list of roles with feature access
  const [planRoles, setPlanRoles] = useState<Record<string, string[]>>({});

  /** Matrix rows — used to derive per-plan Features list (synced with Unified Feature Matrix) */
  const [matrixFeatures, setMatrixFeatures] = useState<MatrixFeatureRow[]>([]);

  useEffect(() => {
    fetchPlans();
    fetchRoleData();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      fetchRoleData();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchRoleData();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/plans', {
        headers: getAuthHeaders(),
        timeout: 30_000,
      });
      if (response.data.success) {
        setPlans(response.data.plans || []);
        setError('');
      } else {
        setError(response.data?.error || 'Failed to load plans');
      }
    } catch (err: any) {
      const msg =
        err.code === 'ECONNABORTED'
          ? 'Request timed out. Check that MongoDB is running and MONGODB_URI is correct.'
          : err.response?.data?.error || err.message || 'Failed to load plans';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleData = async () => {
    try {
      const res = await axios.get('/api/admin/unified-feature-matrix', {
        headers: getAuthHeaders(),
        timeout: 30_000,
      });
      if (res.data.features && res.data.plans) {
        setMatrixFeatures(res.data.features as MatrixFeatureRow[]);

        // For each plan, collect all unique roles that have access to any enabled feature
        const planRoleMap: Record<string, Set<string>> = {};

        res.data.plans.forEach((p: { id: string }) => {
          planRoleMap[p.id] = new Set<string>();
        });

        res.data.features.forEach((feature: { enabled: boolean; allowedRoles: string[] }) => {
          if (!feature.enabled) return;
          // If a feature is enabled globally and has allowedRoles, those roles can access it in every plan
          if (feature.allowedRoles && feature.allowedRoles.length > 0) {
            res.data.plans.forEach((p: { id: string }) => {
              if (!planRoleMap[p.id]) planRoleMap[p.id] = new Set();
              feature.allowedRoles.forEach((role: string) => planRoleMap[p.id].add(role));
            });
          }
        });

        const result: Record<string, string[]> = {};
        const roleOrder = ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'];
        Object.entries(planRoleMap).forEach(([planId, rolesSet]) => {
          result[planId] = roleOrder.filter(r => rolesSet.has(r));
        });
        setPlanRoles(result);
      }
    } catch (err) {
      // Silently fail — role data is supplementary
      console.error('Could not fetch role data for plan cards:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.planId || !formData.name || formData.priceMonthly < 0) {
        setError('Fill in all required fields');
        return;
      }

      const features = formData.features
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f);

      // Build the limits / limitsDisplay payloads. Only include fields the
      // admin actually filled — leave the rest of the existing plan doc alone.
      // Build the registry-driven featureLimits map. Pull the current form
      // value for each registry key, falling back to its registry default.
      const featureLimitsPayload: Record<string, { value: number; period: FeaturePeriod }> = {};
      for (const def of FEATURE_LIMITS_REGISTRY) {
        const cur = formData.featureLimits[def.key];
        featureLimitsPayload[def.key] = {
          value: cur?.value !== undefined ? Number(cur.value) : def.defaultValue,
          period: (cur?.period as FeaturePeriod) || def.defaultPeriod,
        };
      }
      const limitsPayload = {
        analysesLimit: Number(formData.analysesLimit),
        analysesPeriod: formData.analysesPeriod,
        titleSuggestions: Number(formData.titleSuggestions),
        hashtagCount: Number(formData.hashtagCount),
        competitorsTracked: Number(formData.competitorsTracked),
        featureLimits: featureLimitsPayload,
      };
      const limitsDisplayPayload = {
        videos: formData.limitsDisplayVideos,
        analyses: formData.limitsDisplayAnalyses,
        storage: formData.limitsDisplayStorage,
        support: formData.limitsDisplaySupport,
      };
      // Cover every feature id from utils/features.ts ALL_FEATURES — partial
      // merge in the API still protects any keys outside this set (e.g.
      // legacy ones that may have been added to a plan doc by other admin tools).
      const navFeatureAccessPayload: Record<string, boolean> = {};
      for (const id of ALL_FEATURE_IDS) {
        navFeatureAccessPayload[id] = !!formData.navFeatureAccess[id];
      }

      let response;
      const hdr = getAuthHeaders();
      if (editingId) {
        response = await axios.patch(
          '/api/admin/plans',
          {
            id: editingId,
            ...formData,
            priceMonthly: Number(formData.priceMonthly),
            priceYearly: formData.priceYearly ? Number(formData.priceYearly) : undefined,
            features,
            limits: limitsPayload,
            limitsDisplay: limitsDisplayPayload,
            navFeatureAccess: navFeatureAccessPayload,
          },
          { headers: hdr, timeout: 30_000 }
        );
      } else {
        response = await axios.post(
          '/api/admin/plans',
          {
            ...formData,
            priceMonthly: Number(formData.priceMonthly),
            priceYearly: formData.priceYearly ? Number(formData.priceYearly) : undefined,
            features,
            limits: limitsPayload,
            limitsDisplay: limitsDisplayPayload,
            navFeatureAccess: navFeatureAccessPayload,
          },
          { headers: hdr, timeout: 30_000 }
        );
      }

      if (response.data.success) {
        setSuccess(editingId ? 'Plan updated successfully' : 'Plan created successfully');
        fetchPlans();
        fetchRoleData();
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save plan');
    }
  };

  const handleEdit = (plan: Plan) => {
    const limits = plan.limits || {};
    const ld = plan.limitsDisplay || {};
    setFormData({
      planId: plan.planId,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly || 0,
      currency: plan.currency,
      features: plan.features.join('\n'),
      billingPeriod: plan.billingPeriod,
      analysesLimit: limits.analysesLimit ?? EMPTY_LIMITS.analysesLimit,
      analysesPeriod: (limits.analysesPeriod as 'day' | 'month') ?? EMPTY_LIMITS.analysesPeriod,
      titleSuggestions: limits.titleSuggestions ?? EMPTY_LIMITS.titleSuggestions,
      hashtagCount: limits.hashtagCount ?? EMPTY_LIMITS.hashtagCount,
      competitorsTracked: limits.competitorsTracked ?? EMPTY_LIMITS.competitorsTracked,
      limitsDisplayVideos: ld.videos ?? '',
      limitsDisplayAnalyses: ld.analyses ?? '',
      limitsDisplayStorage: ld.storage ?? '',
      limitsDisplaySupport: ld.support ?? '',
      navFeatureAccess: { ...(plan.navFeatureAccess || {}) },
      featureLimits: hydrateFeatureLimits(plan.limits?.featureLimits),
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      const response = await axios.delete('/api/admin/plans', {
        params: { id },
        headers: getAuthHeaders(),
        timeout: 30_000,
      });

      if (response.data.success) {
        setSuccess('Plan deleted successfully');
        fetchPlans();
        fetchRoleData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete plan');
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    try {
      const response = await axios.patch(
        '/api/admin/plans',
        {
          id: plan.id,
          isActive: !plan.isActive,
        },
        { headers: getAuthHeaders(), timeout: 30_000 }
      );

      if (response.data.success) {
        setSuccess(`Plan ${plan.isActive ? 'hidden' : 'activated'} successfully`);
        fetchPlans();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update plan status');
    }
  };

  const resetForm = () => {
    setFormData({
      planId: '',
      name: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'USD',
      features: '',
      billingPeriod: 'both',
      analysesLimit: EMPTY_LIMITS.analysesLimit,
      analysesPeriod: EMPTY_LIMITS.analysesPeriod,
      titleSuggestions: EMPTY_LIMITS.titleSuggestions,
      hashtagCount: EMPTY_LIMITS.hashtagCount,
      competitorsTracked: EMPTY_LIMITS.competitorsTracked,
      limitsDisplayVideos: EMPTY_LIMITS_DISPLAY.videos,
      limitsDisplayAnalyses: EMPTY_LIMITS_DISPLAY.analyses,
      limitsDisplayStorage: EMPTY_LIMITS_DISPLAY.storage,
      limitsDisplaySupport: EMPTY_LIMITS_DISPLAY.support,
      navFeatureAccess: {},
      featureLimits: hydrateFeatureLimits(undefined),
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Plans Management</h2>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'New Plan'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Plan' : 'Create New Plan'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Plan ID *</label>
                <input
                  type="text"
                  placeholder="e.g., pro, enterprise"
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  disabled={!!editingId}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Plan Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Pro Plan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  placeholder="Plan description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monthly Price ($) *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.priceMonthly}
                  onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Yearly Price ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.priceYearly}
                  onChange={(e) => setFormData({ ...formData, priceYearly: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Billing Period</label>
                <select
                  value={formData.billingPeriod}
                  onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Features (one per line)</label>
              <textarea
                rows={5}
                placeholder="Unlimited videos&#10;Advanced analytics&#10;Priority support"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 font-mono text-sm"
              />
            </div>

            {/* Pricing-card display strings (top of card's 4-cell grid) */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-300">Limits Display (shown on pricing card grid)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Videos</label>
                  <input
                    type="text"
                    placeholder="e.g. 5/month"
                    value={formData.limitsDisplayVideos}
                    onChange={(e) => setFormData({ ...formData, limitsDisplayVideos: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Analyses</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard"
                    value={formData.limitsDisplayAnalyses}
                    onChange={(e) => setFormData({ ...formData, limitsDisplayAnalyses: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Storage</label>
                  <input
                    type="text"
                    placeholder="e.g. Unlimited"
                    value={formData.limitsDisplayStorage}
                    onChange={(e) => setFormData({ ...formData, limitsDisplayStorage: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Support</label>
                  <input
                    type="text"
                    placeholder="e.g. Priority Email"
                    value={formData.limitsDisplaySupport}
                    onChange={(e) => setFormData({ ...formData, limitsDisplaySupport: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Numeric quotas (Plan Quotas section on pricing card; -1 = unlimited) */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-300">
                Plan Quotas <span className="text-xs font-normal text-gray-500">(numeric — use -1 for Unlimited)</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Analyses Limit</label>
                  <input
                    type="number"
                    value={formData.analysesLimit}
                    onChange={(e) => setFormData({ ...formData, analysesLimit: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Analyses Period</label>
                  <select
                    value={formData.analysesPeriod}
                    onChange={(e) => setFormData({ ...formData, analysesPeriod: e.target.value as 'day' | 'month' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="day">Per Day</option>
                    <option value="month">Per Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Title Suggestions</label>
                  <input
                    type="number"
                    value={formData.titleSuggestions}
                    onChange={(e) => setFormData({ ...formData, titleSuggestions: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Hashtag Count</label>
                  <input
                    type="number"
                    value={formData.hashtagCount}
                    onChange={(e) => setFormData({ ...formData, hashtagCount: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400">Competitors Tracked</label>
                  <input
                    type="number"
                    value={formData.competitorsTracked}
                    onChange={(e) => setFormData({ ...formData, competitorsTracked: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Plan Features — every feature on the platform, grouped by category */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-300">
                  Plan Features <span className="text-xs font-normal text-gray-500">(every UI feature gated by this plan)</span>
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      ALL_FEATURE_IDS.forEach((id) => { all[id] = true; });
                      setFormData({ ...formData, navFeatureAccess: all });
                    }}
                    className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const none: Record<string, boolean> = {};
                      ALL_FEATURE_IDS.forEach((id) => { none[id] = false; });
                      setFormData({ ...formData, navFeatureAccess: none });
                    }}
                    className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {FEATURES_BY_GROUP.map((g) => (
                  <div key={g.group}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{g.label}</p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...formData.navFeatureAccess };
                            g.items.forEach((it) => { next[it.id] = true; });
                            setFormData({ ...formData, navFeatureAccess: next });
                          }}
                          className="text-[10px] px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...formData.navFeatureAccess };
                            g.items.forEach((it) => { next[it.id] = false; });
                            setFormData({ ...formData, navFeatureAccess: next });
                          }}
                          className="text-[10px] px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"
                        >
                          None
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {g.items.map((opt) => {
                        const checked = !!formData.navFeatureAccess[opt.id];
                        return (
                          <label key={opt.id} className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:border-gray-500">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => setFormData({
                                ...formData,
                                navFeatureAccess: { ...formData.navFeatureAccess, [opt.id]: e.target.checked },
                              })}
                              className="accent-green-500"
                            />
                            <span className="text-xs text-gray-200">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-feature numeric quotas — every key from FEATURE_LIMITS_REGISTRY */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                Feature Quotas <span className="text-xs font-normal text-gray-500">(per-feature numeric limits — use -1 for Unlimited)</span>
              </h4>
              <div className="space-y-4">
                {LIMITS_BY_GROUP.map((g) => (
                  <div key={g.group}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{g.label}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {g.items.map((def) => {
                        const cur = formData.featureLimits[def.key] || { value: def.defaultValue, period: def.defaultPeriod };
                        return (
                          <div key={def.key} className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded">
                            <span className="text-xs text-gray-200 flex-1 min-w-0 truncate" title={def.label}>{def.label}</span>
                            <input
                              type="number"
                              value={cur.value}
                              onChange={(e) => setFormData({
                                ...formData,
                                featureLimits: {
                                  ...formData.featureLimits,
                                  [def.key]: { ...cur, value: Number(e.target.value) },
                                },
                              })}
                              className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                            />
                            <select
                              value={cur.period}
                              onChange={(e) => setFormData({
                                ...formData,
                                featureLimits: {
                                  ...formData.featureLimits,
                                  [def.key]: { ...cur, period: e.target.value as FeaturePeriod },
                                },
                              })}
                              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                            >
                              {PERIOD_OPTIONS.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Check size={20} />
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {plans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No plans available</div>
        ) : (
          plans.map((plan) => {
            const rolesForPlan = planRoles[plan.planId] || [];
            const derivedFeatures =
              matrixFeatures.length > 0
                ? matrixFeatureLabelsForPlan(matrixFeatures, plan.planId)
                : plan.features;
            return (
              <div key={plan.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${plan.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {plan.isActive ? 'Active' : 'Hidden'}
                    </span>
                    {plan.isCustom && (
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-semibold">
                        Custom
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Monthly</p>
                    <p className="text-lg font-bold">${plan.priceMonthly}</p>
                  </div>
                  {plan.priceYearly && (
                    <div>
                      <p className="text-gray-400 text-sm">Yearly</p>
                      <p className="text-lg font-bold">${plan.priceYearly}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-sm">Currency</p>
                    <p className="text-lg font-bold">{plan.currency}</p>
                  </div>
                </div>

                {/* Role Access Section */}
                <div className="mb-4 bg-[#0F0F0F] border border-[#2a2a2a] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={13} className="text-[#FF0000]" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role Access (from Feature Matrix)</p>
                  </div>
                  {rolesForPlan.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rolesForPlan.map(role => (
                        <span
                          key={role}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[role] || 'bg-gray-500/20 text-gray-400'}`}
                        >
                          <Users size={10} />
                          {ROLE_LABELS[role] || role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 italic">
                      No roles assigned yet — set them in Unified Feature Matrix
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Features:
                    {matrixFeatures.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-emerald-500/90">(from Feature Matrix)</span>
                    )}
                  </p>
                  {derivedFeatures.length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {derivedFeatures.map((feature, idx) => (
                        <li key={`${feature}-${idx}`}>{feature}</li>
                      ))}
                    </ul>
                  ) : matrixFeatures.length > 0 ? (
                    <p className="text-xs text-gray-600 italic">
                      No features enabled for this plan in the matrix — toggle plan access or roles in Unified Feature Matrix.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 italic">
                      No features listed — save lines under Edit Plan, or open Unified Feature Matrix after it loads.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${plan.isActive ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    {plan.isActive ? <><EyeOff size={16} /> Hide</> : <><Eye size={16} /> Show</>}
                  </button>
                  <button
                    onClick={() => handleEdit(plan)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
