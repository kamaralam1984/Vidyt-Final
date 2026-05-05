'use client';

import { useEffect, useState, useRef } from 'react';
import { Users, Download, MousePointerClick, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface Stats {
  users: number;
  downloads: number;
  pageViews: number;
}

function useCountUp(target: number, duration = 2200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    const steps = 80;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
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

// Floating sparkle particle
function Particle({ color, delay }: { color: string; delay: number }) {
  const size = Math.random() * 4 + 2;
  const x = Math.random() * 100;
  const duration = Math.random() * 3 + 2;
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: 0,
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}`,
      }}
      animate={{
        y: [0, -(80 + Math.random() * 60)],
        opacity: [0, 0.9, 0],
        scale: [0.5, 1.2, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3 + 1,
        ease: 'easeOut',
      }}
    />
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  animate: shouldAnimate,
  delay,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  animate: boolean;
  delay: number;
}) {
  const displayed = useCountUp(value, 2200, shouldAnimate);
  const [done, setDone] = useState(false);
  const particles = useRef(
    Array.from({ length: 8 }, (_, i) => ({ id: i, delay: i * 0.15 }))
  );

  useEffect(() => {
    if (shouldAnimate) {
      const t = setTimeout(() => setDone(true), 2500);
      return () => clearTimeout(t);
    }
  }, [shouldAnimate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.05, y: -6 }}
      className="relative flex flex-col items-center gap-3 p-6 md:p-8 rounded-3xl overflow-hidden cursor-default"
      style={{
        background: `linear-gradient(135deg, ${color}10 0%, #0F0F0F 60%)`,
        border: `1px solid ${color}30`,
        boxShadow: shouldAnimate ? `0 0 40px ${color}18, inset 0 0 20px ${color}08` : 'none',
      }}
    >
      {/* Animated gradient orb background */}
      <motion.div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: color, opacity: 0.12 }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: color, opacity: 0.08 }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.current.map((p) => (
          <Particle key={p.id} color={color} delay={p.delay} />
        ))}
      </div>

      {/* Beam sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${color}18 50%, transparent 60%)`,
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'linear' }}
      />

      {/* Icon with pulse ring */}
      <div className="relative z-10">
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ border: `2px solid ${color}` }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          animate={shouldAnimate ? { rotate: [0, -8, 8, 0] } : {}}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </motion.div>
      </div>

      {/* Count number */}
      <motion.p
        className="text-3xl md:text-5xl font-black z-10 relative tabular-nums"
        style={{
          color,
          textShadow: shouldAnimate ? `0 0 20px ${color}80, 0 0 40px ${color}40` : 'none',
        }}
        animate={done ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {shouldAnimate ? formatNumber(displayed) : '—'}
      </motion.p>

      {/* Label */}
      <p className="text-[#AAAAAA] text-xs md:text-sm font-semibold uppercase tracking-widest z-10 text-center">
        {label}
      </p>

      {/* Live dot */}
      {shouldAnimate && (
        <div className="flex items-center gap-1.5 z-10">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
            Live
          </span>
        </div>
      )}
    </motion.div>
  );
}

const FALLBACK: Stats = { users: 10500, downloads: 7600, pageViews: 75000 };

export default function LiveStatsBar() {
  const [stats, setStats] = useState<Stats>(FALLBACK);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data: Stats) => {
        if (data && data.users > 0) setStats(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShouldAnimate(true); },
      { threshold: 0.2 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative py-20 px-6 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #0F0F0F 100%)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Big glow orbs in background */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#FF0000]/8 rounded-full blur-[80px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#3EA6FF]/8 rounded-full blur-[80px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-[#2BA640]/6 rounded-full blur-[60px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4">
            <motion.div
              className="w-2 h-2 rounded-full bg-[#2BA640]"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#AAAAAA]">
              Live Statistics
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Trusted by Creators{' '}
            <span className="text-[#FF0000]">Worldwide</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            label="Registered Users"
            value={stats?.users ?? 0}
            color="#FF0000"
            animate={shouldAnimate}
            delay={0}
          />
          <StatCard
            icon={MousePointerClick}
            label="Page Visits"
            value={stats?.pageViews ?? 0}
            color="#3EA6FF"
            animate={shouldAnimate}
            delay={0.15}
          />
          <StatCard
            icon={Download}
            label="App Downloads"
            value={stats?.downloads ?? 0}
            color="#2BA640"
            animate={shouldAnimate}
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}
