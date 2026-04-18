import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';

// ─── Cloudflare IP ranges (updated 2025) ──────────────────────────────────────
// https://www.cloudflare.com/ips/
const CLOUDFLARE_IP_RANGES = [
  '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '104.16.0.0/13', '104.24.0.0/14', '108.162.192.0/18',
  '131.0.72.0/22', '141.101.64.0/18', '162.158.0.0/15',
  '172.64.0.0/13', '173.245.48.0/20', '188.114.96.0/20',
  '190.93.240.0/20', '197.234.240.0/22', '198.41.128.0/17',
];

// ─── In-memory rate limiter (Edge-compatible) ─────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function edgeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit;
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  // Cleanup old entries periodically
  if (Math.random() < 0.005) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetAt) rateLimitStore.delete(k);
    }
  }

  return { allowed, remaining, retryAfter };
}

// ─── Security headers ──────────────────────────────────────────────────────────
// NOTE: Content-Security-Policy is set exclusively in next.config.js headers()
// so it applies to ALL routes uniformly. Do NOT set it here — dual-source CSP
// causes duplicate headers; browsers apply the most-restrictive intersection,
// silently breaking GTM / Razorpay / Cloudflare Insights.
function addSecurityHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  // CSP is set by next.config.js headers() — not here (see comment above).

  // No-cache for API routes
  if (request?.nextUrl?.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
  }

  // No-cache for HTML pages (prevents browser from caching stale CSP)
  const pathname = request?.nextUrl?.pathname ?? '';
  const isHtmlPage = !pathname.startsWith('/api/') && !pathname.startsWith('/_next/');
  if (isHtmlPage) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    response.headers.set('Vary', 'Cookie, Authorization');
  }

  // CORS for same-domain requests
  const origin = request?.headers.get('origin') || '';
  if (origin.endsWith('vidyt.com') || origin.includes('localhost:3000')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-user-id, x-user-role, x-user-subscription, x-test-token'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    response.headers.set('Access-Control-Allow-Origin', 'null');
  }

  // Cloudflare passthrough headers
  if (request) {
    const cfRay = request.headers.get('cf-ray');
    if (cfRay) response.headers.set('X-CF-Ray', cfRay);

    const cfCountry = request.headers.get('cf-ipcountry');
    if (cfCountry) {
      response.headers.set('X-Client-Country', cfCountry);
      const existingCookie = request.cookies.get('detected-country')?.value;
      if (!existingCookie || existingCookie !== cfCountry) {
        response.cookies.set('detected-country', cfCountry, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });
      }
    }
  }

  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  return response;
}

function nextWithHeaders(request: NextRequest, init?: any): NextResponse {
  return addSecurityHeaders(NextResponse.next(init), request);
}

function jsonError(request: NextRequest, message: string, status: number): NextResponse {
  return addSecurityHeaders(NextResponse.json({ error: message }, { status }), request);
}

// ─── Main middleware ───────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';

  // ── Redirect non-www → www ──
  if (hostname === 'vidyt.com') {
    const url = request.nextUrl.clone();
    url.host = 'www.vidyt.com';
    return NextResponse.redirect(url, { status: 301 });
  }

  // ── CORS preflight ──
  if (request.method === 'OPTIONS') {
    return addSecurityHeaders(new NextResponse(null, { status: 204 }), request);
  }

  // ── Health endpoints — public but rate-limited ──
  // No auth required. Rate-limited to stop bots polling in a tight loop.
  // NGINX applies its own health_limit zone; this is a second layer for
  // when requests reach Next.js directly (e.g., local dev, monitoring agents).
  if (pathname.startsWith('/api/health')) {
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';
    const rl = edgeRateLimit(`health:${ip}`, 30, 60 * 1000); // 30 req/min per IP
    if (!rl.allowed) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Too many requests' }, {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfter) },
        }),
        request
      );
    }
    const response = nextWithHeaders(request);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  // ── Global API rate limiting (Edge, in-memory) ──
  // Protects all /api/* routes from abuse before auth check
  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    // Auth endpoints: strict — 5 req / 15 min per IP
    if (pathname.startsWith('/api/auth/')) {
      const rl = edgeRateLimit(`auth:${ip}`, 5, 15 * 60 * 1000);
      if (!rl.allowed) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
              status: 429,
              headers: {
                'Retry-After': String(rl.retryAfter),
                'X-RateLimit-Limit': '5',
                'X-RateLimit-Remaining': '0',
              },
            }
          ),
          request
        );
      }
    }

    // General API: 60 req / min per IP
    const rl = edgeRateLimit(`api:${ip}`, 60, 60 * 1000);
    if (!rl.allowed) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Rate limit exceeded.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(rl.retryAfter),
              'X-RateLimit-Limit': '60',
              'X-RateLimit-Remaining': '0',
            },
          }
        ),
        request
      );
    }
  }

  const enableTestAuthHeader =
    process.env.ENABLE_TEST_AUTH_HEADER === 'true' || process.env.NODE_ENV === 'test';

  // ── Public API routes (no auth needed) ──
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/login-pin',
    '/api/auth/google',
    '/api/auth/callback',
    '/api/auth/password-reset',
    '/api/auth/prepare-signup',
    '/api/auth/verify-and-pay',
    '/api/payments/verify-signup-payment',
    '/api/auth/me',
    '/api/subscriptions/plans',
    '/api/payments/webhook',
    '/api/webhooks/paypal',
    '/api/posting-time',
    '/api/channel/videos',
    '/api/facebook/page/videos',
    '/api/admin/super/tracking',
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isPublicCron = [
    '/api/cron/ai-retrain',
    '/api/cron/sync-prediction-outcomes',
    '/api/cron/daily',
    '/api/cron/generate-seo-pages',
    '/api/cron/generate-trending-pages',
    '/api/cron/ping-google',
  ].includes(pathname);

  if (isPublicRoute || isPublicCron || pathname.startsWith('/api/public/')) {
    return nextWithHeaders(request);
  }

  const protectedPageRoutes = ['/admin', '/dashboard', '/user'];
  const isProtectedPageRoute = protectedPageRoutes.some(route => pathname.startsWith(route));
  const isAuthPageRoute = pathname === '/login' || pathname === '/auth';

  // ── Token extraction ──
  let token: string | null = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = request.cookies.get('token')?.value ?? null;
  }

  if (!token && enableTestAuthHeader) {
    token = request.headers.get('x-test-token') ??
      request.nextUrl.searchParams.get('test_token') ??
      request.nextUrl.searchParams.get('token') ?? null;
  }

  if (!token) {
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
      { error: 'Invalid or expired token', message: 'Your session has expired. Please login again.' },
      { status: 401 }
    );
  }

  // ── Authenticated — redirect away from login ──
  if (isAuthPageRoute) {
    const target = user.role === 'super-admin' ? '/admin/super' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // ── Role normalisation ──
  const roleNorm = String(user.role || '').toLowerCase().replace(/_/g, '-');
  const isSuperAdmin = roleNorm === 'super-admin' || roleNorm === 'superadmin';

  // ── Canonical URL: /dashboard/super → /admin/super ──
  if (pathname === '/dashboard/super' || pathname.startsWith('/dashboard/super/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/dashboard\/super/, '/admin/super');
    return NextResponse.redirect(url);
  }

  // ── Super-admin guard ──
  const isSuperAdminRoute = pathname === '/admin/super' || pathname.startsWith('/admin/super/');
  if (isSuperAdminRoute && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── Inject user headers for API routes ──
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-subscription', user.subscription);

  return nextWithHeaders(request, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/user/:path*',
    '/login',
    '/auth',
  ],
};
