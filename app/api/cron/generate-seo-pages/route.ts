export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore, INDEXABLE_THRESHOLD } from '@/lib/qualityScorer';
import { sanitizeSeoKeyword } from '@/lib/seoKeywordSanitizer';

const DAILY_NICHES = [
  // Gaming
  'Gaming', 'PUBG Mobile', 'Free Fire', 'Minecraft', 'GTA 5', 'Valorant', 'Roblox', 'Fortnite', 'Call of Duty', 'Apex Legends',
  'Among Us', 'Clash of Clans', 'Mobile Legends', 'League of Legends', 'Counter Strike', 'Bgmi', 'Warzone',
  // YouTube & Creator
  'YouTube Growth', 'YouTube SEO', 'YouTube Shorts', 'YouTube Algorithm', 'YouTube Monetization',
  'YouTube Channel', 'YouTube Analytics', 'YouTube Studio', 'YouTube Automation', 'YouTube Faceless',
  // Instagram
  'Instagram Reels', 'Instagram Growth', 'Instagram SEO', 'Instagram Followers', 'Instagram Stories',
  'Instagram Marketing', 'Instagram Business', 'Instagram Explore',
  // TikTok
  'TikTok Growth', 'TikTok Algorithm', 'TikTok Trending', 'TikTok Marketing', 'TikTok Business',
  'TikTok Monetization', 'TikTok Creator',
  // Facebook
  'Facebook Reels', 'Facebook Page Growth', 'Facebook Video', 'Facebook Monetization', 'Facebook Marketing',
  // Food & Cooking
  'Cooking', 'Street Food', 'Baking', 'Indian Cooking', 'Healthy Recipes', 'Quick Meals',
  'Vegan Recipes', 'Breakfast Ideas', 'Dinner Recipes', 'Dessert Recipes',
  // Travel
  'Travel Vlog', 'Budget Travel', 'Solo Travel', 'Luxury Travel', 'Adventure Travel',
  'India Travel', 'Europe Travel', 'International Travel',
  // Fitness & Health
  'Fitness', 'Home Workout', 'Gym Tips', 'Weight Loss', 'Muscle Building', 'Yoga',
  'Cardio Workout', 'Abs Workout', 'Running Tips', 'Keto Diet', 'Intermittent Fasting',
  // Tech
  'Tech Review', 'Phone Review', 'Laptop Review', 'AI Tools', 'Best Apps', 'Gadgets',
  'Smartphone Tips', 'Android Tips', 'iPhone Tips', 'Smart Home',
  // Finance
  'Crypto', 'Bitcoin', 'Day Trading', 'Stock Market', 'Investing Tips', 'Passive Income',
  'Personal Finance', 'Saving Money', 'Affiliate Marketing', 'Dropshipping',
  // Beauty & Fashion
  'Makeup Tutorial', 'Skincare Routine', 'Hairstyle', 'Fashion Tips', 'Beauty Hacks',
  'Natural Skincare', 'Hair Care', 'Nail Art',
  // Music
  'Music Production', 'Beat Making', 'Guitar Tutorial', 'Singing Tips', 'DJ Mixing',
  'Piano Tutorial', 'Music Promotion',
  // Education
  'Study Tips', 'Exam Preparation', 'Online Courses', 'Language Learning', 'Math Tutorial',
  'Science Tutorial', 'English Speaking',
  // Mindset & Productivity
  'Motivational', 'Self Improvement', 'Productivity', 'Time Management', 'Goal Setting',
  'Morning Routine', 'Mindfulness',
  // Entertainment
  'Comedy', 'Funny Videos', 'Memes', 'Stand Up Comedy', 'Reaction Videos',
  // News
  'News Channel', 'Breaking News', 'World News', 'Sports News',
  // Creative
  'Photography', 'Video Editing', 'Premiere Pro', 'After Effects', 'Photoshop',
  'CapCut Editing', 'Canva Design', 'Graphic Design',
  // Pets & Animals
  'Pet Videos', 'Dog Training', 'Cat Videos', 'Pet Care', 'Animal Rescue',
  // Kids & Family
  'Kids Videos', 'Kids Learning', 'Parenting Tips', 'Family Vlog',
  // Business
  'Small Business', 'Startup Tips', 'Ecommerce', 'Amazon Selling', 'Freelancing',
  // Lifestyle
  'Daily Vlog', 'Room Tour', 'Morning Routine', 'Night Routine', 'Minimalism',
];

