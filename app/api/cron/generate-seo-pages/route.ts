export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';

const DAILY_NICHES = [
  'Gaming', 'PUBG Mobile', 'Free Fire', 'Minecraft', 'GTA 5', 'Valorant', 'Roblox', 'Fortnite', 'Call of Duty', 'Apex Legends',
  'YouTube Growth', 'YouTube SEO', 'YouTube Shorts', 'YouTube Algorithm', 'YouTube Monetization',
  'Instagram Reels', 'Instagram Growth', 'Instagram SEO', 'Instagram Hashtags', 'Instagram Followers',
  'TikTok Viral', 'TikTok Growth', 'TikTok Algorithm', 'TikTok Hashtags', 'TikTok Trending',
  'Facebook Reels', 'Facebook Page Growth', 'Facebook Video', 'Facebook Algorithm', 'Facebook Monetization',
  'Cooking', 'Street Food', 'Baking', 'Indian Cooking', 'Healthy Recipes', 'Quick Meals',
  'Travel Vlog', 'Budget Travel', 'Solo Travel', 'Luxury Travel', 'Adventure Travel',
  'Fitness', 'Home Workout', 'Gym Tips', 'Weight Loss', 'Muscle Building', 'Yoga',
  'Tech Review', 'Phone Review', 'Laptop Review', 'AI Tools', 'Best Apps', 'Gadgets',
  'Crypto', 'Bitcoin', 'Day Trading', 'Stock Market', 'Investing Tips', 'Passive Income',
  'Makeup Tutorial', 'Skincare Routine', 'Hairstyle', 'Fashion Tips', 'Beauty Hacks',
  'Music Production', 'Beat Making', 'Guitar Tutorial', 'Singing Tips', 'DJ Mixing',
  'Study Tips', 'Exam Preparation', 'Online Courses', 'Language Learning', 'Math Tutorial',
  'Motivational', 'Self Improvement', 'Productivity', 'Time Management', 'Goal Setting',
  'Comedy', 'Funny Videos', 'Memes', 'Prank Videos', 'Stand Up Comedy',
  'News Channel', 'Breaking News', 'Political News', 'World News', 'Sports News',
  'Photography', 'Video Editing', 'Premiere Pro', 'After Effects', 'Photoshop',
  'Pet Videos', 'Dog Training', 'Cat Videos', 'Pet Care', 'Animal Rescue',
];

const KEYWORD_TEMPLATES = [
  '{niche} hashtags', '{niche} title generator', '{niche} description generator',
  'best {niche} hashtags {year}', '{niche} SEO tips', '{niche} viral tips',
  '{niche} keywords', 'how to grow {niche} channel', '{niche} trending topics',
  '{niche} video ideas', 'best {niche} tags', '{niche} optimization',
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}


/** GET /api/cron/generate-seo-pages — auto-generate new pages + upgrade thin existing pages */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const year = new Date().getFullYear();
    let created = 0;
    let upgraded = 0;
    // Lowered 100 → 20 (quality over quantity). Combined with the trending
    // cron's 20/day, total daily creation is now 40 — well below the
    // INDEXABLE_THRESHOLD=75 promotion cap so only proven-good pages enter
    // the sitemap.
    const target = 20;

    // ── 1. Generate new pages via the shared 5-variant builder ─────────────
    //   Uses buildSeoContent so this cron and generate-trending-pages stay
    //   in sync — both produce identically-structured (but variant-rotated)
    //   content. The variant is picked deterministically by keyword hash, so
    //   adjacent niche+template combinations produce different page layouts
    //   (avoids Google's near-duplicate clustering).
    for (const niche of DAILY_NICHES) {
      if (created >= target) break;

      for (const template of KEYWORD_TEMPLATES) {
        if (created >= target) break;

        const keyword = template.replace('{niche}', niche).replace('{year}', String(year));
        const slug = slugify(keyword);

        const exists = await SeoPage.findOne({ slug }).select('_id wordCount').lean() as any;
        if (exists) continue;

        const built = buildSeoContent(keyword);
        const qualityScore = computeQualityScore({
          wordCount: built.wordCount,
          viralScore: 75,
          trendingRank: 0,
          views: 0,
          hashtagCount: built.hashtags.length,
          faqCount: built.faqs.length,
          slug,
        });

        await SeoPage.create({
          slug,
          keyword,
          title: built.title,
          metaTitle: built.metaTitle,
          metaDescription: built.metaDescription,
          content: built.content,
          hashtags: built.hashtags,
          relatedKeywords: built.relatedKeywords,
          viralScore: 75,
          category: built.category,
          wordCount: built.wordCount,
          qualityScore,
          source: 'auto_daily',
          isIndexable: false, // promote-seo-pages cron decides this
          publishedAt: null,
        });
        created++;
      }
    }

    // ── 2. Upgrade up to 200 thin existing pages (wordCount < 400) ────────
    //   Uses the same builder so legacy thin pages get the new 5-variant
    //   treatment when they are re-rendered. We do NOT delete the page —
    //   only re-write its content fields. (Owner: never auto-delete.)
    const thinPages = await SeoPage.find({
      $or: [{ wordCount: { $lt: 400 } }, { wordCount: { $exists: false } }],
      isIndexable: { $ne: true },
    }).select('slug keyword category').limit(200).lean();

    const upgradeOps: any[] = [];
    for (const p of thinPages as any[]) {
      const kw = (p.keyword || (p.slug as string).replace(/-/g, ' ')).trim();
      if (!kw) continue;
      const built = buildSeoContent(kw);
      upgradeOps.push({
        updateOne: {
          filter: { slug: p.slug },
          update: {
            $set: {
              title: built.title,
              metaTitle: built.metaTitle,
              metaDescription: built.metaDescription,
              content: built.content,
              hashtags: built.hashtags,
              relatedKeywords: built.relatedKeywords,
              category: built.category,
              wordCount: built.wordCount,
              source: p.source || 'auto_daily',
            },
          },
        },
      });
      upgraded++;
    }
    if (upgradeOps.length) await SeoPage.bulkWrite(upgradeOps, { ordered: false });

    return NextResponse.json({
      success: true,
      created,
      upgraded,
      message: `Generated ${created} new pages · Upgraded ${upgraded} thin pages`,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('Cron SEO page generation error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
