'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Megaphone, Sparkles } from 'lucide-react';

const DISMISS_KEY = 'vidyt-announcement-dismissed';

export default function SiteAnnouncementBanner() {
  const [text, setText] = useState('');
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/public/site-settings');
        const isActive = !!res.data?.announcementActive && !!res.data?.announcement;
        setActive(isActive);
        setText(String(res.data?.announcement || ''));
        // Reset dismissal whenever the banner copy changes — user should see new text.
        const lastSeen = window.localStorage.getItem(DISMISS_KEY);
        if (isActive && lastSeen !== res.data.announcement) {
          setDismissed(false);
        } else if (isActive && lastSeen === res.data.announcement) {
          setDismissed(true);
        }
      } catch {
        setActive(false);
      }
    };
    fetchSettings();
    const interval = setInterval(fetchSettings, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!active || dismissed || !text) return null;

  return (
    <>
      {/* Local keyframes for the animated background + sweeping shimmer */}
      <style jsx>{`
        @keyframes vidyt-banner-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes vidyt-banner-shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(220%) skewX(-20deg); }
        }
        @keyframes vidyt-banner-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes vidyt-banner-glow {
          0%, 100% { text-shadow: 0 0 0 rgba(255,255,255,0); }
          50% { text-shadow: 0 0 14px rgba(255,255,255,0.55), 0 0 28px rgba(255,200,80,0.35); }
        }
        .vidyt-bg {
          background: linear-gradient(
            90deg,
            #2563eb 0%,
            #7c3aed 25%,
            #ec4899 50%,
            #7c3aed 75%,
            #2563eb 100%
          );
          background-size: 300% 300%;
          animation: vidyt-banner-flow 8s ease infinite;
        }
        .vidyt-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .vidyt-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 35%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.35) 50%,
            transparent 100%
          );
          filter: blur(2px);
          animation: vidyt-banner-shimmer 3.2s linear infinite;
        }
        .vidyt-icon-pulse { animation: vidyt-banner-pulse 1.6s ease-in-out infinite; }
        .vidyt-text-glow { animation: vidyt-banner-glow 2.4s ease-in-out infinite; }
      `}</style>

      <div className="vidyt-bg relative text-white py-2.5 px-4 flex items-center justify-center gap-3 shadow-lg shadow-purple-900/30 border-b border-white/10">
        {/* Sweeping shine overlay */}
        <div className="vidyt-shimmer" />

        {/* Pulsing megaphone */}
        <span className="vidyt-icon-pulse relative z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm shrink-0">
          <Megaphone className="w-4 h-4 text-yellow-200" />
        </span>

        {/* Highlighted, bold message */}
        <span
          className="vidyt-text-glow relative z-10 text-center font-extrabold tracking-wide text-sm sm:text-base max-w-3xl px-3 py-1 rounded-md bg-black/25 backdrop-blur-[1px] border border-white/15 inline-flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" aria-hidden />
          <span>{text}</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" aria-hidden />
        </span>

        <button
          onClick={() => {
            setDismissed(true);
            try {
              window.localStorage.setItem(DISMISS_KEY, text);
            } catch {}
          }}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/15 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
