'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getAuthHeaders } from '@/utils/auth';

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

interface TrackPayload {
  action: string;
  page: string;
  sessionId?: string | null;
  meta?: Record<string, unknown>;
}

async function track(action: string, page: string, meta?: Record<string, unknown>) {
  try {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;

    const payload: TrackPayload = {
      action,
      page,
      sessionId: getOrCreateSessionId(),
      ...(meta ? { meta } : {}),
    };

    await fetch('/api/admin/super/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
    });
  } catch {
    // Silent fail — never block UX
  }
}

/**
 * trackEvent — global conversion event tracker.
 * Call from anywhere in the app:
 *   trackEvent('cta_click', { label: 'hero_signup' })
 *   trackEvent('tool_generate', { tool: 'title-generator', plan: 'free' })
 *   trackEvent('upgrade_prompt_shown', { source: 'feature-gate' })
 *   trackEvent('upgrade_clicked', { source: 'pricing-page' })
 */
export function trackEvent(event: string, meta?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const page = window.location.pathname;
  track(event, page, meta);

  // Mirror to GA4 if available
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', event, {
        page_path: page,
        ...meta,
      });
    }
  } catch {}
}

export default function TrackingScript() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathnameRef = useRef(pathname);

  // Keep pathnameRef in sync so heartbeat always uses the current page
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      track('session_start', pathname || '');
    }

    // Heartbeat every 30 seconds — keeps user "online" in live dashboard
    const startHeartbeat = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        track('heartbeat', pathnameRef.current || '/');
      }, 30000);
    };
    startHeartbeat();

    // Tab visibility: re-send heartbeat immediately when tab becomes visible
    // (browsers throttle/pause timers when tab is backgrounded)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        track('heartbeat', pathnameRef.current || '/');
        startHeartbeat(); // reset interval so next beat is exactly 30s away
      }
    };

    // Window focus: same logic for when user returns to the window
    const handleFocus = () => {
      track('heartbeat', pathnameRef.current || '/');
    };

    // Session end tracking
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

  // Page navigation tracking
  useEffect(() => {
    if (initialized.current) {
      track('page_view', pathname || '');
    }
  }, [pathname]);

  return null;
}