const KEYWORD_TEMPLATES = [
  // Core SEO tools
  '{niche} title ideas', '{niche} description tips', '{niche} hashtags for youtube',
  'best {niche} keywords {year}', '{niche} SEO guide', '{niche} viral strategy',
  'how to rank {niche} videos', '{niche} content ideas', '{niche} trending now',
  '{niche} video script', 'best tags for {niche}', '{niche} channel growth',
  // Audience & platform
  '{niche} for beginners', '{niche} tutorial {year}', '{niche} tips and tricks',
  'grow {niche} channel fast', '{niche} shorts ideas', '{niche} reels ideas',
  '{niche} tiktok strategy', '{niche} instagram growth',
  // Monetization & business
  '{niche} monetization tips', 'earn money from {niche}', '{niche} sponsorship guide',
  '{niche} affiliate marketing', '{niche} passive income',
  // Deep-dive angles
  'complete {niche} guide {year}', '{niche} algorithm tips', '{niche} thumbnail ideas',
  'best {niche} tools', '{niche} analytics guide', '{niche} promotion strategy',
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
    // 200/day from the curated DAILY_NICHES × KEYWORD_TEMPLATES pool (~3,600
    // unique combinations). Keywords are sanitized before creation to skip any
    // niche+template combo that produces duplicate words (e.g. "Instagram
    // Hashtags hashtags for youtube") — Google treats those as spam signals.
    const target = 200;

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

        // Skip if this niche+template combination produces duplicate words
        // (e.g. "Instagram Hashtags hashtags for youtube" → spam signal for Google)
        const sanity = sanitizeSeoKeyword(keyword);
        if (!sanity.ok) continue;

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

        const meetsThreshold = qualityScore >= INDEXABLE_THRESHOLD;
        await SeoPage.create({
          slug,
          keyword,
          title: built.title,
          metaTitle: built.metaTitle,
          metaDescription: built.metaDescription,
          content: built.content,
          hashtags: built.hashtags,
          relatedKeywords: built.relatedKeywords,
          faqs: built.faqs,
          viralScore: 75,
          category: built.category,
          wordCount: built.wordCount,
          qualityScore,
          source: 'auto_daily',
          isIndexable: meetsThreshold,
          publishedAt: meetsThreshold ? new Date() : null,
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
    }).select('slug keyword category').limit(500).lean();

    const upgradeOps: any[] = [];
    for (const p of thinPages as any[]) {
      const kw = (p.keyword || (p.slug as string).replace(/-/g, ' ')).trim();
      if (!kw) continue;
      const built = buildSeoContent(kw);
      const upgradeScore = computeQualityScore({
        wordCount: built.wordCount,
        viralScore: 75,
        trendingRank: 0,
        views: 0,
        hashtagCount: built.hashtags.length,
        faqCount: built.faqs.length,
        slug: p.slug,
      });
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
              faqs: built.faqs,
              category: built.category,
              wordCount: built.wordCount,
              qualityScore: upgradeScore,
              source: p.source || 'auto_daily',
            },
          },
        },
      });
      upgraded++;
    }
    if (upgradeOps.length) await SeoPage.bulkWrite(upgradeOps, { ordered: false });

    // ── 3. Auto-promote all pending pages (score ≥ threshold, not yet indexable)
    //   This covers: newly upgraded pages + any page that passed threshold but
    //   was never picked up by the promote cron.
    const pendingResult = await SeoPage.updateMany(
      {
        isIndexable: { $ne: true },
        qualityScore: { $gte: INDEXABLE_THRESHOLD },
      },
      { $set: { isIndexable: true, publishedAt: new Date() } }
    );
    const autoPromoted = pendingResult.modifiedCount || 0;

    return NextResponse.json({
      success: true,
      created,
      upgraded,
      autoPromoted,
      message: `Generated ${created} new · Upgraded ${upgraded} thin · Auto-promoted ${autoPromoted} pending`,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('Cron SEO page generation error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
