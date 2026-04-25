import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/', '/k/', '/tools/', '/blog/', '/pricing', '/about', '/trending', '/hashtags'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/user/', '/login', '/auth', '/signup', '/register', '/forgot-password', '/reset-password', '/verify-email', '/*?token=', '/*?redirect='],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/k/', '/tools/', '/blog/', '/pricing', '/about'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/user/', '/login', '/auth', '/signup', '/register'],
      },
      {
        userAgent: '*',
        allow: ['/', '/k/', '/tools/', '/blog/'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/user/', '/login', '/auth', '/signup', '/register', '/forgot-password', '/reset-password', '/verify-email'],
      },
      {
        userAgent: ['GPTBot', 'CCBot', 'anthropic-ai', 'ClaudeBot', 'Google-Extended', 'PerplexityBot'],
        disallow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
