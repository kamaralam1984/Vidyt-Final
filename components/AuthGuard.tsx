'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { decodeToken } from '@/utils/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  
  // ⚡️ Instant initialization - skip loading screen if token is valid
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      return !decodeToken(token || '');
    }
    return true;
  });
  
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      return !!decodeToken(token || '');
    }
    return false;
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Clear ghost cookies by calling logout API
        try {
          await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
        } catch (_) {}
        window.location.href = '/login?reason=no-token';
        return;
      }

      // ⚡️ Instant client-side check
      const payload = decodeToken(token);
      if (payload) {
        setAuthenticated(true);
        setLoading(false);
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setAuthenticated(true);
        } else {
          // 401 is expected when token is invalid/expired
          localStorage.removeItem('token');
          window.location.href = '/login?reason=expired';
        }
      } catch (error) {
        // If we already set authenticated true via client-side check, 
        // a network failure shouldn't necessarily kick the user out
        if (!authenticated) {
          localStorage.removeItem('token');
          window.location.href = '/login?reason=error';
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, authenticated]);

  if (!mounted) {
    return (
      <div className="flex h-screen bg-[#0F0F0F] items-center justify-center opacity-0">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF0000] mx-auto mb-4" />
          <p className="text-[#AAAAAA]">Initializing...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0F0F0F] items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF0000] mx-auto mb-4" />
          <p className="text-[#AAAAAA]">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

