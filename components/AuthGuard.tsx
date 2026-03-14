'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAuthenticated(true);
        } else {
          // 401 is expected when token is invalid/expired - don't log as error
          if (response.status !== 401) {
            console.warn('Auth check failed with status:', response.status);
          }
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        // Only log unexpected errors, not network issues
        const err = error as any;
        if (err.name !== 'TypeError' || !err.message.includes('fetch')) {
          console.error('Auth check error:', error);
        }
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
