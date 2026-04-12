'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RevenueMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number; // percentage
  gradient?: string;
  index?: number;
}

export default function RevenueMetricCard({
  title, value, subtitle, icon: Icon, trend, gradient, index = 0
}: RevenueMetricCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#141414] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-colors"
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-4">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tighter">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          
          <div className="flex items-center gap-2 mt-2">
            {trend !== undefined && (
              <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                isPositive ? 'bg-emerald-500/10 text-emerald-400' :
                isNegative ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/30'
              }`}>
                {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : isNegative ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                {Math.abs(trend)}%
              </div>
            )}
            {subtitle && <p className="text-[10px] text-white/30 font-medium">{subtitle}</p>}
          </div>
        </div>

        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient || 'from-white/5 to-white/10'} flex items-center justify-center text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Background Glow */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient || 'from-white/5 to-white/10'} blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
    </motion.div>
  );
}
