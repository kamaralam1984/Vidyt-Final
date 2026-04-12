'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { Crown, CreditCard, MessageCircle, LogOut, User, ChevronDown, Globe } from 'lucide-react';
import { getAuthHeaders, removeToken, decodeToken } from '@/utils/auth';
import { useLocale, SUPPORTED_LOCALES } from '@/context/LocaleContext';
import UsageNotificationsBell from '@/components/UsageNotificationsBell';

const LOGO_SRC = '/Logo.png';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [userUniqueId, setUserUniqueId] = useState<string>('');
  const [planName, setPlanName] = useState<string>('Free');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const { locale, setLocale } = useLocale();
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      // ⚡️ Instant client-side check
      const token = localStorage.getItem('token');
      if (token) {
        const payload = decodeToken(token);
        if (payload) {
          setUserRole(payload.role || 'user');
          setUserName(payload.name || '');
          const uniqueId = payload.uniqueId || localStorage.getItem('uniqueId');
          if (uniqueId) setUserUniqueId(uniqueId);
          
          // Initial plan display based on role/subscription
          const sub = (payload.subscription || 'free').toLowerCase();
          if (sub === 'pro') setPlanName('Pro');
          else if (sub === 'enterprise') setPlanName('Enterprise');
          else if (payload.role === 'super-admin') setPlanName('Owner');
          else setPlanName('Free');
        }
      }

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
          const roleNorm = String(u.role || '')
            .toLowerCase()
            .replace(/_/g, '-');
          const isSuperAdmin = roleNorm === 'super-admin' || roleNorm === 'superadmin';
          if (isSuperAdmin) {
            setPlanName('Owner');
            setDaysLeft(null);
          } else {
            const subPlan = u.subscriptionPlan;
            const sub = (u.subscription || 'free').toLowerCase();
            if (subPlan?.planName) setPlanName(subPlan.planName);
            else if (sub === 'starter') setPlanName('Starter');
            else if (sub === 'pro') setPlanName('Pro');
            else if (sub === 'enterprise') setPlanName('Enterprise');
            else if (sub === 'custom') setPlanName('Custom');
            else if (sub === 'owner') setPlanName('Owner');
            else setPlanName('Free');
            const endDate = subPlan?.endDate ? new Date(subPlan.endDate) : (u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt) : null);
            if (endDate && !isNaN(endDate.getTime())) {
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);
              setDaysLeft(Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            } else setDaysLeft(null);
          }
        }
      } catch (_) { }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      // ⚡️ Await server-side cookie clearing
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout API error:', err);
    }

    // Clear client-side state
    removeToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('uniqueId');
    }
    
    // Hard redirect to clear any cached states
    window.location.href = '/login';
  };

  const navItems = [
    { icon: Crown, label: 'Pricing', href: '/pricing' },
    { icon: CreditCard, label: 'Subscription', href: '/subscription' },
    { icon: MessageCircle, label: 'Support', href: '/support' },
  ];

  const roleNormNav = String(userRole || '')
    .toLowerCase()
    .replace(/_/g, '-');
  const isSuperRoleNav = roleNormNav === 'super-admin' || roleNormNav === 'superadmin';

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between gap-4 px-4 bg-[#0F0F0F] border-b border-[#212121]">
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <img src={LOGO_SRC} alt="Vid YT" className="h-[2.25rem] md:h-[3.375rem] w-auto object-contain" />
      </Link>
      <div className="flex items-center gap-3">
        {/* User info: name, role, ID, plan */}
        {(userName || userRole || userUniqueId) && (
          <div className="hidden sm:flex items-center gap-3 text-sm">
            {userName && <span className="text-white font-medium truncate max-w-[120px]" title={userName}>{userName}</span>}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${isSuperRoleNav
                ? 'bg-[#FF0000]/20 text-[#FF0000]'
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
          <UsageNotificationsBell />
          {isSuperRoleNav && (
            <Link
              href="/admin/super"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[#FF0000] border border-[#FF0000]/40 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 transition-colors"
            >
              <Crown className="w-4 h-4" />
              <span>Super Admin</span>
            </Link>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#FF0000] text-white' : 'text-[#AAAAAA] hover:bg-[#212121] hover:text-white'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCountryMenuOpen(!countryMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#AAAAAA] hover:bg-[#212121] hover:text-white transition-colors"
            >
              <span className="text-xl leading-none">{locale.flag}</span>
              <span className="hidden lg:inline">{locale.countryName}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${countryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {countryMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[#212121] bg-[#181818] shadow-2xl z-50 py-2">
                <div className="px-4 py-2 border-b border-[#212121] text-[10px] text-[#AAAAAA] uppercase tracking-wider">
                  Select Country &amp; Currency
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[#212121]">
                  {SUPPORTED_LOCALES.map((opt) => (
                    <button
                      key={opt.countryCode}
                      type="button"
                      onClick={() => {
                        setLocale(opt);
                        setCountryMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#212121] transition-colors ${opt.countryCode === locale.countryCode ? 'bg-[#FF0000]/10' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg leading-none">{opt.flag}</span>
                        <div className="text-left">
                          <div className="text-sm font-medium text-white">{opt.countryName}</div>
                          <div className="text-[10px] text-[#AAAAAA] uppercase">{opt.currency}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-medium text-[#AAAAAA]">{opt.phoneCode}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#AAAAAA] hover:bg-[#212121] hover:text-white transition-colors ${isLoggingOut ? 'opacity-50 cursor-wait' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
