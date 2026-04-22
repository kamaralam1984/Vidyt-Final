/** @type {import('next').NextConfig} */

// Opt-in bundle analyzer. Run `ANALYZE=true npm run build` to open reports in the browser.
// Degrades gracefully if @next/bundle-analyzer isn't installed (no crash in CI/dev).
let withBundleAnalyzer = (cfg) => cfg;
if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
  } catch {
    console.warn('[next.config] ANALYZE=true set but @next/bundle-analyzer is not installed. Run: npm i -D @next/bundle-analyzer');
  }
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  // Single merged experimental block — duplicate keys silently drop the first one
  experimental: {
    serverActions: {
      allowedOrigins: ['vidyt.com', 'www.vidyt.com'],
      bodySizeLimit: '50mb',
    },
    // Keep heavy server-only packages out of the webpack bundle
    serverComponentsExternalPackages: [
      '@ffmpeg-installer/ffmpeg',
      'fluent-ffmpeg',
      'natural',
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-node',
      'sharp',
    ],
    // Tree-shake icon/component libraries — reduces per-page JS significantly
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'date-fns',
    ],
  },
  async headers() {
    return [
      {
        // Security headers + no-cache on ALL routes (applied first, overridden below for static assets)
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          // CDN-specific no-cache headers — Cloudflare respects these even with "Cache Everything" rules
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
          { key: 'Surrogate-Control', value: 'no-store' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          {
            // Single source of truth for CSP — middleware.ts does NOT set this header.
            // Browsers apply all CSP headers as a logical AND (most restrictive wins),
            // so having two sources silently breaks third-party scripts.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",

              // Scripts: GTM/GA inline loaders + Cloudflare Insights beacon + Razorpay checkout/risk
              //          + Google GSI + AdSense
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'" +
                " https://www.googletagmanager.com" +
                " https://www.google-analytics.com" +
                " https://ssl.google-analytics.com" +
                " https://static.cloudflareinsights.com" +
                " https://cdn.razorpay.com" +
                " https://checkout.razorpay.com" +
                " https://api.razorpay.com" +
                " https://accounts.google.com" +
                " https://pagead2.googlesyndication.com" +
                " https://adservice.google.com" +
                " https://challenges.cloudflare.com",

              // Styles: inline only (Google Translate removed)
              "style-src 'self' 'unsafe-inline'" +
                " https://www.gstatic.com",

              // XHR/fetch/WebSocket: GA, CF Insights, Razorpay, Google OAuth, AdSense
              "connect-src 'self' wss: ws:" +
                " https://www.vidyt.com" +
                " https://www.vidyt.com:3000" +
                " https://vidyt.com" +
                " https://vidyt.com:3000" +
                " https://www.google-analytics.com" +
                " https://analytics.google.com" +
                " https://region1.google-analytics.com" +
                " https://stats.g.doubleclick.net" +
                " https://www.googletagmanager.com" +
                " https://cloudflareinsights.com" +
                " https://static.cloudflareinsights.com" +
                " https://api.razorpay.com" +
                " https://lumberjack.razorpay.com" +
                " https://accounts.google.com" +
                " https://oauth2.googleapis.com" +
                " https://www.googleapis.com" +
                " https://youtube.googleapis.com" +
                " https://pagead2.googlesyndication.com" +
                " https://adservice.google.com" +
                " https://googleads.g.doubleclick.net" +
                " https://challenges.cloudflare.com" +
                " https://api.pwnedpasswords.com",

              // Images: allow data URIs and any HTTPS image (avatars, thumbnails, etc.)
              "img-src 'self' data: blob: https:",

              // Media: video/audio playback (blob: for local preview, https: for remote)
              "media-src 'self' blob: https:",

              // Fonts
              "font-src 'self' data: https://fonts.gstatic.com",

              // iframes: Razorpay checkout modal + Google OAuth + AdSense
              "frame-src https://checkout.razorpay.com https://api.razorpay.com" +
                " https://accounts.google.com" +
                " https://googleads.g.doubleclick.net" +
                " https://tpc.googlesyndication.com" +
                " https://challenges.cloudflare.com",

              // Service workers (PWA, Next.js)
              "worker-src 'self' blob:",

              // Disable dangerous features
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",

              // Auto-upgrade any http:// resource reference on our pages to
              // https://. Belt-and-suspenders alongside Cloudflare "Always
              // Use HTTPS" + HSTS preload — protects against one-off mixed
              // content (e.g., a stray http:// link in user-generated SEO
              // content) without breaking anything.
              "upgrade-insecure-requests",

              // Report CSP violations to our own endpoint (logs to stderr)
              "report-uri /api/csp-report",
              "report-to csp-endpoint",
            ].join('; '),
          },
          {
            // report-to endpoint descriptor (pairs with `report-to csp-endpoint` above)
            key: 'Report-To',
            value: JSON.stringify({
              group: 'csp-endpoint',
              max_age: 10886400,
              endpoints: [{ url: '/api/csp-report' }],
            }),
          },
        ],
      },
      {
        // Public static files — overrides Cache-Control from above
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        // Public image/font assets (Logo.png, favicons, etc.) — allow Cloudflare to cache them
        source: '/:file((?!api|_next).+\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|eot))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
      {
        // Next.js static assets — LAST so it overrides /:path* Cache-Control
        // no-transform prevents Cloudflare Auto-Minify from corrupting content-hashed chunks
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable, no-transform' },
        ],
      },
      {
        // Next.js image optimization endpoint
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: '/login', destination: '/auth' }];
  },
  async redirects() {
    return [
      // Redirect non-www → www at the routing layer (before middleware runs)
      // Handles ALL paths so every page is covered, not just middleware-matched routes
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'vidyt.com' }],
        destination: 'https://www.vidyt.com/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800, // 7 days — optimized images cached longer
    deviceSizes: [384, 512, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  webpack: (config, { isServer }) => {
    // Exclude mobile directory from webpack build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/mobile/**', '**/node_modules/**'],
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    if (isServer) {
      config.externals = config.externals || [];
    }
    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig)
