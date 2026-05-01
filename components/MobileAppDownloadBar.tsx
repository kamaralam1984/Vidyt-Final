'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'vidyt_app_bar_dismissed_at';
/** Re-show the bar 14 days after dismissal */
const REDISMISS_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

const HIDE_ON_PATHS = ['/download', '/get-app', '/dashboard', '/admin', '/login', '/signup', '/auth'];

/**
 * Mobile-only sticky bottom bar prompting users to download the VidYT Android app.
 * - Hidden on desktop (lg+)
 * - Hidden on download/auth/dashboard pages
 * - Dismissible (persisted in localStorage)
 * - Hidden inside the Capacitor WebView (already in the app)
 */
export default function MobileAppDownloadBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't show inside the Capacitor WebView (user is already in the app)
    const ua = navigator.userAgent || '';
    if (/CapacitorWebView|VidYT-?App/i.test(ua)) return;

    // Don't show in standalone PWA mode
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;

    // Don't show on iOS — APK is Android-only
    if (/iPhone|iPad|iPod/i.test(ua)) return;

    // Respect dismissal
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < REDISMISS_AFTER_MS) return;
    } catch {
      // localStorage blocked — show anyway
    }

    setVisible(true);
  }, []);

  const onPath = (p: string) =>
    HIDE_ON_PATHS.some((hp) => p === hp || p.startsWith(hp + '/'));

  if (!visible || !pathname || onPath(pathname)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] lg:hidden"
      role="dialog"
      aria-label="Download VidYT App"
    >
      <div className="border-t border-white/10 bg-[#0F0F0F]/95 backdrop-blur-md px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]">
            <Image
              src="/icon-192.png"
              alt="VidYT app icon"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white leading-tight truncate">
              Get the Vid YT App
            </p>
            <p className="text-[11px] text-white/55 leading-tight truncate">
              Free · 4 MB · Android
            </p>
          </div>
          <Link
            href="/download"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FF0000] px-3.5 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(255,0,0,0.45)] hover:bg-[#CC0000] transition flex-shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
