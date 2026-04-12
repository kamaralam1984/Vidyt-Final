'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Shield, Users } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

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
}

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
  'user':        'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  'manager':     'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'admin':       'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  'super-admin': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'enterprise':  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'custom':      'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const ROLE_LABELS: Record<string, string> = {
  'user':        'User',
  'manager':     'Manager',
  'admin':       'Admin',
  'super-admin': 'Super Admin',
  'enterprise':  'Enterprise Plan',
  'custom':      'Custom',
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
    setFormData({
      planId: plan.planId,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly || 0,
      currency: plan.currency,
      features: plan.features.join('\n'),
      billingPeriod: plan.billingPeriod,
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
