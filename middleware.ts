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

  // Cache strategy for HTML pages:
  // — Authenticated/private routes: no-store (prevent caching of user-specific content)
  // — Public marketing/SEO pages: short CDN cache so Googlebot & Cloudflare can cache,
  //   unlocking crawl budget. Without this, Google sees "no-store" and throttles crawl.
  const pathname = request?.nextUrl?.pathname ?? '';
  const isHtmlPage = !pathname.startsWith('/api/') && !pathname.startsWith('/_next/');
  if (isHtmlPage) {
    const isPrivatePage =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/user') ||
      pathname === '/login' ||
      pathname === '/auth' ||
      pathname === '/signup' ||
      pathname === '/register' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname === '/verify-email';

    if (isPrivatePage) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('CDN-Cache-Control', 'no-store');
      response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
      response.headers.set('Vary', 'Cookie, Authorization');
    } else {
      // Public SEO pages — allow browser short-cache + CDN edge-cache + stale-while-revalidate.
      // s-maxage=3600 lets Cloudflare serve from edge for 1h (huge Googlebot win).
      // stale-while-revalidate=86400 serves stale for 24h while revalidating in background.
      response.headers.set(
        'Cache-Control',
        'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
      );
      response.headers.set('CDN-Cache-Control', 'public, s-maxage=3600');
      response.headers.set('Cloudflare-CDN-Cache-Control', 'public, s-maxage=3600');
    }
  }

  // CORS for same-domain requests
  const origin = request?.headers.get('origin') || '';
  const isAllowedOrigin =
    origin === 'https://www.vidyt.com' ||
    origin === 'https://vidyt.com' ||
    (process.env.NODE_ENV !== 'production' && (origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000'));
  if (isAllowedOrigin) {
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
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-forwarded-proto', 'https');
  requestHeaders.set('x-forwarded-port', '443');
  if (!requestHeaders.get('x-forwarded-host')) {
    requestHeaders.set('x-forwarded-host', request.headers.get('host') || 'www.vidyt.com');
  }
  return addSecurityHeaders(
    NextResponse.next({ ...init, request: { headers: requestHeaders } }),
    request
  );
}

function jsonError(request: NextRequest, message: string, status: number): NextResponse {
  return addSecurityHeaders(NextResponse.json({ error: message }, { status }), request);
}

// Build a clean redirect URL that always uses the public HTTPS origin (no :3000 leak)
function publicUrl(path: string): URL {
  return new URL(path, 'https://www.vidyt.com');
}

// ─── Main middleware ───────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';


  // ── CORS preflight ──
  if (request.method === 'OPTIONS') {
    return addSecurityHeaders(new NextResponse(null, { status: 204 }), request);
  }

  // ── Health endpoints — public but rate-limited ──
  // No auth required. Rate-limited to stop bots polling in a tight loop.
  // NGINX applies its own health_limit zone; this is a second layer for
  // when requests reach Next.js directly (e.g., local dev, monitoring agents).
  if (pathname.startsWith('/api/health')) {
    // Health checks MUST be public to allow the connection indicator to work
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';
    
    // Explicitly allow /api/health/db without any further checks
    if (pathname === '/api/health/db') {
      const response = nextWithHeaders(request);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

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

    // Auth endpoints: strict — 5 req / 15 min per IP (only login/password endpoints, not me/logout/google)
    const isLoginEndpoint = pathname === '/api/auth/login' || pathname === '/api/auth/login-pin' ||
      pathname === '/api/auth/password-reset' || pathname === '/api/auth/prepare-signup' ||
      pathname === '/api/auth/verify-and-pay';
    if (isLoginEndpoint) {
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

    // Google OAuth endpoints — generous limit (user can refresh/retry OAuth flow)
    const isGoogleOAuth = pathname.startsWith('/api/auth/google') || pathname.startsWith('/api/auth/callback/google');
    if (isGoogleOAuth) {
      const rl = edgeRateLimit(`oauth:${ip}`, 30, 60 * 1000); // 30 req/min — won't clash with general limit
      if (!rl.allowed) {
        return addSecurityHeaders(
          NextResponse.redirect(new URL('/auth?error=too_many_requests', request.url)),
          request
        );
      }
      return nextWithHeaders(request); // skip general limiter for OAuth
    }

    // General API: 120 req / min per IP (increased — SEO page makes many parallel calls)
    const rl = edgeRateLimit(`api:${ip}`, 120, 60 * 1000);
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
    '/api/health',
    '/api/auth/login',
    '/api/auth/login-pin',
    '/api/auth/logout',
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
    '/api/cron/promote-seo-pages',
    '/api/cron/ping-google',
  ].includes(pathname);

  if (isPublicRoute || isPublicCron || pathname.startsWith('/api/public/') || pathname === '/api/auth/me') {
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
      const loginUrl = publicUrl('/login');
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
      const response = NextResponse.redirect(publicUrl('/login'));
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
    return NextResponse.redirect(publicUrl(target));
  }

  // ── Role normalisation ──
  const roleNorm = String(user.role || '').toLowerCase().replace(/_/g, '-');
  const isSuperAdmin = roleNorm === 'super-admin' || roleNorm === 'superadmin';

  // ── Canonical URL: /dashboard/super → /admin/super ──
  if (pathname === '/dashboard/super' || pathname.startsWith('/dashboard/super/')) {
    const newPath = pathname.replace(/^\/dashboard\/super/, '/admin/super');
    return NextResponse.redirect(publicUrl(newPath));
  }

  // ── Super-admin guard ──
  const isSuperAdminRoute = pathname === '/admin/super' || pathname.startsWith('/admin/super/');
  if (isSuperAdminRoute && !isSuperAdmin) {
    return NextResponse.redirect(publicUrl('/dashboard'));
  }

  // ── Inject user headers for API routes ──
  const requestHeaders = new Headers(request.headers);
  // Fix Cloudflare Tunnel forwarded headers so Next.js uses port 443, not 3000
  requestHeaders.set('x-forwarded-proto', 'https');
  requestHeaders.set('x-forwarded-port', '443');
  if (!requestHeaders.get('x-forwarded-host')) {
    requestHeaders.set('x-forwarded-host', hostname || 'www.vidyt.com');
  }
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
