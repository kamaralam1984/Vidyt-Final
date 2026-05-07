import { MetadataRoute } from 'next';
import { seoToolsList } from '@/data/seoToolsList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.vidyt.com";
  const now = new Date();

  // 1. Core Pages (highest priority) — auth pages excluded (no SEO value)
  const coreRoutes = [
    { path: "", priority: 1, freq: 'daily' },
    { path: "/pricing", priority: 0.9, freq: 'weekly' },
  ].map(r => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq as any,
    priority: r.priority,
  }));

  // 2. Public Feature Pages
  const publicPages = [
    "/about", "/contact", "/faq", "/compare", "/blog", "/trending", "/hashtags",
    "/posting-time", "/facebook-audit", "/viral-optimizer", "/download", "/get-app",
    "/help", "/changelog", "/status", "/tools/youtube-growth",
  ].map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 3. Legal Pages (AdSense required)
  const legalPages = [
    "/privacy-policy", "/terms", "/cookie-policy", "/refund-policy",
    "/data-requests", "/security",
  ].map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));

  // 4. Blog Posts
  const blogPosts = [
    "/blog/youtube-seo-checklist",
    "/blog/thumbnail-frameworks",
    "/blog/viral-shorts-formula",
  ].map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 5. SEO Tool Pages (160+)
  const toolRoutes = seoToolsList.map(tool => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 6. Dynamic /k/ SEO Pages — ONLY indexable (quality-gated) pages
  //    Pages are promoted to isIndexable:true by the /api/cron/promote-seo-pages
  //    cron (max 100/day). This keeps sitemap lean and feeds Google only
  //    high-quality content, preventing "Crawled - currently not indexed" waste.
  let kPages: MetadataRoute.Sitemap = [];
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    const SeoPage = (await import('@/models/SeoPage')).default;
    await connectDB();
    // 50k matches Google's per-sitemap cap. With the 70+ quality floor +
    // daily cleanup cron, the indexable count stays well below this so no
    // page ends up sitemap-orphaned just because of an arbitrary 2k limit.
    const pages = await SeoPage.find({ isIndexable: true })
      .select('slug updatedAt publishedAt qualityScore')
      .sort({ publishedAt: -1 })
      .limit(50000)
      .lean();
    kPages = (pages as any[]).map(p => {
      const score = p.qualityScore || 70;
      // Higher-quality pages → higher priority (0.5 → 0.85 range)
      const priority = Math.min(0.85, 0.5 + (score - 60) / 100);
      // Use publishedAt for lastModified — that's the field the
      // freshness-rotation cron bumps to signal "active page" to Google.
      // updatedAt drifts on every minor write (view counter etc.) which
      // dilutes the freshness signal.
      const lastModified = p.publishedAt ? new Date(p.publishedAt)
        : (p.updatedAt ? new Date(p.updatedAt) : now);
      return {
        url: `${baseUrl}/k/${p.slug}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: Number(priority.toFixed(2)),
        // Hreflang alternates so Google ranks the page across English-
        // speaking markets (US/UK/IN/CA/AU). x-default is the universal
        // fallback. Localised /hi/k/<slug> URLs can be added here later
        // without changing the sitemap shape.
        alternates: {
          languages: {
            'en':        `${baseUrl}/k/${p.slug}`,
            'en-US':     `${baseUrl}/k/${p.slug}`,
            'en-GB':     `${baseUrl}/k/${p.slug}`,
            'en-IN':     `${baseUrl}/k/${p.slug}`,
            'en-CA':     `${baseUrl}/k/${p.slug}`,
            'en-AU':     `${baseUrl}/k/${p.slug}`,
            'x-default': `${baseUrl}/k/${p.slug}`,
          },
        },
      };
    });
  } catch {
    // DB not available — skip dynamic pages
  }

  return [...coreRoutes, ...publicPages, ...legalPages, ...blogPosts, ...toolRoutes, ...kPages];
}
