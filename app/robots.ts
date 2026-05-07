import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com';

const PRIVATE_PATHS = [
  '/api/', '/admin/', '/dashboard/', '/user/', '/login', '/auth',
  '/signup', '/register', '/forgot-password', '/reset-password', '/verify-email',
  '/onboarding', '/subscription', '/settings', '/calendar', '/analytics',
  '/videos', '/upgrade', '/preview', '/unauthorized', '/maintenance',
  '/data-requests', '/*?token=', '/*?redirect=',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: [
          '/', '/k/', '/tools/', '/blog/', '/pricing', '/about', '/contact', '/faq',
          '/compare', '/trending', '/hashtags', '/posting-time', '/facebook-audit',
          '/viral-optimizer', '/thumbnail-generator', '/download', '/get-app',
          '/help', '/changelog', '/status', '/support',
          '/privacy-policy', '/terms', '/cookie-policy', '/refund-policy', '/security',
        ],
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/', '/k/', '/tools/', '/blog/', '/pricing', '/about', '/contact', '/faq',
          '/compare', '/trending', '/hashtags', '/posting-time', '/thumbnail-generator',
        ],
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: '*',
        allow: ['/', '/k/', '/tools/', '/blog/', '/pricing', '/about', '/contact', '/faq', '/compare', '/trending', '/hashtags'],
        disallow: PRIVATE_PATHS,
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
