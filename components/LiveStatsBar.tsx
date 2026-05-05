'use client';

import { useEffect, useState, useRef } from 'react';
import { Users, Download, MousePointerClick } from 'lucide-react';

interface Stats {
  users: number;
  downloads: number;
  pageViews: number;
}

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start || target === 0) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      setCount(current);
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target, duration, start]);

  return count;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M+';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K+';
  return n.toString() + '+';
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  animate,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  animate: boolean;
}) {
  const displayed = useCountUp(value, 2000, animate);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <p className="text-3xl md:text-4xl font-black" style={{ color }}>
        {animate ? formatNumber(displayed) : '—'}
      </p>
      <p className="text-[#AAAAAA] text-sm font-medium">{label}</p>
    </div>
  );
}

export default function LiveStatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ref.current || !stats) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [stats]);

  return (
    <section ref={ref} className="py-16 px-6 bg-[#0F0F0F] border-b border-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-[#555555] text-xs uppercase tracking-widest font-semibold mb-10">
          Live Statistics
        </p>
        <div className="grid grid-cols-3 gap-6 text-center">
          <StatCard
            icon={Users}
            label="Registered Users"
            value={stats?.users ?? 0}
            color="#FF0000"
            animate={animate}
          />
          <StatCard
            icon={MousePointerClick}
            label="Page Visits"
            value={stats?.pageViews ?? 0}
            color="#3EA6FF"
            animate={animate}
          />
          <StatCard
            icon={Download}
            label="App Downloads"
            value={stats?.downloads ?? 0}
            color="#2BA640"
            animate={animate}
          />
        </div>
      </div>
    </section>
  );
}
