import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';

/**
 * Middleware to protect API routes
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const enableTestAuthHeader =
    process.env.ENABLE_TEST_AUTH_HEADER === 'true' || process.env.NODE_ENV === 'test';
  // Optional: test-only logging for header visibility issues.
  if (enableTestAuthHeader && pathname.startsWith('/api/auth/')) {
    try {
      console.log('[middleware:test] headers', Object.fromEntries(request.headers.entries()));
    } catch {
      // ignore
    }
  }

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

  const publicCronRoutes = ['/api/cron/ai-retrain', '/api/cron/sync-prediction-outcomes', '/api/cron/daily'];
  const isPublicCron = publicCronRoutes.includes(pathname);

  const protectedPageRoutes = ['/admin', '/dashboard', '/user'];
  const isProtectedPageRoute = protectedPageRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isPublicRoute || isPublicCron || pathname.startsWith('/api/public/')) {
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

  // Test-only auth fallback for integration/E2E runners.
  // Some runtimes/clients may not reliably forward Authorization headers into middleware.
  if (!token && enableTestAuthHeader) {
    const testToken = request.headers.get('x-test-token');
    if (testToken) token = testToken;
  }

  // Query-string fallback (robust to header stripping).
  if (!token && enableTestAuthHeader) {
    const qpToken =
      request.nextUrl.searchParams.get('test_token') ||
      request.nextUrl.searchParams.get('token');
    if (qpToken) token = qpToken;
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
