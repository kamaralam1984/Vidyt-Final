'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

let sessionId: string | null = null;

function safeSessionGet(key: string): string | null {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}
function safeSessionSet(key: string, value: string): void {
  try { window.sessionStorage.setItem(key, value); } catch {}
}
function safeLocalGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeLocalSet(key: string, val: string): void {
  try { window.localStorage.setItem(key, val); } catch {}
}

function getOrCreateSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  if (sessionId) return sessionId;
  let sid = safeSessionGet('vb_session_id');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    safeSessionSet('vb_session_id', sid);
  }
  sessionId = sid;
  return sid;
}

/** Decode JWT exp without crypto — no security implications, just for expiry check */
function tokenExpiresInSeconds(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp - Math.floor(Date.now() / 1000);
  } catch {
    return 0;
  }
}

/** Singleton refresh promise — prevents concurrent refresh races */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.token) {
        safeLocalSet('token', data.token);
        return data.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/** Get a fresh token — auto-refreshes if expiring within 90s */
async function getFreshToken(): Promise<string | null> {
  const token = safeLocalGet('token');
  if (!token) return null;
  // Refresh proactively when <90s remain (covers 30s heartbeat + network latency)
  if (tokenExpiresInSeconds(token) < 90) {
    const refreshed = await refreshAccessToken();
    return refreshed ?? token; // fall back to old token if refresh fails
  }
  return token;
}

async function track(action: string, page: string, meta?: Record<string, unknown>) {
  try {
    const token = await getFreshToken();
    if (!token) return;

    const sid = getOrCreateSessionId();
    const body: Record<string, unknown> = {
      action,
      page,
      sessionId: sid,
      timestamp: new Date().toISOString(),
      ...(meta ?? {}),
    };

    const res = await fetch('/api/admin/super/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    // If server skipped (token was expired despite our check), force refresh + retry once
    if (data?.skipped) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        await fetch('/api/admin/super/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` },
          body: JSON.stringify(body),
        });
      }
    }
  } catch {
    // Silent fail — never block UX
  }
}

/**
 * trackEvent — global conversion event tracker.
 *   trackEvent('cta_click', { label: 'hero_signup' })
 *   trackEvent('tool_generate', { tool: 'title-generator', plan: 'free' })
 *   trackEvent('upgrade_prompt_shown', { source: 'feature-gate' })
 *   trackEvent('upgrade_clicked', { source: 'pricing-page' })
 */
export function trackEvent(event: string, meta?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const page = window.location.pathname;
  track(event, page, meta);
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') w.gtag('event', event, { page_path: page, ...meta });
  } catch {}
}

export default function TrackingScript() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathnameRef = useRef(pathname);

  // Keep pathnameRef current so heartbeat always reports the right page
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      track('session_start', pathname || '');
    }

    const startHeartbeat = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        track('heartbeat', pathnameRef.current || '/');
      }, 30000);
    };
    startHeartbeat();

    // Tab restored from background → immediate heartbeat + fresh interval
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        track('heartbeat', pathnameRef.current || '/');
        startHeartbeat();
      }
    };

    // Window focus
    const handleFocus = () => track('heartbeat', pathnameRef.current || '/');

    // Session end
    const handleUnload = () => {
      const sid = getOrCreateSessionId();
      const token = safeLocalGet('token');
      if (!sid || !token) return;
      fetch('/api/admin/super/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          page: pathnameRef.current,
          sessionId: sid,
          action: 'session_end',
          timestamp: new Date().toISOString(),
        }),
        keepalive: true,
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleUnload);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  // Page navigation
  useEffect(() => {
    if (initialized.current) track('page_view', pathname || '');
  }, [pathname]);

  return null;
}
