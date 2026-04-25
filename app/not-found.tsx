import Link from 'next/link';
import { Home, Search, Youtube } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found | VidYT',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#0F0F0F', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* 404 large text */}
      <p className="text-8xl md:text-9xl font-black text-[#FF0000]/20 select-none mb-2">404</p>

      <div className="w-14 h-14 rounded-2xl bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center mb-5 -mt-4">
        <Search className="w-7 h-7 text-[#FF0000]" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Page not found</h1>
      <p className="text-[#AAAAAA] text-sm mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Try one of the links below.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-12">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] text-white rounded-xl text-sm font-semibold hover:bg-[#CC0000] transition"
        >
          <Home className="w-4 h-4" />
          Go to Homepage
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#181818] border border-[#212121] text-[#AAAAAA] rounded-xl text-sm font-semibold hover:text-white hover:bg-[#212121] transition"
        >
          <Youtube className="w-4 h-4" />
          Open Dashboard
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg w-full text-xs text-[#717171]">
        {[
          { href: '/pricing', label: 'Pricing' },
          { href: '/tools', label: 'Free Tools' },
          { href: '/auth', label: 'Sign In' },
          { href: '/dashboard', label: 'Dashboard' },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            className="p-3 bg-[#181818] border border-[#212121] rounded-xl hover:text-white hover:border-[#333] transition text-center">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
