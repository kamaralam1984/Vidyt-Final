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
    }, 30_000);

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
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
      fetch('/api/admin/super/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ page: pathname, previousPage, timestamp: new Date().toISOString() }),
      }).catch(() => { /* silent fail */ });
    }

    lastPath.current = pathname;
  }, [pathname, getTokenPayload]);
}
