'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';

import { getAuthHeaders } from '@/utils/auth';

let sessionId: string | null = null;

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return null;
  if (sessionId) return sessionId;
  let sid = sessionStorage.getItem('vb_session_id');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('vb_session_id', sid);
  }
  sessionId = sid;
  return sid;
}

async function track(action: string, page: string) {
  try {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return; // Only track authenticated users

    const sid = getOrCreateSessionId();

    await axios.post('/api/admin/super/tracking', {
      page,
      sessionId: sid,
      action,
      timestamp: new Date().toISOString(),
    }, { headers });
  } catch {
    // Silent fail
  }
}

export default function TrackingScript() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const heartbeatRef = useRef<any>(null);

  // Login tracking on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      track('login', pathname);
    }

    // Heartbeat every 30 seconds to keep session alive
    heartbeatRef.current = setInterval(() => {
      track('heartbeat', pathname);
    }, 30000);

    // Logout tracking
    const handleUnload = () => {
      const sid = getOrCreateSessionId();
      if (!sid) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      // Use fetch with keepalive for reliable tracking during unload with headers
      fetch('/api/admin/super/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ page: pathname, sessionId: sid, action: 'logout', timestamp: new Date().toISOString() }),
        keepalive: true
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(heartbeatRef.current);
    };
  }, []);

  // Page change tracking
  useEffect(() => {
    if (initialized.current) {
      track('page', pathname);
    }
  }, [pathname]);

  return null; // No UI — pure tracking
}
