import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { OAuth2Client } from 'google-auth-library';
import { generateUniqueNumericId, getRoleFromPlanAndUser, normalizePlan } from '@/lib/auth';
import { generateToken, type AuthUser } from '@/lib/auth-jwt';

// Force dynamic execution for API route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const errorParam = url.searchParams.get('error');

    if (errorParam) {
      console.error('Google OAuth Error:', errorParam);
      return NextResponse.redirect(`${url.origin}/auth?error=google_auth_failed`);
    }

    if (!code) {
      return NextResponse.redirect(`${url.origin}/auth?error=missing_code`);
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials', { clientId: !!clientId, clientSecret: !!clientSecret });
      return NextResponse.redirect(`${url.origin}/auth?error=server_configuration_error`);
    }

    // Initialize OAuth2Client with the exact redirect URI expected by Google
    const redirectUri = `${url.origin}/api/auth/google/callback`;
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Exchange auth code for tokens
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      throw new Error('No id_token in Google response');
    }

    // Verify token to securely extract user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Failed to retrieve email from Google payload');
    }

    await connectDB();
    const User = (await import('@/models/User')).default;

    // Look for existing user by googleId or email
    let user = await User.findOne({ 
      $or: [
        { googleId: payload.sub },
        { email: payload.email }
      ]
    });

    if (user) {
      let needsUpdate = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        needsUpdate = true;
      }
      if (!user.profilePicture && payload.picture) {
        user.profilePicture = payload.picture;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await user.save();
      }
    } else {
      const uniqueId = await generateUniqueNumericId();
      user = new User({
        uniqueId,
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        profilePicture: payload.picture,
        role: 'user',
        subscription: 'free',
        emailVerified: payload.email_verified || true
      });
      await user.save();
    }

    const role = getRoleFromPlanAndUser(user);
    const normalizedPlan = normalizePlan(user.subscription);
    
    user.lastLogin = new Date();
    user.role = role;
    user.subscription = normalizedPlan;
    await user.save();

    const authUser: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: role,
      subscription: user.subscription as any,
    };

    const token = await generateToken(authUser);

    let targetUrl = '/dashboard';
    if (user.role === 'super-admin') {
      targetUrl = '/admin/super';
    } else if (user.uniqueId) {
      targetUrl = `/user/${user.uniqueId}`;
    }

    // Because the AuthGuard reads from localStorage on the client immediately,
    // we return an HTML page that sets localStorage and redirects, effectively bridging the
    // server-side callback to the client-side session state.
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating...</title>
          <script>
            try {
              localStorage.setItem('token', '${token}');
              localStorage.setItem('uniqueId', '${user.uniqueId}');
            } catch (e) {
              console.error('Failed to save to localStorage', e);
            }
            window.location.href = '${targetUrl}';
          </script>
        </head>
        <body style="background-color: #0F0F0F; color: #FFFFFF; font-family: sans-serif; display: flex; box-sizing: border-box; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <p>Login successful! Redirecting...</p>
        </body>
      </html>
    `;

    const response = new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

    // Set cookie for direct API access
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Google Auth Callback error:', error);
    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/auth?error=auth_internal_error`);
  }
}
