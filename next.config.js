/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: '/login', destination: '/auth' }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5gb',
      allowedDevOrigins: ["192.168.0.197:3000", "localhost:3000"],
    },
    serverComponentsExternalPackages: ['@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg', 'natural'],
  },
  api: {
    bodyParser: {
      sizeLimit: '5gb',
    },
  },
  webpack: (config, { isServer }) => {
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
