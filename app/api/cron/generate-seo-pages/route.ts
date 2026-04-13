export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';

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

function categorize(kw: string): string {
  const k = kw.toLowerCase();
  if (/game|gaming|pubg|fortnite|minecraft|gta|valorant|roblox|free fire/.test(k)) return 'Gaming';
  if (/music|song|beat|dj|rap|guitar|singing/.test(k)) return 'Music';
  if (/cook|food|recipe|baking|street food|meal/.test(k)) return 'Food';
  if (/travel|tour|vlog|destination|adventure/.test(k)) return 'Travel';
  if (/fit|gym|workout|yoga|weight|muscle/.test(k)) return 'Fitness';
  if (/beauty|makeup|skincare|fashion|hair/.test(k)) return 'Beauty';
  if (/tech|ai|phone|laptop|gadget|app|software|edit/.test(k)) return 'Technology';
  if (/crypto|bitcoin|stock|invest|finance|trading|income/.test(k)) return 'Finance';
  if (/news|politic|election|world/.test(k)) return 'News';
  if (/study|exam|course|learn|tutorial|math/.test(k)) return 'Education';
  if (/youtube|instagram|tiktok|facebook|seo|hashtag|viral|channel|growth/.test(k)) return 'Social Media';
  if (/comedy|funny|meme|prank/.test(k)) return 'Comedy';
  if (/pet|dog|cat|animal/.test(k)) return 'Pets';
  if (/photo|video edit|premiere|photoshop/.test(k)) return 'Creative';
  if (/motivat|self|productiv|goal/.test(k)) return 'Self Improvement';
  return 'Entertainment';
}

function generateContent(keyword: string, category: string) {
  const kw = keyword.trim();
  const kwCap = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const year = new Date().getFullYear();
  const baseWord = kw.split(' ')[0];

  return {
    title: `${kwCap} — Free AI SEO Tool & Viral Guide ${year}`,
    metaTitle: `${kwCap} | Best ${category} SEO Tool & Hashtag Generator | VidYT`,
    metaDescription: `Get the best ${kw} titles, descriptions, hashtags, and viral tips for YouTube, Instagram, TikTok & Facebook. Free AI-powered ${kw} optimizer by VidYT.`,
    content: `## ${kwCap} — Complete SEO Guide ${year}\n\nLooking to create viral content about **${kw}**? VidYT's AI-powered platform helps you generate optimized titles, descriptions, hashtags, and scripts for **${kw}** content.\n\n### Why ${kwCap} Content is Trending\n${kwCap} is one of the most searched topics in the ${category} niche. Creators who optimize their ${kw} videos see 3-5x more views.\n\n### Best ${kwCap} Hashtags\nUse trending hashtags in your ${kw} videos to maximize reach across YouTube, Instagram, and TikTok.\n\n### How to Rank #1 for "${kwCap}"\n1. **Title** — Include "${kw}" in first 60 characters\n2. **Description** — 200+ words with "${kw}" 3-4 times\n3. **Tags** — 15-20 related hashtags\n4. **Thumbnail** — Bold text, face, high contrast\n5. **Hook** — First 3 seconds must grab attention\n\n### About VidYT\nVidYT is the #1 AI-powered video optimization platform. Smart SEO tools, thumbnail generators, script writers, and real-time analytics.\n\n**[Try ${kwCap} SEO Tool Free →](/dashboard/youtube-seo)**`,
    hashtags: [`#${baseWord.replace(/\s+/g, '')}`, `#${kw.replace(/\s+/g, '')}`, '#viral', '#trending', `#${baseWord}tips`, `#${baseWord}${year}`, '#youtube', '#shorts', '#fyp', '#subscribe', `#${category.toLowerCase()}`, '#creator', '#content', '#viralvideo', `#best${baseWord}`],
    relatedKeywords: [`${kw} tutorial`, `best ${kw}`, `${kw} tips`, `${kw} ${year}`, `how to ${kw}`, `${kw} for beginners`, `${kw} viral`, `${kw} trending`],
    viralScore: 65 + Math.floor(Math.random() * 30),
    category,
  };
}

/** GET /api/cron/generate-seo-pages — auto-generate 100 SEO pages daily */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const year = new Date().getFullYear();
    let created = 0;
    const target = 100;

    for (const niche of DAILY_NICHES) {
      if (created >= target) break;

      for (const template of KEYWORD_TEMPLATES) {
        if (created >= target) break;

        const keyword = template.replace('{niche}', niche).replace('{year}', String(year));
        const slug = slugify(keyword);

        // Skip if already exists
        const exists = await SeoPage.findOne({ slug }).select('_id').lean();
        if (exists) continue;

        const category = categorize(keyword);
        const data = generateContent(keyword, category);

        await SeoPage.create({ slug, keyword, ...data, source: 'auto_daily' });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      message: `Generated ${created} new SEO pages`,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('Cron SEO page generation error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
