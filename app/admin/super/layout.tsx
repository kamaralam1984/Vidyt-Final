'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SuperSidebar from '@/components/admin/SuperSidebar';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  /** `/admin/super` root page has its own full "SaaS Control Center" sidebar — hide the slim SuperSidebar to avoid two left bars */
  const hideOuterSidebar = pathname === '/admin/super';
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        const role = String(res.data?.user?.role || '')
          .toLowerCase()
          .replace(/_/g, '-');
        if (role === 'super-admin' || role === 'superadmin') {
          setAllowed(true);
        } else {
          router.replace('/dashboard');
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
      {!hideOuterSidebar && <SuperSidebar />}
      <main className={hideOuterSidebar ? 'min-h-screen' : 'pl-64 min-h-screen'}>
        {children}
      </main>
    </div>
  );
}
