'use client';

export const dynamic = "force-dynamic";

import { ReactNode, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { Activity, Brain, Bot, RefreshCcw } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

type MonitorData = {
  model?: { version?: string; trainedAt?: string } | null;
  totalPredictions: number;
  labeledPredictions?: number;
  support: { autoReplied: number; escalated: number; avgConfidence: number };
  queue: Array<{ _id: string; count: number }>;
  confidenceDistribution: Array<{ _id: string | number; count: number }>;
};

export default function AiMonitoringPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [m1, m2] = await Promise.all([
        axios.get('/api/admin/super/ai-monitoring', { headers: getAuthHeaders() }),
        axios.get('/api/ai/metrics?scope=global', { headers: getAuthHeaders() }),
      ]);
      setData(m1.data || null);
      setMetrics(m2.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const supportPie = useMemo(
    () => [
      { name: 'Auto replied', value: data?.support?.autoReplied || 0, color: '#22c55e' },
      { name: 'Escalated', value: data?.support?.escalated || 0, color: '#f59e0b' },
    ],
    [data]
  );

  if (loading) return <div className="p-8 text-white/60">Loading AI monitoring...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-red-400" /> AI Monitoring
          </h1>
          <p className="text-sm text-white/40 mt-1">Model health, accuracy, queue and support automation</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Active Model" value={data?.model?.version || 'N/A'} icon={<Brain className="w-4 h-4 text-red-400" />} />
        <Card title="Total Predictions" value={String(data?.totalPredictions || 0)} icon={<Activity className="w-4 h-4 text-blue-400" />} />
        <Card
          title="Ground-truth labeled"
          value={String(metrics?.labeledForMetrics ?? 0)}
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
        />
        <Card
          title="MAE / RMSE (labeled)"
          value={
            metrics?.insufficientGroundTruth
              ? 'Need 5+ labels'
              : `${metrics?.mae ?? '—'} / ${metrics?.rmse ?? '—'}`
          }
          icon={<Activity className="w-4 h-4 text-emerald-400" />}
        />
        <Card title="Avg AI Confidence" value={`${Math.round((data?.support?.avgConfidence || 0) * 100)}%`} icon={<Bot className="w-4 h-4 text-violet-400" />} />
      </div>

      {metrics?.definition ? (
        <p className="text-xs text-white/40 max-w-4xl">{metrics.definition}</p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Support AI Auto-reply vs Escalation">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={supportPie} dataKey="value" nameKey="name" outerRadius={100}>
                  {supportPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Queue Status">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.queue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                <XAxis dataKey="_id" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Model Accuracy Trend (MAE over time)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics?.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="mae" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

function Card({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">{title}</p>
        {icon}
      </div>
      <p className="text-xl font-semibold text-white mt-3">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
      <p className="text-sm font-medium text-white mb-3">{title}</p>
      {children}
    </div>
  );
}
