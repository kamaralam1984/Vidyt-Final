'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthHeaders, isAuthenticated } from '@/utils/auth';
import { getPlanRoll, type PlanRoll } from '@/lib/planLimits';

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

  useEffect(() => {
    const fetchUser = async () => {
      if (!isAuthenticated()) {
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
    };

    fetchUser();
  }, []);

  return session;
}
