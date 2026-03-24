'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  conversionRate: number;
}

const STEP_COLORS: Record<string, string> = {
  pricing_visit: '#60a5fa',
  plan_selected: '#a78bfa',
  payment_initiated: '#fbbf24',
  payment_success: '#34d399',
  payment_failed: '#f87171',
};

export default function PaymentFunnel() {
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [overallConversion, setOverallConversion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = getAuthHeaders();
    fetch('/api/admin/super/analytics/funnel', { headers })
      .then(r => r.json())
      .then(data => {
        setSteps(data.steps || []);
        setOverallConversion(data.overallConversion || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Payment Funnel</h3>
          <p className="text-xs text-white/30 mt-0.5">Last 30 days · User journey from pricing to purchase</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/30 uppercase tracking-wider">Overall Conversion</p>
          <p className="text-2xl font-bold text-emerald-400">{overallConversion}%</p>
        </div>
      </div>

      {/* Funnel Visual */}
      <div className="space-y-2">
        {steps.filter(s => s.step !== 'payment_failed').map((step, idx, arr) => {
          const maxCount = arr[0]?.count || 1;
          const widthPct = Math.max(10, (step.count / maxCount) * 100);
          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-white/20" />}
                  {step.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-white/40">{step.count.toLocaleString()} users</span>
                  <span className={`font-bold tabular-nums ${
                    step.conversionRate > 60 ? 'text-emerald-400' :
                    step.conversionRate > 30 ? 'text-amber-400' : 'text-red-400'
                  }`}>{step.conversionRate}%</span>
                </div>
              </div>
              <div className="h-7 bg-white/5 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="h-full rounded-lg flex items-center px-3"
                  style={{ backgroundColor: STEP_COLORS[step.step] + '30', borderRight: `2px solid ${STEP_COLORS[step.step]}` }}
                >
                  <span className="text-[10px] font-bold" style={{ color: STEP_COLORS[step.step] }}>
                    {step.count}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Failed Payments Note */}
      {steps.find(s => s.step === 'payment_failed') && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <span className="text-white/40">Failed Payments</span>
          <span className="text-red-400 font-bold">
            {steps.find(s => s.step === 'payment_failed')?.count.toLocaleString() || 0}
          </span>
        </div>
      )}

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={steps} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#ffffff30', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            tickFormatter={v => v.split(' ').slice(-1)[0]}
          />
          <YAxis tick={{ fill: '#ffffff30', fontSize: 9 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8, fontSize: 11 }}
          />
          <Bar dataKey="count" name="Users" radius={[4, 4, 0, 0]}>
            {steps.map((s) => (
              <Cell key={s.step} fill={STEP_COLORS[s.step] || '#60a5fa'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
