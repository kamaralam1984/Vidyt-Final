'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Plus, Edit2, Trash2, X, Check, Tag, Percent,
  Calendar, Clock, ToggleLeft, ToggleRight, Copy, Search,
  Filter, Hash, Users, TrendingUp, Gift, Zap, Eye, EyeOff,
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface Discount {
  id: string;
  planId: string;
  label: string;
  couponCode: string;
  percentage: number;
  billingPeriod: 'monthly' | 'yearly' | 'both';
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  maxUses: number;
  usageCount: number;
  createdAt: string;
}

const ALL_PLANS = ['starter', 'pro', 'enterprise', 'custom', 'owner'];

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: 'bg-white/5', text: 'text-white/50', border: 'border-white/10' },
  starter: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  pro: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  enterprise: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  custom: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  owner: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

type FilterStatus = 'all' | 'active' | 'inactive' | 'expired';

export default function PlanDiscountsManager() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showExpired, setShowExpired] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  const [formData, setFormData] = useState({
    planIds: ['pro'] as string[],
    label: '',
    couponCode: '',
    percentage: 20,
    billingPeriod: 'both' as 'monthly' | 'yearly' | 'both',
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    maxUses: 0,
  });

  useEffect(() => {
    fetchDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showExpired]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const url = showExpired
        ? '/api/admin/plan-discounts?all=true'
        : '/api/admin/plan-discounts';
      const res = await axios.get(url, { headers: getAuthHeaders() });
      if (res.data.success) {
        setDiscounts(res.data.discounts || []);
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (formData.planIds.length === 0) {
        setError('Select at least one plan'); return;
      }
      if (formData.percentage < 1 || formData.percentage > 100) {
        setError('Percentage must be 1-100'); return;
      }
      if (new Date(formData.endsAt) <= new Date(formData.startsAt)) {
        setError('End date must be after start date'); return;
      }

      const payload = {
        ...formData,
        couponCode: formData.couponCode.trim() || undefined,
        maxUses: formData.maxUses || 0,
      };

      if (editingId) {
        const res = await axios.patch('/api/admin/plan-discounts', {
          id: editingId,
          planId: formData.planIds[0],
          label: formData.label,
          couponCode: formData.couponCode.trim() || undefined,
          percentage: formData.percentage,
          billingPeriod: formData.billingPeriod,
          startsAt: formData.startsAt,
          endsAt: formData.endsAt,
          maxUses: formData.maxUses,
        }, { headers: getAuthHeaders() });
        if (res.data.success) {
          showSuccess('Discount updated successfully');
          fetchDiscounts();
          resetForm();
        }
      } else {
        const res = await axios.post('/api/admin/plan-discounts', payload, { headers: getAuthHeaders() });
        if (res.data.success) {
          showSuccess(`${res.data.discounts?.length || 1} discount(s) created`);
          fetchDiscounts();
          resetForm();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save discount');
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await axios.patch('/api/admin/plan-discounts', {
        id: discount.id,
        isActive: !discount.isActive,
      }, { headers: getAuthHeaders() });
      if (res.data.success) {
        showSuccess(`Discount ${discount.isActive ? 'deactivated' : 'activated'}`);
        fetchDiscounts();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle discount');
    }
  };

  const handleEdit = (d: Discount) => {
    setFormData({
      planIds: [d.planId],
      label: d.label,
      couponCode: d.couponCode,
      percentage: d.percentage,
      billingPeriod: d.billingPeriod || 'both',
      startsAt: d.startsAt.split('T')[0],
      endsAt: d.endsAt.split('T')[0],
      maxUses: d.maxUses,
    });
    setEditingId(d.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this discount?')) return;
    try {
      const res = await axios.delete('/api/admin/plan-discounts', {
        params: { id },
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        showSuccess('Discount deleted');
        fetchDiscounts();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const resetForm = () => {
    setFormData({
      planIds: ['pro'],
      label: '',
      couponCode: '',
      percentage: 20,
      billingPeriod: 'both',
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      maxUses: 0,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const togglePlan = (plan: string) => {
    setFormData(prev => ({
      ...prev,
      planIds: prev.planIds.includes(plan)
        ? prev.planIds.filter(p => p !== plan)
        : [...prev.planIds, plan],
    }));
  };

  const getDiscountStatus = (d: Discount): { label: string; color: string } => {
    const now = new Date();
    const start = new Date(d.startsAt);
    const end = new Date(d.endsAt);
    if (!d.isActive) return { label: 'Disabled', color: 'text-white/30 bg-white/5' };
    if (now < start) return { label: 'Scheduled', color: 'text-amber-400 bg-amber-500/10' };
    if (now > end) return { label: 'Expired', color: 'text-red-400 bg-red-500/10' };
    if (d.maxUses > 0 && d.usageCount >= d.maxUses) return { label: 'Maxed Out', color: 'text-orange-400 bg-orange-500/10' };
    return { label: 'Live', color: 'text-emerald-400 bg-emerald-500/10' };
  };

  // Filtered discounts
  const filtered = useMemo(() => {
    return discounts.filter(d => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (!d.planId.includes(q) && !d.label.toLowerCase().includes(q) && !d.couponCode.toLowerCase().includes(q)) {
          return false;
        }
      }
      // Plan filter
      if (filterPlan !== 'all' && d.planId !== filterPlan) return false;
      // Status filter
      if (filterStatus !== 'all') {
        const status = getDiscountStatus(d).label.toLowerCase();
        if (filterStatus === 'active' && status !== 'live') return false;
        if (filterStatus === 'inactive' && status !== 'disabled') return false;
        if (filterStatus === 'expired' && status !== 'expired') return false;
      }
      return true;
    });
  }, [discounts, search, filterPlan, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const live = discounts.filter(d => d.isActive && new Date(d.startsAt) <= now && new Date(d.endsAt) >= now).length;
    const scheduled = discounts.filter(d => d.isActive && new Date(d.startsAt) > now).length;
    const totalUsage = discounts.reduce((s, d) => s + d.usageCount, 0);
    const withCoupon = discounts.filter(d => d.couponCode).length;
    return { total: discounts.length, live, scheduled, totalUsage, withCoupon };
  }, [discounts]);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header + Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-red-400" />
            Plan Discounts & Coupons
          </h2>
          <p className="text-white/40 text-xs mt-1">Manage promotional discounts, coupon codes, and pricing offers</p>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showForm
              ? 'bg-white/5 border border-white/10 text-white/60'
              : 'bg-red-600 hover:bg-red-700 text-white border border-red-500/30'
          }`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Discount'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Tag, color: 'text-white/60' },
          { label: 'Live Now', value: stats.live, icon: Zap, color: 'text-emerald-400' },
          { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'text-amber-400' },
          { label: 'Total Uses', value: stats.totalUsage, icon: Users, color: 'text-blue-400' },
          { label: 'With Coupon', value: stats.withCoupon, icon: Hash, color: 'text-violet-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#141414] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                <Gift className="w-4 h-4 text-red-400" />
                {editingId ? 'Edit Discount' : 'Create New Discount'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Plans Selection */}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">
                    {editingId ? 'Plan' : 'Plans (select one or more)'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PLANS.map(plan => {
                      const selected = formData.planIds.includes(plan);
                      const pc = PLAN_COLORS[plan] || PLAN_COLORS.free;
                      return (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => editingId ? setFormData(prev => ({ ...prev, planIds: [plan] })) : togglePlan(plan)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                            selected
                              ? `${pc.bg} ${pc.text} ${pc.border}`
                              : 'bg-white/3 text-white/30 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Percentage */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Discount %</label>
                    <div className="relative">
                      <Percent className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.percentage}
                        onChange={e => setFormData({ ...formData, percentage: Number(e.target.value) })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      />
                    </div>
                  </div>

                  {/* Billing Period */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Applies To</label>
                    <select
                      value={formData.billingPeriod}
                      onChange={e => setFormData({ ...formData, billingPeriod: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    >
                      <option value="both">Monthly & Yearly</option>
                      <option value="monthly">Monthly Only</option>
                      <option value="yearly">Yearly Only</option>
                    </select>
                  </div>

                  {/* Max Uses */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Max Uses (0 = unlimited)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.maxUses}
                      onChange={e => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Start Date</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={formData.startsAt}
                        onChange={e => setFormData({ ...formData, startsAt: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">End Date</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={formData.endsAt}
                        onChange={e => setFormData({ ...formData, endsAt: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Label */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Label (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Early Bird, Black Friday, Summer Sale"
                      value={formData.label}
                      onChange={e => setFormData({ ...formData, label: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>

                  {/* Coupon Code */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Coupon Code (optional)</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. SAVE20, LAUNCH50"
                        value={formData.couponCode}
                        onChange={e => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono uppercase placeholder:text-white/15 placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Preview</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {formData.planIds.map(p => (
                      <span key={p} className={`text-xs font-medium px-2 py-1 rounded ${PLAN_COLORS[p]?.bg || ''} ${PLAN_COLORS[p]?.text || ''}`}>
                        {p}
                      </span>
                    ))}
                    <span className="text-red-400 font-bold text-lg">{formData.percentage}% OFF</span>
                    {formData.couponCode && (
                      <span className="text-xs font-mono bg-violet-500/10 text-violet-400 px-2 py-1 rounded border border-violet-500/20">
                        {formData.couponCode}
                      </span>
                    )}
                    <span className="text-[10px] text-white/30">
                      {formData.billingPeriod === 'both' ? 'Monthly & Yearly' : formData.billingPeriod}
                    </span>
                    {formData.label && <span className="text-xs text-white/40">&ldquo;{formData.label}&rdquo;</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {editingId ? 'Update Discount' : `Create ${formData.planIds.length > 1 ? formData.planIds.length + ' Discounts' : 'Discount'}`}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-white/5 hover:bg-white/10 text-white/60 px-6 py-2.5 rounded-xl text-sm transition-colors border border-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plans, labels, codes..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
        </div>
        <select
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
          className="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white/60 appearance-none focus:outline-none"
        >
          <option value="all">All Plans</option>
          {ALL_PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white/60 appearance-none focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Live</option>
          <option value="inactive">Disabled</option>
          <option value="expired">Expired</option>
        </select>
        <button
          onClick={() => setShowExpired(!showExpired)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border transition-colors ${
            showExpired ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-white/30 border-white/5'
          }`}
        >
          {showExpired ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {showExpired ? 'Showing Expired' : 'Hide Expired'}
        </button>
      </div>

      {/* Discounts Table */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">{discounts.length === 0 ? 'No discounts yet' : 'No discounts match filters'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/3">
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Plan</th>
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Discount</th>
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Coupon</th>
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Label</th>
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Period</th>
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Duration</th>
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Usage</th>
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Status</th>
                  <th className="text-left text-[9px] text-white/30 uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const pc = PLAN_COLORS[d.planId] || PLAN_COLORS.free;
                  const status = getDiscountStatus(d);
                  return (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/3 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${pc.bg} ${pc.text} border ${pc.border}`}>
                          {d.planId.charAt(0).toUpperCase() + d.planId.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-400 font-bold text-base">{d.percentage}%</span>
                        <span className="text-red-400/50 text-xs ml-1">OFF</span>
                      </td>
                      <td className="px-4 py-3">
                        {d.couponCode ? (
                          <button
                            onClick={() => copyCode(d.couponCode)}
                            className="flex items-center gap-1.5 font-mono text-xs bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-lg border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
                          >
                            {d.couponCode}
                            <Copy className="w-3 h-3" />
                            {copiedCode === d.couponCode && <span className="text-emerald-400 text-[9px]">Copied!</span>}
                          </button>
                        ) : (
                          <span className="text-white/15 text-xs">Auto-apply</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">{d.label || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
                          {d.billingPeriod === 'both' ? 'M+Y' : d.billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] text-white/40">
                          <div>{new Date(d.startsAt).toLocaleDateString()}</div>
                          <div className="text-white/20">to {new Date(d.endsAt).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-white/50 font-mono">
                          {d.usageCount}{d.maxUses > 0 ? `/${d.maxUses}` : '/∞'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleActive(d)}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            title={d.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {d.isActive ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-white/20" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(d)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
