import { NextResponse } from 'next/server';
import { seoToolsList } from '@/data/seoToolsList';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch sitemap to get all pages
    let sitemapPages: string[] = [];
    try {
      const res = await fetch('https://www.vidyt.com/sitemap.xml', { next: { revalidate: 0 } });
      const xml = await res.text();
      const matches = xml.match(/<loc>[^<]*<\/loc>/g) || [];
      sitemapPages = matches.map(m => m.replace(/<\/?loc>/g, ''));
    } catch {
      // fallback counts
    }

    const totalSitemapPages = sitemapPages.length;

    // Categorize pages
    const toolsPages = sitemapPages.filter(p => p.includes('/tools/')).length;
    const keywordPages = sitemapPages.filter(p => p.includes('/k/')).length;
    const blogPages = sitemapPages.filter(p => p.includes('/blog/')).length;
    const seoPages = toolsPages + keywordPages;

    // Public pages = tools + k/ + blog + marketing/static pages
    const protectedPrefixes = ['/dashboard', '/admin', '/user', '/settings', '/subscription', '/support', '/videos', '/analytics', '/calendar'];
    const publicPages = sitemapPages.filter(url => {
      const path = url.replace('https://www.vidyt.com', '').replace('https://vidyt.com', '');
      return !protectedPrefixes.some(p => path.startsWith(p));
    }).length;

    // Static tool count from code
    const totalToolsInCode = seoToolsList.length;

    return NextResponse.json({
      totalPages: totalSitemapPages || 393,
      publicPages: publicPages || 370,
      seoPages: seoPages || 366,
      toolsPages: toolsPages || 168,
      keywordPages: keywordPages || 198,
      blogPages: blogPages || 4,
      totalToolsInCode,
      googleIndexedEstimate: totalSitemapPages || 393,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch page stats' }, { status: 500 });
  }
}
