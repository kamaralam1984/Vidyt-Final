'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getAuthHeaders, isAuthenticated } from '@/utils/auth';
import { getPlanRoll, type PlanRoll } from '@/lib/planLimits';
import { getSocket } from '@/hooks/useSocket';

export interface UserSession {
  user: any | null;
  role: string;
  plan: PlanRoll | null;
  authenticated: boolean;
  loading: boolean;
}

export function useUser() {
  const [session, setSession] = useState<UserSession>({
    user: null,
    role: 'guest',
    plan: null,
    authenticated: false,
    loading: true,
  });

  const fetchUser = useCallback(async () => {
    let hasAuth = false;
    try {
      hasAuth = isAuthenticated();
    } catch {
      hasAuth = false;
    }

    if (!hasAuth) {
      setSession({
        user: null,
        role: 'guest',
        plan: null,
        authenticated: false,
        loading: false,
      });
      return;
    }

    try {
      const response = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
      if (response.data.user) {
        const user = response.data.user;
        const planId = user.subscriptionPlan?.planId || user.subscription || 'free';
        const plan = getPlanRoll(planId);

        setSession({
          user,
          role: user.role || 'user',
          plan,
          authenticated: true,
          loading: false,
        });
      } else {
        setSession({
          user: null,
          role: 'guest',
          plan: null,
          authenticated: false,
          loading: false,
        });
      }
    } catch (error) {
      setSession({
        user: null,
        role: 'guest',
        plan: null,
        authenticated: false,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Live propagation: when admin updates plans/config, refetch the user so
  // role/plan/limits reflect immediately without a page reload.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => { fetchUser(); };
    socket.on('plan:updated', handler);
    socket.on('subscription:updated', handler);
    return () => {
      socket.off('plan:updated', handler);
      socket.off('subscription:updated', handler);
    };
  }, [fetchUser]);

  return session;
}
