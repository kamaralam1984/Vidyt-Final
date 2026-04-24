'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker so the site qualifies as a PWA
 * (Add to Home Screen / install prompt on supported browsers).
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // If an old SW was already controlling this page, reload once when the
    // new SW takes over so the user drops any stale behavior from v3 or older.
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => reg.update().catch(() => {}))
        .catch((err) => console.warn('Service worker registration failed:', err));
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
