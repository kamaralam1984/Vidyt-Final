import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';

/**
 * Middleware to protect API routes
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't need authentication
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/password-reset', // Password reset (public)
    '/api/auth/send-otp', // OTP sending (public)
    '/api/auth/verify-otp', // OTP verification (public)
    '/api/auth/prepare-signup', // New strict signup preparation
    '/api/auth/verify-and-pay', // New strict signup OTP verification and payment
    '/api/payments/verify-signup-payment', // New strict signup payment verification
    '/api/auth/me', // Allow /api/auth/me to handle auth internally
    '/api/subscriptions/plans',
    '/api/health/db', // Database health check
    '/api/payments/webhook', // Razorpay webhook (public, verified by signature)
    '/api/posting-time', // Posting time heatmap (public, general data)
    '/api/channel/videos', // Channel videos (public, uses RSS feeds)
    '/api/facebook/page/videos', // Facebook page videos (public, returns empty array - Facebook doesn't support automatic fetching)
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  const protectedPageRoutes = ['/admin', '/dashboard', '/user'];
  const isProtectedPageRoute = protectedPageRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookie for direct browser navigation (e.g. OAuth redirects)
    const cookieToken = request.cookies.get('token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    // Protect key frontend panels from unauthenticated access.
    if (isProtectedPageRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!pathname.startsWith('/api')) return NextResponse.next();

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  const user = await verifyToken(token);

  if (!user) {
    if (isProtectedPageRoute) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('token');
      return response;
    }

    return NextResponse.json(
      {
        error: 'Invalid or expired token',
        message: 'Your session has expired. Please login again.'
      },
      { status: 401 }
    );
  }

  // Add user to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-subscription', user.subscription);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/dashboard/:path*', '/user/:path*'],
};
