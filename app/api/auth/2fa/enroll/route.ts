export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { encryptSecret, generateTotp } from '@/lib/totp';

export async function POST(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(authUser.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: '2FA is already enabled. Disable it before re-enrolling.' },
      { status: 409 },
    );
  }

  const { secretBase32, uri } = generateTotp(user.email);
  const qrDataUrl = await QRCode.toDataURL(uri, { width: 240, margin: 1 });

  // Store encrypted but not yet enabled — user must verify first
  user.twoFactorSecret = encryptSecret(secretBase32);
  user.twoFactorEnabled = false;
  await user.save();

  return NextResponse.json({
    success: true,
    secret: secretBase32,
    qr: qrDataUrl,
    otpauthUrl: uri,
    message: 'Scan the QR in an authenticator app, then POST a 6-digit code to /api/auth/2fa/verify to finish enrollment.',
  });
}
