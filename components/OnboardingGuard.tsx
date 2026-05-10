'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Redirects authenticated users to /onboarding until they finish the wizard.
 * Mounted inside DashboardLayout so every dashboard route is gated.
 *
 * NOTE: Uses window.location.href (hard navigation) so the destination page
 * always receives a fresh session — avoids the router cache returning stale
 * onboardingCompleted=false after a just-completed onboarding flow.
 */
export default function OnboardingGuard() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip the onboarding redirect for paths where it would interrupt a
    // critical flow. Razorpay return URLs land on /subscription or /payment
    // — bouncing the user to /onboarding mid-checkout breaks attribution
    // and can strand a charged payment without a successful upgrade write.
    const SKIP_PREFIXES = [
      '/onboarding',
      '/subscription',
      '/upgrade',
      '/checkout',
      '/payment',
    ];
    if (pathname && SKIP_PREFIXES.some(p => pathname.startsWith(p))) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // If onboarding was just completed in this tab, skip the API check for
    // this navigation to prevent a redirect loop caused by cache staleness.
    const justCompleted = sessionStorage.getItem('onboardingJustCompleted');
    if (justCompleted) {
      sessionStorage.removeItem('onboardingJustCompleted');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!r.ok) return;
        const d = await r.json();
        if (cancelled) return;
        // Only redirect if explicitly false (not undefined / null / missing)
        if (d?.user && d.user.onboardingCompleted === false) {
          window.location.href = '/onboarding';
        }
      } catch {
        // Non-blocking — if /me fails, let the page render
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
