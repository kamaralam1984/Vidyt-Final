import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import {
  isSuperAdminRole as isSuperAdminRoleShared,
  isAdminRole,
} from '@/lib/roleNormalizer';

/** Normalize DB/JWT role strings (e.g. super_admin → super-admin) */
export function isSuperAdminRole(role: string | undefined | null): boolean {
  return isSuperAdminRoleShared(role);
}

export async function requireAdminAccess(request: NextRequest | Request) {
  const user = await getUserFromRequest(request as NextRequest);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  // Admin tier covers legacy `admin` PLUS the new plan-name roles
  // `enterprise` / `custom`, plus super-admin / superadmin.
  if (!isAdminRole(user.role as string)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}

export async function requireSuperAdminAccess(request: NextRequest | Request) {
  const user = await getUserFromRequest(request as NextRequest);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const ownerEmail = process.env.SUPER_ADMIN_EMAIL;
  const isOwner = isSuperAdminRole(user.role) && (!ownerEmail || user.email === ownerEmail);
  if (!isOwner) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}
