'use client';

import { useState } from 'react';
import {
  LayoutGrid,
  Sliders,
  Grid3x3,
  Shield,
  Youtube,
  Percent,
  Database,
  UserCog,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import UnifiedControlPanel from '@/components/admin/UnifiedControlPanel';
import PlanConfigEditor from '@/components/admin/PlanConfigEditor';
import UnifiedFeatureMatrix from '@/components/admin/UnifiedFeatureMatrix';
import SystemAccessMatrix from '@/components/admin/SystemAccessMatrix';
import YtSeoSectionControl from '@/components/admin/YtSeoSectionControl';
import PlanDiscountsManager from '@/components/admin/PlanDiscountsManager';
import PlanManager from '@/components/admin/PlanManager';
import UserPlanManager from '@/components/admin/UserPlanManager';

const PLAN_TABS = ['free', 'starter', 'pro', 'enterprise', 'custom'] as const;

/**
 * Single Super Admin page: plans, roles, platform toggles, per-plan limits/flags,
 * unified feature matrix, system access, YT SEO, discounts & plan DB tools.
 */
export default function SuperAdminControlCenter() {
  const [planTab, setPlanTab] = useState<(typeof PLAN_TABS)[number]>('free');
  const [openDiscounts, setOpenDiscounts] = useState(true);
  const [openPlanDb, setOpenPlanDb] = useState(false);
  const [openUserPlans, setOpenUserPlans] = useState(false);

  return (
    <div className="p-6 md:p-8 space-y-10 pb-24 max-w-[1600px] mx-auto">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
          <LayoutGrid className="w-4 h-4" />
          SaaS Control Center
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Plan, role & feature control</h1>
        <p className="text-white/45 text-sm max-w-2xl">
          Sab kuch ek page: plan par base role, platform access, AI feature flags, limits, discounts aur plan
          database — alag role/feature pages ki zaroorat nahi.
        </p>
      </header>

      <section aria-label="Plans roles platform">
        <UnifiedControlPanel embedded />
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 md:p-8" aria-label="Per-plan limits">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Per-plan configuration</h2>
        </div>
        <p className="text-white/40 text-sm mb-6">Har plan ke liye limits, feature flags aur role — tab se choose karein.</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {PLAN_TABS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlanTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                planTab === id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {id}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden bg-[#141414]">
          <PlanConfigEditor key={planTab} propPlanId={planTab} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 md:p-8 overflow-x-auto" aria-label="Unified feature matrix">
        <div className="flex items-center gap-2 mb-4">
          <Grid3x3 className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Unified feature matrix</h2>
        </div>
        <p className="text-white/40 text-sm mb-6">AI tools × plan — ek hi grid se control.</p>
        <UnifiedFeatureMatrix />
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 md:p-8" aria-label="System access">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">System access matrix</h2>
        </div>
        <SystemAccessMatrix />
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 md:p-8" aria-label="YouTube SEO sections">
        <div className="flex items-center gap-2 mb-4">
          <Youtube className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-white">YouTube SEO sections</h2>
        </div>
        <YtSeoSectionControl />
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden" aria-label="Discounts">
        <button
          type="button"
          onClick={() => setOpenDiscounts((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-2 font-semibold text-amber-100">
            <Percent className="w-5 h-5" />
            Plan discounts
          </span>
          {openDiscounts ? <ChevronDown className="w-5 h-5 text-white/50" /> : <ChevronRight className="w-5 h-5 text-white/50" />}
        </button>
        {openDiscounts && (
          <div className="px-6 pb-6 border-t border-white/5 pt-4">
            <PlanDiscountsManager />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] overflow-hidden" aria-label="Plan database">
        <button
          type="button"
          onClick={() => setOpenPlanDb((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-2 font-semibold text-white">
            <Database className="w-5 h-5 text-sky-400" />
            Manage plans (database)
          </span>
          {openPlanDb ? <ChevronDown className="w-5 h-5 text-white/50" /> : <ChevronRight className="w-5 h-5 text-white/50" />}
        </button>
        {openPlanDb && (
          <div className="px-6 pb-6 border-t border-white/5 pt-4">
            <PlanManager />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] overflow-hidden" aria-label="User plans">
        <button
          type="button"
          onClick={() => setOpenUserPlans((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-2 font-semibold text-white">
            <UserCog className="w-5 h-5 text-fuchsia-400" />
            User ↔ plan assignment
          </span>
          {openUserPlans ? <ChevronDown className="w-5 h-5 text-white/50" /> : <ChevronRight className="w-5 h-5 text-white/50" />}
        </button>
        {openUserPlans && (
          <div className="px-6 pb-6 border-t border-white/5 pt-4">
            <UserPlanManager />
          </div>
        )}
      </section>
    </div>
  );
}
