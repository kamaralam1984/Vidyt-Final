'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Radio,
  Clock,
  Settings,
  ChevronRight,
  Zap,
  BarChart2,
  Headphones,
  Cpu,
} from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/admin/super/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/super/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/super/users', label: 'Users', icon: Users },
  { href: '/admin/super/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/super/live', label: 'Live Tracking', icon: Radio },
  { href: '/admin/super/sessions', label: 'Sessions', icon: Clock },
  { href: '/admin/super/support', label: 'Support Queue', icon: Headphones },
  { href: '/admin/super/ai-monitoring', label: 'AI Monitoring', icon: Cpu },
  { href: '/admin/super/platform-controls', label: 'Platform Controls', icon: Settings },
];

export default function SuperSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f0f0f] border-r border-white/5 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">ViralBoost</p>
            <p className="text-[10px] text-red-400 uppercase tracking-widest font-medium">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <motion.div key={href} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600/20 text-red-400 border border-red-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <p className="px-4 text-[11px] text-white/30">Super admin controls</p>
      </div>
    </aside>
  );
}
