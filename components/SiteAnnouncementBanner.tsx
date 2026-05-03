'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Megaphone } from 'lucide-react';

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
        // Reset dismissal whenever the banner content changes — user should see new copy.
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
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white text-sm py-2 px-4 flex items-center justify-center gap-3 relative">
      <Megaphone className="w-4 h-4 shrink-0" />
      <span className="text-center max-w-3xl">{text}</span>
      <button
        onClick={() => {
          setDismissed(true);
          try {
            window.localStorage.setItem(DISMISS_KEY, text);
          } catch {}
        }}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
