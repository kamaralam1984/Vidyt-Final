'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Radio,
  Clock,
  ChevronRight,
  BarChart2,
  Headphones,
  Cpu,
  Package,
  SearchCode,
  Sparkles,
  Network,
  ShieldAlert,
  Workflow,
  Mail,
  SlidersHorizontal,
  Server,
  Gauge,
} from 'lucide-react';
import { motion } from 'framer-motion';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  isPremium?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin/super/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/super/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { href: '/admin/super/live', label: 'Live Tracking', icon: Radio },
      { href: '/admin/super/sessions', label: 'Sessions', icon: Clock },
      { href: '/admin/super/ai-monitoring', label: 'AI Monitoring', icon: Cpu },
    ],
  },
  {
    title: 'Users',
    items: [
      { href: '/admin/super/users', label: 'Users', icon: Users },
      { href: '/admin/super/support', label: 'Support Tickets', icon: Headphones },
    ],
  },
  {
    title: 'Plans & Revenue',
    items: [
      { href: '/admin/super/plans', label: 'Control Center', icon: Package },
      { href: '/admin/super/revenue', label: 'Revenue', icon: DollarSign },
    ],
  },
  {
    title: 'Controls',
    items: [
      { href: '/admin/super/platform-controls', label: 'Platform Controls', icon: Gauge },
      { href: '/admin/super/dashboard-control', label: 'Dashboard Control', icon: SlidersHorizontal },
      { href: '/admin/super/backend-control', label: 'Backend Control', icon: Server, isPremium: true },
      { href: '/admin/super/system', label: 'System Manager', icon: ShieldAlert },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/admin/super/bulk-email', label: 'Bulk Email', icon: Mail },
      { href: '/admin/super/channel-audit', label: 'Channel Intelligence', icon: SearchCode, isPremium: true },
      { href: '/admin/super/workflows', label: 'Workflows & Map', icon: Workflow },
      { href: '/admin/super/api-map', label: 'API Map', icon: Network },
    ],
  },
];

export default function SuperSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f0f0f] border-r border-white/5 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/Logo.png" alt="Vid YT" className="h-8 w-auto object-contain" />
          <div>
            <p className="text-sm font-bold text-white leading-none">Vid YT</p>
            <p className="text-[10px] text-red-400 uppercase tracking-widest font-medium">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-4 mb-1 text-[10px] uppercase tracking-widest font-semibold text-white/25">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const { href, label, icon: Icon } = item;
                const isActive = (pathname || '').startsWith(href);
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
                      {item.isPremium && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <p className="px-4 text-[11px] text-white/30">Super admin controls</p>
      </div>
    </aside>
  );
}
