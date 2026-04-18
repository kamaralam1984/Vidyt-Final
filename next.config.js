/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
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
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'" +
                " https://cdn.jsdelivr.net" +
                " https://checkout.razorpay.com https://api.razorpay.com https://cdn.razorpay.com" +
                " https://www.paypal.com" +
                " https://accounts.google.com" +
                " https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com" +
                " https://static.cloudflareinsights.com https://cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://accounts.google.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
              "connect-src 'self' https: wss:" +
                " https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net" +
                " https://cloudflareinsights.com https://static.cloudflareinsights.com" +
                " https://api.razorpay.com https://checkout.razorpay.com",
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.paypal.com https://accounts.google.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
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
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    serverComponentsExternalPackages: ['@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg', 'natural'],
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

module.exports = nextConfig
