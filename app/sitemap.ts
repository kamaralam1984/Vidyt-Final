import { MetadataRoute } from 'next';
import { seoToolsList } from '@/data/seoToolsList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://www.vidyt.com';
// 5 000 /k/ URLs per chunk × 7 hreflang = 35k entries → safely under 50MB
const K_CHUNK_SIZE = 5000;

function staticEntries(): MetadataRoute.Sitemap {
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
    '/posting-time', '/facebook-audit', '/viral-optimizer', '/download', '/get-app',
    '/help', '/changelog', '/status', '/tools/youtube-growth',
  ].map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const legal = [
    '/privacy-policy', '/terms', '/cookie-policy', '/refund-policy',
    '/data-requests', '/security',
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

  return [...core, ...publicPages, ...legal, ...blog, ...tools];
}

/**
 * generateSitemaps — called by Next.js to build the sitemap index.
 * id=0  → static pages
 * id=1+ → /k/ SEO pages in chunks of K_CHUNK_SIZE
 */
export async function generateSitemaps() {
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    const SeoPage = (await import('@/models/SeoPage')).default;
    await connectDB();
    const total = await SeoPage.countDocuments({ isIndexable: true });
    const kChunks = Math.max(1, Math.ceil(total / K_CHUNK_SIZE));
    return Array.from({ length: kChunks + 1 }, (_, i) => ({ id: i }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Chunk 0: static + tool pages (no DB needed)
  if (id === 0) return staticEntries();

  // Chunks 1+: /k/ pages
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    const SeoPage = (await import('@/models/SeoPage')).default;
    await connectDB();

    const skip = (id - 1) * K_CHUNK_SIZE;
    const pages = await SeoPage.find({ isIndexable: true })
      .select('slug updatedAt publishedAt qualityScore')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(K_CHUNK_SIZE)
      .lean();

    return (pages as any[]).map(p => {
      const score = p.qualityScore || 70;
      const priority = Number(Math.min(0.85, 0.5 + (score - 60) / 100).toFixed(2));
      const lastModified = p.publishedAt
        ? new Date(p.publishedAt)
        : p.updatedAt
        ? new Date(p.updatedAt)
        : new Date();
      return {
        url: `${BASE_URL}/k/${p.slug}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority,
        alternates: {
          languages: {
            en:          `${BASE_URL}/k/${p.slug}`,
            'en-US':     `${BASE_URL}/k/${p.slug}`,
            'en-GB':     `${BASE_URL}/k/${p.slug}`,
            'en-IN':     `${BASE_URL}/k/${p.slug}`,
            'en-CA':     `${BASE_URL}/k/${p.slug}`,
            'en-AU':     `${BASE_URL}/k/${p.slug}`,
            'x-default': `${BASE_URL}/k/${p.slug}`,
          },
        },
      };
    });
  } catch {
    return [];
  }
}
