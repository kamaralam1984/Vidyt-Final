export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { verifyPassword } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { decryptSecret, verifyTotp } from '@/lib/totp';

const schema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits').optional(),
});

export async function POST(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(authUser.id).select('+password');
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (!user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA is not enabled on this account.' }, { status: 409 });
  }

  const passwordOk = user.password
    ? await verifyPassword(parsed.data.password, user.password)
    : false;
  if (!passwordOk) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  // If a code is provided, require it to match — defense in depth
  if (parsed.data.code && user.twoFactorSecret) {
    try {
      const secret = decryptSecret(user.twoFactorSecret);
      if (!verifyTotp(secret, parsed.data.code)) {
        return NextResponse.json({ error: 'Invalid 2FA code.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Could not verify 2FA secret.' }, { status: 500 });
    }
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  (user as any).twoFactorBackupCodes = undefined;
  await user.save();

  return NextResponse.json({ success: true, enabled: false });
}
