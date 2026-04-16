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
        // Next.js static assets — cache forever (content-hashed)
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Public static files
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        // Security headers on ALL routes
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://checkout.razorpay.com https://api.razorpay.com https://www.paypal.com https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://accounts.google.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.paypal.com https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
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
