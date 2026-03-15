'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { Crown, CreditCard, MessageCircle, LogOut, User } from 'lucide-react';
import { getAuthHeaders, removeToken } from '@/utils/auth';

const LOGO_SRC = '/logo.png';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [userUniqueId, setUserUniqueId] = useState<string>('');
  const [planName, setPlanName] = useState<string>('Free');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        if (response.data.user) {
          const u = response.data.user;
          setUserRole(u.role || 'user');
          setUserName(u.name || '');
          const uniqueId = u.uniqueId || (typeof window !== 'undefined' ? localStorage.getItem('uniqueId') : null);
          if (uniqueId) {
            setUserUniqueId(uniqueId);
            if (typeof window !== 'undefined') localStorage.setItem('uniqueId', uniqueId);
          }
          const subPlan = u.subscriptionPlan;
          const sub = u.subscription;
          if (subPlan?.planName) setPlanName(subPlan.planName);
          else if (sub === 'pro') setPlanName('Pro');
          else if (sub === 'enterprise') setPlanName('Enterprise');
          else setPlanName('Free');
          const endDate = subPlan?.endDate ? new Date(subPlan.endDate) : (u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt) : null);
          if (endDate && !isNaN(endDate.getTime())) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            setDaysLeft(Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          } else setDaysLeft(null);
        }
      } catch (_) {}
    };
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    removeToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('uniqueId');
    }
    router.push('/login');
  };

  const navItems = [
    { icon: Crown, label: 'Pricing', href: '/pricing' },
    { icon: CreditCard, label: 'Subscription', href: '/subscription' },
    { icon: MessageCircle, label: 'Support', href: '/support' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between gap-4 px-4 bg-[#0F0F0F] border-b border-[#212121]">
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <img src={LOGO_SRC} alt="ViralBoost AI" className="h-[2.25rem] md:h-[3.375rem] w-auto object-contain" />
      </Link>
      <div className="flex items-center gap-3">
        {/* User info: name, role, ID, plan */}
        {(userName || userRole || userUniqueId) && (
          <div className="hidden sm:flex items-center gap-3 text-sm">
            {userName && <span className="text-white font-medium truncate max-w-[120px]" title={userName}>{userName}</span>}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
              userRole === 'super-admin' ? 'bg-[#FF0000]/20 text-[#FF0000]'
              : userRole === 'admin' ? 'bg-[#FF0000]/20 text-[#FF0000]'
              : userRole === 'manager' ? 'bg-yellow-400/20 text-yellow-400'
              : 'bg-[#212121] text-[#AAAAAA]'
            }`}>
              <User className="w-3.5 h-3.5" />
              {userRole ? userRole.toUpperCase() : 'USER'}
            </span>
            {userUniqueId && <span className="text-[#AAAAAA] font-mono text-xs">ID: {userUniqueId}</span>}
            <span className="text-[#888] text-xs">Plan: <span className="text-white">{planName}</span></span>
            {daysLeft !== null && (
              <span className={`text-xs ${daysLeft <= 0 ? 'text-red-400' : 'text-[#AAAAAA]'}`}>
                {daysLeft <= 0 ? 'Expired' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#FF0000] text-white' : 'text-[#AAAAAA] hover:bg-[#212121] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#AAAAAA] hover:bg-[#212121] hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
