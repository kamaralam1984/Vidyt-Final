import { MetadataRoute } from 'next';
import { seoToolsList } from '@/data/seoToolsList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://www.vidyt.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const core = [
    { path: '', priority: 1, freq: 'daily' },
    { path: '/pricing', priority: 0.9, freq: 'weekly' },
  ].map(r => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq as any,
    priority: r.priority,
  }));

  const publicPages = [
    '/about', '/contact', '/faq', '/compare', '/blog', '/trending', '/hashtags',
    '/posting-time', '/facebook-audit', '/viral-optimizer',
    '/help', '/changelog', '/status', '/tools/youtube-growth',
  ].map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const legal = [
    '/privacy-policy', '/terms', '/cookie-policy', '/refund-policy',
    '/data-requests', '/security', '/dmca',
  ].map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));

  const blog = [
    '/blog/youtube-seo-checklist',
    '/blog/thumbnail-frameworks',
    '/blog/viral-shorts-formula',
  ].map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const tools = seoToolsList.map(tool => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // /k/ SEO pages — hreflang removed from sitemap (was causing 60MB+ file).
  // Google ignores sitemap hreflang anyway; use <link rel="alternate"> in HTML instead.
  let kPages: MetadataRoute.Sitemap = [];
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    const SeoPage = (await import('@/models/SeoPage')).default;
    await connectDB();
    const pages = await SeoPage.find({ isIndexable: true })
      .select('slug updatedAt publishedAt qualityScore')
      .sort({ publishedAt: -1 })
      .limit(50000)
      .lean();
    kPages = (pages as any[]).map(p => {
      const score = p.qualityScore || 70;
      const priority = Number(Math.min(0.85, 0.5 + (score - 60) / 100).toFixed(2));
      const lastModified = p.publishedAt
        ? new Date(p.publishedAt)
        : p.updatedAt ? new Date(p.updatedAt) : now;
      return {
        url: `${BASE_URL}/k/${p.slug}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority,
      };
    });
  } catch {
    // DB unavailable — skip dynamic pages
  }

  return [...core, ...publicPages, ...legal, ...blog, ...tools, ...kPages];
}
