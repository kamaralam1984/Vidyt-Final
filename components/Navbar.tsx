'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Crown, CreditCard, MessageCircle, LogOut } from 'lucide-react';
import { removeToken } from '@/utils/auth';

const LOGO_SRC = '/logo.png';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('uniqueId');
    }
    router.push('/auth?mode=login');
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
    </nav>
  );
}
