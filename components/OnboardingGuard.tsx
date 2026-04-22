'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Redirects authenticated users to /onboarding until they finish the wizard.
 * Mounted inside DashboardLayout so every dashboard route is gated.
 */
export default function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/onboarding')) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

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
        if (d?.user && d.user.onboardingCompleted === false) {
          router.replace('/onboarding');
        }
      } catch {
        // Non-blocking — if /me fails, let the page render
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
