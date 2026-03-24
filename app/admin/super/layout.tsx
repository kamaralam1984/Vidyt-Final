'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SuperSidebar from '@/components/admin/SuperSidebar';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        const role = res.data?.user?.role;
        if (['super-admin', 'superadmin', 'admin'].includes(role)) {
          setAllowed(true);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };
    check();
  }, []);

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SuperSidebar />
      <main className="pl-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
