export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

function categorize(kw: string): string {
  const k = kw.toLowerCase();
  if (/game|gaming|pubg|fortnite|minecraft|gta|valorant/.test(k)) return 'Gaming';
  if (/music|song|beat|dj|rap|singer/.test(k)) return 'Music';
  if (/cook|food|recipe|baking|restaurant/.test(k)) return 'Food';
  if (/travel|tour|destination|vlog/.test(k)) return 'Travel';
  if (/fit|gym|workout|yoga|weight/.test(k)) return 'Fitness';
  if (/beauty|makeup|skincare|fashion/.test(k)) return 'Beauty';
  if (/tech|ai|code|software|phone|gadget/.test(k)) return 'Technology';
  if (/crypto|bitcoin|stock|invest|finance|trading/.test(k)) return 'Finance';
  if (/news|politic|election|government/.test(k)) return 'News';
  if (/education|study|learn|tutorial|course/.test(k)) return 'Education';
  return 'Entertainment';
}

function generatePageContent(keyword: string, category: string): { title: string; metaTitle: string; metaDescription: string; content: string; hashtags: string[]; relatedKeywords: string[] } {
  const kw = keyword.trim();
  const kwCap = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const year = new Date().getFullYear();

  const title = `${kwCap} — Free AI SEO Tool & Viral Guide ${year}`;
  const metaTitle = `${kwCap} | Best ${category} SEO Tool & Hashtag Generator | VidYT`;
  const metaDescription = `Get the best ${kw} titles, descriptions, hashtags, and viral tips for YouTube, Instagram, TikTok & Facebook. Free AI-powered ${kw} optimizer by VidYT.`;

  const content = `## ${kwCap} — Complete SEO Guide ${year}

Looking to create viral content about **${kw}**? VidYT's AI-powered platform helps you generate optimized titles, descriptions, hashtags, and scripts specifically for **${kw}** content.

### Why ${kwCap} Content is Trending
${kwCap} is one of the most searched topics in the ${category} niche. Creators who optimize their ${kw} videos with the right SEO strategy see 3-5x more views and engagement.

### Best ${kwCap} Hashtags
Use these trending hashtags in your ${kw} videos to maximize reach across YouTube, Instagram, and TikTok.

### How to Rank #1 for "${kwCap}"
1. **Title Optimization** — Include "${kw}" in the first 60 characters of your title
2. **Description SEO** — Write 200+ word descriptions with "${kw}" mentioned 3-4 times naturally
3. **Tags & Hashtags** — Use 15-20 related hashtags mixing broad and niche terms
4. **Thumbnail** — Use bold text, expressive face, and high contrast colors
5. **First 3 Seconds** — Hook viewers immediately with a surprising statement or question

### ${kwCap} Video Ideas
Generate unlimited ${kw} video ideas, scripts, and trending topics using VidYT's AI Studio. Our platform analyzes current trends and suggests content that has the highest viral potential.

### About VidYT
VidYT is the world's #1 AI-powered video optimization platform. We help creators go viral with smart SEO tools, thumbnail generators, script writers, and real-time analytics. Join thousands of creators who trust VidYT to grow their channels.

**[Try ${kwCap} SEO Tool Free →](/dashboard/youtube-seo)**`;

  const baseWord = kw.split(' ')[0] || kw;
  const hashtags = [
    `#${baseWord.replace(/\s+/g, '')}`, `#${kw.replace(/\s+/g, '')}`, '#viral', '#trending',
    `#${baseWord}tips`, `#${baseWord}${year}`, '#youtube', '#shorts', '#fyp', '#viralvideo',
    `#best${baseWord}`, '#subscribe', '#creator', '#content', `#${category.toLowerCase()}`,
  ];

  const relatedKeywords = [
    `${kw} tutorial`, `best ${kw}`, `${kw} tips`, `${kw} ${year}`,
    `how to ${kw}`, `${kw} for beginners`, `${kw} viral`, `${kw} trending`,
  ];

  return { title, metaTitle, metaDescription, content, hashtags, relatedKeywords };
}

/** GET — fetch or auto-create a keyword page */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = (searchParams.get('keyword') || '').trim();
    if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 });

    await connectDB();
    const slug = slugify(keyword);

    // Check if page exists
    let page = await SeoPage.findOne({ slug });

    if (!page) {
      // Auto-create page (upsert to avoid duplicate key errors)
      const category = categorize(keyword);
      const generated = generatePageContent(keyword, category);
      try {
        page = await SeoPage.findOneAndUpdate(
          { slug },
          { $setOnInsert: { slug, keyword, ...generated, viralScore: 70 + Math.floor(Math.random() * 25), category, source: 'user_search' } },
          { upsert: true, new: true }
        );
      } catch {
        page = await SeoPage.findOne({ slug });
      }
    }

    // Increment views
    await SeoPage.updateOne({ _id: page._id }, { $inc: { views: 1 } });

    return NextResponse.json({ page });
  } catch (e: any) {
    console.error('SEO Page error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
