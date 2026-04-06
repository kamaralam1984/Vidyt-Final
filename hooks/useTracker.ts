'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getSocket } from './useSocket';
import { getAuthHeaders } from '@/utils/auth';

/**
 * Hook to track page views and user activity via Socket.io.
 * Falls back to HTTP POST if socket is unavailable.
 */
export function useTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function getOrCreateSessionId() {
    if (typeof window === 'undefined') return null;
    const sidKey = 'vb_session_id';
    const existing = sessionStorage.getItem(sidKey);
    if (existing) return existing;
    const sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(sidKey, sid);
    return sid;
  }

  const getTokenPayload = useCallback((): { id?: string } => {
    try {
      const headers = getAuthHeaders();
      const token = (headers.Authorization as string)?.replace('Bearer ', '');
      if (!token) return {};
      return JSON.parse(atob(token.split('.')[1]));
    } catch { return {}; }
  }, []);

  // Send session_ping every 30s to keep session alive
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const { id: userId } = getTokenPayload();
    if (!userId) return;

    if (pingRef.current) clearInterval(pingRef.current);
    pingRef.current = setInterval(() => {
      sock.emit('session_ping', { userId });
      
      // Also send a heartbeat to the HTTP API to update UserSession.lastSeen/duration
      const headers = getAuthHeaders();
      const sid = getOrCreateSessionId();
      if (headers.Authorization && sid) {
        fetch('/api/admin/super/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ action: 'heartbeat', sessionId: sid, page: window.location.pathname }),
        }).catch(() => {});
      }
    }, 45_000); // 45s heartbeat

    const handleUnload = () => {
      const sid = getOrCreateSessionId();
      const headers = getAuthHeaders();
      if (headers.Authorization && sid) {
        const body = JSON.stringify({ action: 'end', sessionId: sid, page: window.location.pathname });
        // Use sendBeacon for reliable delivery on page close
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon('/api/admin/super/tracking', blob);
        } else {
          fetch('/api/admin/super/tracking', { method: 'POST', headers, body, keepalive: true });
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [getTokenPayload]);

  // Track route changes
  useEffect(() => {
    if (pathname === lastPath.current) return;

    const { id: userId } = getTokenPayload();
    if (!userId) return;

    const sock = getSocket();
    const previousPage = lastPath.current || undefined;

    if (sock?.connected) {
      // Real-time via socket
      sock.emit('page_visit', { userId, page: pathname, previousPage });
    }

    // Also persist to DB via HTTP (for timeline + session update)
    const headers = getAuthHeaders();
    if (headers.Authorization) {
      const sid = getOrCreateSessionId();
      fetch('/api/admin/super/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'page',
          page: pathname,
          previousPage,
          sessionId: sid,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => { /* silent fail */ });
    }

    lastPath.current = pathname;
  }, [pathname, getTokenPayload]);
}
