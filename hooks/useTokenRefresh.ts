'use client';

/**
 * useTokenRefresh — silently renews the access token before it expires.
 *
 * How it works:
 *  1. On mount, decode the token from localStorage to find its expiry.
 *  2. Schedule a refresh 2 minutes before expiry.
 *  3. Call POST /api/auth/refresh (reads httpOnly refresh_token cookie).
 *  4. If successful, update localStorage token + dispatch 'token:updated' event.
 *  5. If refresh fails (cookie expired / revoked), remove token and redirect to /auth.
 *
 * Mount this hook once inside a top-level client component (e.g. DashboardLayout).
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, setToken, removeToken, decodeToken } from '@/utils/auth';

const REFRESH_BUFFER_MS = 2 * 60 * 1000; // refresh 2 min before expiry

export function useTokenRefresh() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const scheduleRefresh = (expiresAt: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const now = Date.now();
    const delay = expiresAt - now - REFRESH_BUFFER_MS;

    if (delay <= 0) {
      // Token already near/past expiry — refresh immediately
      doRefresh();
      return;
    }

    timerRef.current = setTimeout(doRefresh, delay);
  };

  const doRefresh = async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // sends httpOnly refresh_token cookie
      });

      if (!res.ok) {
        // Refresh token expired or revoked — log user out
        removeToken();
        router.push('/auth?reason=session_expired');
        return;
      }

      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        // Notify other hooks/components that depend on the token
        window.dispatchEvent(new CustomEvent('token:updated', { detail: { token: data.token } }));

        // Schedule next refresh based on new token's expiry
        const payload = decodeToken(data.token);
        if (payload?.exp) {
          scheduleRefresh(payload.exp * 1000);
        }
      }
    } catch {
      // Network error — retry in 60s rather than logging out aggressively
      timerRef.current = setTimeout(doRefresh, 60_000);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const payload = decodeToken(token);
    if (!payload?.exp) return;

    const expiresAt = payload.exp * 1000;
    scheduleRefresh(expiresAt);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
