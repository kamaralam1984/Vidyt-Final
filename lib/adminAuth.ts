import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const ADMIN_ROLES = new Set(['admin', 'super-admin', 'superadmin']);
const SUPER_ADMIN_ROLES = new Set(['super-admin', 'superadmin']);

/** Normalize DB/JWT role strings (e.g. super_admin → super-admin) */
export function isSuperAdminRole(role: string | undefined | null): boolean {
  if (!role) return false;
  const r = String(role).toLowerCase().replace(/_/g, '-');
  return r === 'super-admin' || r === 'superadmin';
}

export async function requireAdminAccess(request: NextRequest | Request) {
  const user = await getUserFromRequest(request as NextRequest);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!ADMIN_ROLES.has(String(user.role || '').toLowerCase())) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}

export async function requireSuperAdminAccess(request: NextRequest | Request) {
  const user = await getUserFromRequest(request as NextRequest);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!isSuperAdminRole(user.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}
