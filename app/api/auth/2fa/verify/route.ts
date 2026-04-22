export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { decryptSecret, verifyTotp, generateBackupCodes } from '@/lib/totp';
import bcrypt from 'bcryptjs';

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
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
  const user = await User.findById(authUser.id);
  if (!user || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: 'No pending 2FA enrollment. Start with /api/auth/2fa/enroll.' },
      { status: 404 },
    );
  }

  let secret: string;
  try {
    secret = decryptSecret(user.twoFactorSecret);
  } catch {
    return NextResponse.json({ error: 'Corrupted 2FA secret. Re-enroll.' }, { status: 500 });
  }

  if (!verifyTotp(secret, parsed.data.code)) {
    return NextResponse.json({ error: 'Invalid code. Check your authenticator clock.' }, { status: 400 });
  }

  const alreadyEnabled = user.twoFactorEnabled;
  user.twoFactorEnabled = true;

  // Issue one-time backup codes only on first enrollment
  let backupCodes: string[] | undefined;
  if (!alreadyEnabled) {
    backupCodes = generateBackupCodes(10);
    const hashed = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, 10)));
    (user as any).twoFactorBackupCodes = hashed;
  }

  await user.save();

  return NextResponse.json({
    success: true,
    enabled: true,
    ...(backupCodes ? { backupCodes, message: 'Save these backup codes somewhere safe — they will not be shown again.' } : {}),
  });
}
