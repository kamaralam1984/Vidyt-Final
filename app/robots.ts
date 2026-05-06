import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: [
          '/', '/k/', '/tools/', '/blog/', '/pricing', '/about', '/contact', '/faq',
          '/compare', '/trending', '/hashtags', '/posting-time', '/facebook-audit',
          '/viral-optimizer', '/download', '/get-app', '/help', '/changelog', '/status',
          '/privacy-policy', '/terms', '/cookie-policy', '/refund-policy', '/security',
        ],
        disallow: ['/api/', '/admin/', '/dashboard/', '/user/', '/login', '/auth', '/signup', '/register', '/forgot-password', '/reset-password', '/verify-email', '/*?token=', '/*?redirect='],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/', '/k/', '/tools/', '/blog/', '/pricing', '/about', '/contact', '/faq',
          '/compare', '/trending', '/hashtags', '/posting-time',
        ],
        disallow: ['/api/', '/admin/', '/dashboard/', '/user/', '/login', '/auth', '/signup', '/register'],
      },
      {
        userAgent: '*',
        allow: ['/', '/k/', '/tools/', '/blog/', '/pricing', '/about', '/contact', '/faq', '/compare', '/trending', '/hashtags'],
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
