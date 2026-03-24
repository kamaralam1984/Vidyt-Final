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
  Instagram,
  Calendar,
  Menu,
  X,
  FileText,
  Image,
  Zap,
  Film,
  Search,
} from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import UsageBar from './UsageBar';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Top offset in pixels (e.g. 56 when using Navbar) */
  topOffset?: number;
}

export default function Sidebar({ isOpen, onToggle, topOffset = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [aiStudioAllowed, setAiStudioAllowed] = useState(false);
  const [allowedSystems, setAllowedSystems] = useState<Record<string, boolean>>({});
  const [loadingSystems, setLoadingSystems] = useState(true);
  
  const [platformControls, setPlatformControls] = useState<Record<string, any>>({});
  const [loadingControls, setLoadingControls] = useState(true);

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const res = await axios.get('/api/features/all', { headers: getAuthHeaders() });
        if (res.data.features) {
          setAllowedSystems(res.data.features);
        }
      } catch (_) {
      } finally {
        setLoadingSystems(false);
      }
    };
    
    const fetchPlatformControls = async () => {
        try {
            const res = await axios.get('/api/user/controls', { headers: getAuthHeaders() });
            if (res.data) {
                setPlatformControls(res.data);
            }
        } catch (_) {
            setPlatformControls({});
        } finally {
            setLoadingControls(false);
        }
    };

    fetchSystems();
    fetchPlatformControls();
  }, []);

  useEffect(() => {
    setAiStudioAllowed(!!allowedSystems['script_generator'] || !!allowedSystems['thumbnail_generator'] || !!allowedSystems['hook_generator'] || !!allowedSystems['shorts_creator'] || !!allowedSystems['youtube_growth']);
  }, [allowedSystems]);
  const aiStudioItems = [
    { id: 'script_generator', icon: FileText, label: 'Script Generator', href: '/ai/script-generator' },
    { id: 'ai_coach', icon: Zap, label: 'AI Coach', href: '/ai/script-generator?mode=coach' },
    { id: 'thumbnail_generator', icon: Image, label: 'Thumbnail Generator', href: '/ai/thumbnail-generator' },
    { id: 'hook_generator', icon: Zap, label: 'Hook Generator', href: '/ai/hook-generator' },
    { id: 'shorts_creator', icon: Film, label: 'Shorts Creator', href: '/ai/shorts-creator' },
    { id: 'youtube_growth', icon: TrendingUp, label: 'YouTube Growth', href: '/tools/youtube-growth' },
  ].filter(item => allowedSystems[item.id] !== false);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/dashboard' },
    { id: 'videos', icon: Video, label: 'My Videos', href: '/videos', platform: 'youtube' },
    { id: 'youtube_seo', icon: Search, label: 'YouTube Live SEO Analyzer', href: '/dashboard/youtube-seo', platform: 'youtube' },
    { id: 'facebook_seo', icon: Facebook, label: 'Facebook SEO Analyzer', href: '/dashboard/facebook-seo', platform: 'facebook' },
    { id: 'instagram_seo', icon: Instagram, label: 'Instagram SEO Analyzer', href: '/dashboard/instagram-seo', platform: 'instagram' },
    { id: 'viral_optimizer', icon: Zap, label: 'AI Viral Optimization Engine', href: '/dashboard/viral-optimizer', platform: 'youtube' },
    { id: 'channel_audit', icon: Target, label: 'Channel Audit', href: '/channel-audit', platform: 'youtube' },
    { id: 'facebook_audit', icon: Facebook, label: 'Facebook Audit', href: '/facebook-audit', platform: 'facebook' },
    { id: 'trending', icon: TrendingUp, label: 'Trending', href: '/trending' },
    { id: 'hashtags', icon: Hash, label: 'Hashtags', href: '/hashtags' },
    { id: 'posting_time', icon: Clock, label: 'Posting Time', href: '/posting-time' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { id: 'calendar', icon: Calendar, label: 'Content Calendar', href: '/calendar' },
  ]
  .filter(item => allowedSystems[item.id] !== false)
  .filter(item => {
      // Dynamic hiding based on platform control API
      if (item.platform && platformControls[item.platform]) {
          return platformControls[item.platform].isEnabled;
      }
      return true; // if no platform setting restricts it, allow it.
  });

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
              {/* Progress Bar Rendering */}
              <UsageBar />
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
