import { MetadataRoute } from 'next';
import { seoToolsList } from '@/data/seoToolsList';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://vidyt.com";
  const now = new Date();

  // 1. Core Pages (highest priority)
  const coreRoutes = [
    { path: "", priority: 1, freq: 'daily' },
    { path: "/pricing", priority: 0.9, freq: 'weekly' },
    { path: "/signup", priority: 0.9, freq: 'monthly' },
    { path: "/register", priority: 0.9, freq: 'monthly' },
    { path: "/login", priority: 0.8, freq: 'monthly' },
    { path: "/auth", priority: 0.8, freq: 'monthly' },
  ].map(r => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq as any,
    priority: r.priority,
  }));

  // 2. Public Feature Pages
  const publicPages = [
    "/about", "/contact", "/blog", "/trending", "/hashtags", "/posting-time",
    "/analytics", "/calendar", "/videos", "/support", "/facebook-audit",
    "/viral-optimizer",
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

  // 6. Dynamic /k/ SEO Pages (from MongoDB)
  let kPages: MetadataRoute.Sitemap = [];
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    const SeoPage = (await import('@/models/SeoPage')).default;
    await connectDB();
    const pages = await SeoPage.find({}).select('slug updatedAt').sort({ views: -1 }).limit(5000).lean();
    kPages = (pages as any[]).map(p => ({
      url: `${baseUrl}/k/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));
  } catch {
    // DB not available — skip dynamic pages
  }

  return [...coreRoutes, ...publicPages, ...legalPages, ...blogPosts, ...toolRoutes, ...kPages];
}
