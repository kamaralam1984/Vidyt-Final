'use client';

export const dynamic = 'force-dynamic';

import SuperAdminControlCenter from '@/components/admin/SuperAdminControlCenter';

/**
 * Single Super Admin home: plan, role, platform & feature control in one scrollable page.
 * (Pehle yahan alag sidebar + multiple view modes the — ab sab `SuperAdminControlCenter` me hai.)
 */
export default function SuperAdminHomePage() {
  return <SuperAdminControlCenter />;
}
