/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Next.js static assets have content hashes – safe to cache long-term
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public static files (images, fonts, etc.)
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        // ALL HTML pages – tell Cloudflare never to cache
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
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
      allowedDevOrigins: ["192.168.0.197:3000", "localhost:3000"],
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
