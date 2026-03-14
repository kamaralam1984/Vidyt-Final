'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import {
  Home,
  Video,
  TrendingUp,
  Hash,
  Clock,
  BarChart3,
  Sparkles,
  Target,
  Facebook,
  Calendar,
  Menu,
  X,
  User,
  FileText,
  Image,
  Zap,
  Film,
} from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Top offset in pixels (e.g. 56 when using Navbar) */
  topOffset?: number;
}

export default function Sidebar({ isOpen, onToggle, topOffset = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('');
  const [userUniqueId, setUserUniqueId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [planName, setPlanName] = useState<string>('Free');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [aiStudioAllowed, setAiStudioAllowed] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: getAuthHeaders(),
        });
        if (response.data.user) {
          const u = response.data.user;
          setUserRole(u.role || 'user');
          setUserName(u.name || '');
          const uniqueId = u.uniqueId || localStorage.getItem('uniqueId');
          if (uniqueId) {
            setUserUniqueId(uniqueId);
            localStorage.setItem('uniqueId', uniqueId);
          }
          // Plan: subscriptionPlan.planName or subscription
          const subPlan = u.subscriptionPlan;
          const sub = u.subscription;
          if (subPlan?.planName) {
            setPlanName(subPlan.planName);
          } else if (sub === 'pro') {
            setPlanName('Pro');
          } else if (sub === 'enterprise') {
            setPlanName('Enterprise');
          } else {
            setPlanName('Free');
          }
          // Days left: subscriptionPlan.endDate or subscriptionExpiresAt
          const endDate = subPlan?.endDate ? new Date(subPlan.endDate) : (u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt) : null);
          if (endDate && !isNaN(endDate.getTime())) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            setDaysLeft(diff);
          } else {
            setDaysLeft(null);
          }
          try {
            const featRes = await axios.get('/api/features/ai-studio', { headers: getAuthHeaders() });
            setAiStudioAllowed(!!featRes.data?.allowed);
          } catch (_) {
            setAiStudioAllowed(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchUserInfo();
  }, []);
  const aiStudioItems = [
    { icon: FileText, label: 'Script Generator', href: '/ai/script-generator' },
    { icon: Image, label: 'Thumbnail Generator', href: '/ai/thumbnail-generator' },
    { icon: Zap, label: 'Hook Generator', href: '/ai/hook-generator' },
    { icon: Film, label: 'Shorts Creator', href: '/ai/shorts-creator' },
    { icon: TrendingUp, label: 'YouTube Growth', href: '/tools/youtube-growth' },
  ];
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Video, label: 'My Videos', href: '/videos' },
    { icon: Sparkles, label: 'Viral Optimizer', href: '/viral-optimizer' },
    { icon: Target, label: 'Channel Audit', href: '/channel-audit' },
    { icon: Facebook, label: 'Facebook Audit', href: '/facebook-audit' },
    { icon: TrendingUp, label: 'Trending', href: '/trending' },
    { icon: Hash, label: 'Hashtags', href: '/hashtags' },
    { icon: Clock, label: 'Posting Time', href: '/posting-time' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Calendar, label: 'Content Calendar', href: '/calendar' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-64 bg-[#0F0F0F] shadow-lg z-40 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#212121] flex-shrink-0">
              <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                <img src="/logo.png" alt="ViralBoost AI" className="h-8 w-auto object-contain max-w-[140px]" />
              </Link>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-[#212121] transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* User info: name, role, plan, days left */}
            {(userRole || userName || userUniqueId) && (
              <div className="px-4 py-3 border-b border-[#212121] flex-shrink-0 space-y-2">
                {userName && (
                  <p className="text-sm font-medium text-white truncate" title={userName}>{userName}</p>
                )}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${
                  userRole === 'admin'
                    ? 'bg-[#FF0000]/20 text-[#FF0000]'
                    : userRole === 'manager'
                    ? 'bg-yellow-400/20 text-yellow-400'
                    : 'bg-[#212121] text-[#AAAAAA]'
                }`}>
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>{userRole ? userRole.toUpperCase() : 'USER'}</span>
                </div>
                {userUniqueId && (
                  <p className="text-xs text-[#AAAAAA] font-mono">ID: {userUniqueId}</p>
                )}
                <div className="text-xs text-[#AAAAAA] space-y-0.5">
                  <p><span className="text-[#888]">Plan:</span> <span className="text-white">{planName}</span></p>
                  {daysLeft !== null && (
                    <p>
                      <span className="text-[#888]">Expires:</span>{' '}
                      <span className={daysLeft <= 0 ? 'text-red-400' : 'text-white'}>
                        {daysLeft <= 0 ? 'Expired' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
            <nav className="p-4 flex flex-col flex-1 min-h-0">
              <ul className="space-y-2 flex-1 overflow-y-auto min-h-0">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all group ${
                          pathname === item.href
                            ? 'bg-[#FF0000] text-white shadow-lg shadow-[#FF0000]/20'
                            : 'hover:bg-[#212121] text-[#AAAAAA]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                          pathname === item.href
                            ? 'text-white'
                            : 'text-[#AAAAAA] group-hover:text-white'
                        }`} />
                        <span className={`${
                          pathname === item.href
                            ? 'text-white font-medium'
                            : 'group-hover:text-white'
                        }`}>
                          {item.label}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
                {aiStudioAllowed && (
                  <>
                    <li className="pt-2 mt-2 border-t border-[#212121]">
                      <p className="px-3 py-1 text-xs font-semibold text-[#FF0000] uppercase tracking-wider">AI Studio</p>
                    </li>
                    {aiStudioItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.li key={item.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (menuItems.length + index) * 0.05 }}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all group ${
                              pathname === item.href ? 'bg-[#FF0000] text-white shadow-lg shadow-[#FF0000]/20' : 'hover:bg-[#212121] text-[#AAAAAA]'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${pathname === item.href ? 'text-white' : 'text-[#AAAAAA] group-hover:text-white'}`} />
                            <span className={pathname === item.href ? 'text-white font-medium' : 'group-hover:text-white'}>{item.label}</span>
                          </Link>
                        </motion.li>
                      );
                    })}
                  </>
                )}
              </ul>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
      {!isOpen && (
        <button
          onClick={onToggle}
          style={{ top: topOffset ? topOffset + 12 : 16 }}
          className="fixed left-4 z-50 p-2 bg-[#0F0F0F] rounded-lg shadow-lg hover:bg-[#212121] transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      )}
    </>
  );
}
