import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';

/**
 * Add Cloudflare & security headers to response
 */
function addSecurityHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking/framing
  response.headers.set('X-Frame-Options', 'DENY');

  // Legacy XSS protection header
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // HSTS - Force HTTPS for 1 year
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (disable unnecessary permissions)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Content Security Policy (CSP)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.stripe.com https://checkout.razorpay.com https://api.razorpay.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://js.stripe.com https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self';"
  );

  // CORS Headers - Allow cross-origin requests between apex and www domains
  const origin = request?.headers.get('origin') || '';
  if (origin.endsWith('vidyt.com') || origin.endsWith('localhost:3000')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-role, x-user-subscription, x-test-token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  // Remove sensitive headers that reveal server info
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  response.headers.delete('X-AspNet-Version');

  // Add Cloudflare info if available (passthrough from upstream)
  if (request) {
    const cfRay = request.headers.get('cf-ray');
    if (cfRay) {
      response.headers.set('X-CF-Ray', cfRay);
    }

    const cfCountry = request.headers.get('cf-ipcountry');
    if (cfCountry) {
      response.headers.set('X-Client-Country', cfCountry);
    }
  }

  return response;
}

/**
 * Get response with headers added
 */
function withSecurityHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  return addSecurityHeaders(response, request);
}

/**
 * Create next response with headers
 */
function nextWithHeaders(request: NextRequest, init?: any): NextResponse {
  const response = NextResponse.next(init);
  return addSecurityHeaders(response, request);
}

/**
 * JSON error response with headers
 */
function jsonError(request: NextRequest, message: string, status: number): NextResponse {
  const response = NextResponse.json({ error: message }, { status });
  return addSecurityHeaders(response, request);
}

/**
 * Middleware to protect API routes & add Cloudflare security
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
    '/api/auth/login-pin',
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
    '/api/payments/stripe/webhook', // Stripe webhook (public, verified by signature)
    '/api/posting-time', // Posting time heatmap (public, general data)
    '/api/channel/videos', // Channel videos (public, uses RSS feeds)
    '/api/facebook/page/videos', // Facebook page videos (public, returns empty array - Facebook doesn't support automatic fetching)
    '/api/admin/super/tracking', // Tracking is best-effort — route handles auth internally and skips unauthenticated events
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

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addSecurityHeaders(response, request);
  }

  if (isPublicRoute || isPublicCron || pathname.startsWith('/api/public/')) {
    return nextWithHeaders(request);
  }

  // Check if user is already authenticated and trying to access login/auth
  const isAuthPageRoute = pathname === '/login' || pathname === '/auth';

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

    if (isAuthPageRoute) return nextWithHeaders(request);

    if (!pathname.startsWith('/api')) return nextWithHeaders(request);

    return jsonError(request, 'Unauthorized', 401);
  }
  const user = await verifyToken(token);

  if (!user) {
    if (isAuthPageRoute) {
       const response = nextWithHeaders(request);
       response.cookies.delete('token');
       return response;
    }

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

  // Redirect authenticated users away from login/auth
  if (isAuthPageRoute) {
    const target = user.role === 'super-admin' ? '/admin/super' : '/dashboard';
    console.log(`[Middleware] Authenticated user ${user.email} accessing login, redirecting to ${target}`);
    return NextResponse.redirect(new URL(target, request.url));
  }

  const roleNorm = String(user.role || '')
    .toLowerCase()
    .replace(/_/g, '-');
  const isSuperAdminRole = roleNorm === 'super-admin' || roleNorm === 'superadmin';

  if (pathname.startsWith('/admin/super')) {
    console.log(`[Middleware] User: ${user.email}, Role: ${user.role}, Norm: ${roleNorm}, IsSuper: ${isSuperAdminRole}`);
  }

  // Canonical URL: /dashboard/super → /admin/super (same UI, always use admin layout + sidebar)
  if (pathname === '/dashboard/super' || pathname.startsWith('/dashboard/super/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/dashboard\/super/, '/admin/super');
    console.log(`[Middleware] Redirecting /dashboard/super to /admin/super`);
    return NextResponse.redirect(url);
  }

  // Super Admin panel: only super-admin roles (not generic admin / user)
  const isSuperAdminPanelRoute =
    pathname === '/admin/super' || pathname.startsWith('/admin/super/');
  if (isSuperAdminPanelRoute && !isSuperAdminRole) {
    console.warn(`[Middleware] Access denied for /admin/super. Role: ${user.role}. Redirecting to /dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-subscription', user.subscription);

  return nextWithHeaders(request, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/dashboard/:path*', '/user/:path*', '/login', '/auth'],
};
