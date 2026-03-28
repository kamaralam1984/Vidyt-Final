'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Zap, Crown, Sparkles, Rocket, Globe } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

/**
 * Unified Super Admin - Plan & Role Control Panel
 * Single page to manage all plans and roles
 */
export default function PlanControlPanel() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/plans', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
      } else {
        setError(data.error || 'Failed to fetch plans');
      }
    } catch (err: any) {
      setError(err.message);
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          id: plan._id,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`✓ ${plan.name} updated to ${newRole} role`);
        setTimeout(() => setSuccess(null), 3000);
        fetchPlans();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  type RoleCard = {
    color: string;
    badgeColor: string;
    level: number;
    description: string;
    features: string[];
  };

  const roleInfo: Record<string, RoleCard> = {
    user: {
      color: '#AAAAAA',
      badgeColor: 'bg-gray-500',
      level: 1,
      description: 'Basic features',
      features: ['Upload Videos', 'Analyze Videos', 'View Own Analytics'],
    },
    manager: {
      color: '#FF0000',
      badgeColor: 'bg-red-500',
      level: 2,
      description: 'Team features',
      features: ['All User Features', 'Create Teams', 'Team Analytics'],
    },
    admin: {
      color: '#FFD700',
      badgeColor: 'bg-amber-500',
      level: 3,
      description: 'Advanced & API',
      features: ['All Manager Features', 'Use API', 'Custom Models'],
    },
  };

  const planIcons: Record<string, any> = {
    free: Sparkles,
    starter: Rocket,
    pro: Zap,
    enterprise: Crown,
    custom: Globe,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Plan & Role Control</h1>
          <p className="text-gray-400">Manage subscription plans and assign user roles</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg flex items-start gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg flex items-center gap-2 animate-pulse">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          {loading && plans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-gray-600 border-t-red-500 rounded-full"></div>
              </div>
              <p className="text-gray-400 mt-4">Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No plans found</p>
            </div>
          ) : (
            plans.map((plan) => {
              const Icon = planIcons[plan.planId] || Globe;
              const info =
                roleInfo[String(plan.role ?? 'user')] ?? roleInfo.user;

              return (
                <div
                  key={plan.planId}
                  className="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
                >
                  {/* Icon & Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${info.color}20` }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{ color: info.color }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-gray-400 text-xs">{plan.planId}</p>
                      </div>
                    </div>
                    <span
                      className={`${info.badgeColor} text-white px-3 py-1 rounded-full text-xs font-semibold`}
                    >
                      Lvl {info.level}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-4 pb-4 border-b border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Monthly Price</div>
                    <div className="text-2xl font-bold text-white">
                      ${plan.priceMonthly}
                      <span className="text-sm text-gray-400 ml-1">/mo</span>
                    </div>
                  </div>

                  {/* Current Role */}
                  <div className="mb-4 pb-4 border-b border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Current Role</div>
                    <div className="flex items-center gap-2">
                      <span className={`${info.badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                        {plan.role.charAt(0).toUpperCase() + plan.role.slice(1)}
                      </span>
                      <span className="text-gray-400 text-xs">{info.description}</span>
                    </div>
                  </div>

                  {/* Role Features */}
                  <div className="mb-4 pb-4 border-b border-gray-700">
                    <div className="text-xs text-gray-400 font-semibold mb-2">Key Features</div>
                    <ul className="space-y-1">
                      {info.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-xs">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Change Role */}
                  <div>
                    <div className="text-xs text-gray-400 font-semibold mb-2">Change Role</div>
                    <div className="grid grid-cols-2 gap-2">
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
                            {role === 'user'
                              ? 'User'
                              : role === 'manager'
                              ? 'Manager'
                              : 'Admin'}
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

        {/* Role Hierarchy Guide */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Role Hierarchy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                level: 1,
                role: 'User',
                color: 'bg-gray-500',
                details: 'Free & Starter plans',
                permissions: 'Video upload, Analysis, Own analytics',
              },
              {
                level: 2,
                role: 'Manager',
                color: 'bg-red-500',
                details: 'Pro plan',
                permissions: 'All User + Teams, Scheduling, Team analytics',
              },
              {
                level: 3,
                role: 'Admin',
                color: 'bg-amber-500',
                details: 'Enterprise & Custom',
                permissions: 'All Manager + API, Custom models, White-label',
              },
            ].map((item) => (
              <div key={item.level} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`${item.color} text-white px-2 py-1 rounded text-xs font-semibold`}>
                    Level {item.level}
                  </span>
                  <span className="text-white font-semibold">{item.role}</span>
                </div>
                <p className="text-gray-400 text-xs mb-2">{item.details}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{item.permissions}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-xs">Total Plans</div>
            <div className="text-2xl font-bold text-white mt-1">{plans.length}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-xs">Role Levels</div>
            <div className="text-2xl font-bold text-white mt-1">4</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-xs">Permissions</div>
            <div className="text-2xl font-bold text-white mt-1">40+</div>
          </div>
        </div>
      </div>
    </div>
  );
}
