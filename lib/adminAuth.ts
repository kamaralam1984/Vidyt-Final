import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-jwt';

const ADMIN_ROLES = new Set(['admin', 'super-admin', 'superadmin']);
const SUPER_ADMIN_ROLES = new Set(['super-admin', 'superadmin']);

export async function requireAdminAccess(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!ADMIN_ROLES.has(String(user.role || '').toLowerCase())) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}

export async function requireSuperAdminAccess(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!SUPER_ADMIN_ROLES.has(String(user.role || '').toLowerCase())) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}
