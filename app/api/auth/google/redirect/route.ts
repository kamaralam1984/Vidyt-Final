export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect('https://www.vidyt.com/auth?error=server_configuration_error');
  }

  // Always use the public domain — request.url carries the internal :3000 port
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com').replace(/\/$/, '');
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  const client = new OAuth2Client(clientId, clientSecret, redirectUri);

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account consent',
    include_granted_scopes: false,
  });

  return NextResponse.redirect(authUrl);
}
