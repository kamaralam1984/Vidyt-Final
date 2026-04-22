export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore } from '@/lib/qualityScorer';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

function _legacyCategorize(kw: string): string {
  const k = kw.toLowerCase();
  if (/game|gaming|pubg|fortnite|minecraft|gta|valorant/.test(k)) return 'Gaming';
  if (/music|song|album|concert|singer|rapper/.test(k)) return 'Music';
  if (/cook|food|recipe|restaurant/.test(k)) return 'Food';
  if (/travel|tour|destination/.test(k)) return 'Travel';
  if (/tech|ai|apple|google|phone|iphone|samsung/.test(k)) return 'Technology';
  if (/crypto|bitcoin|stock|market|invest/.test(k)) return 'Finance';
  if (/sport|football|cricket|nba|soccer|tennis|ipl/.test(k)) return 'Sports';
  if (/movie|film|trailer|netflix|series/.test(k)) return 'Film & TV';
  if (/politic|election|government|war|attack/.test(k)) return 'News & Politics';
  if (/health|fitness|diet|yoga|workout/.test(k)) return 'Health';
  return 'Entertainment';
}

function _legacyGenerateTrendingContent(keyword: string, category: string, score: number) {
  const kw = keyword.trim();
  const kwCap = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const baseWord = kw.split(' ')[0] || kw;

  const title = `${kwCap} — Trending Now ${today} | Viral SEO Guide`;
  const metaTitle = `${kwCap} Trending ${year} | Best Hashtags, Titles & SEO Tips | VidYT`;
  const metaDescription = `${kwCap} is trending right now! Get the best ${kw} hashtags, viral titles, SEO descriptions, and video ideas. Free AI-powered tools by VidYT — the #1 video optimization platform.`;

  const content = `## ${kwCap} — Trending Right Now (${today})

**${kwCap}** is currently one of the hottest trending topics with a viral score of **${score}%**! If you're a content creator, now is the perfect time to create content about ${kw}.

### Why ${kwCap} is Trending
This topic is generating massive search volume and engagement across YouTube, Instagram, TikTok, and Facebook. Creators who jump on trending topics early see up to **10x more views** than their regular content.

### How to Create Viral ${kwCap} Content

**Step 1: Use the Right Title**
Your title should include "${kw}" in the first 60 characters. Use power words like "SHOCKING", "REVEALED", or "You Won't Believe" to boost CTR.

**Step 2: Optimize Your Description**
Write a 200+ word description. Include "${kw}" naturally 3-4 times. Add timestamps, links, and a strong call-to-action.

**Step 3: Use Trending Hashtags**
We've generated the best performing hashtags for ${kw} below. Use all 15 in your video description.

**Step 4: Create an Eye-Catching Thumbnail**
Use VidYT's AI Thumbnail Generator to create a film-poster style thumbnail with bold text and expressive face.

**Step 5: Post at the Right Time**
Use VidYT's Best Posting Time analyzer to find when your audience is most active.

### Best ${kwCap} Video Ideas
1. "${kwCap}: Everything You Need to Know"
2. "${kwCap} — The Truth Nobody is Telling You"
3. "I Tried ${kwCap} for 30 Days — Here's What Happened"
4. "${kwCap} vs Reality — Shocking Facts ${year}"
5. "Why ${kwCap} is Breaking the Internet Right Now"

### VidYT — Your Secret Weapon for Viral Content

**VidYT** is the world's #1 AI-powered video optimization platform trusted by thousands of creators worldwide. Here's what makes VidYT special:

- **YouTube Live SEO Analyzer** — Real-time SEO scoring with 11.8%+ CTR prediction
- **AI Keyword Intelligence** — Find viral keywords with scores and rankings
- **AI Thumbnail Generator** — Create film-poster style thumbnails with VFX
- **AI Script Generator** — Generate viral scripts in any language and tone
- **Hashtag Generator** — AI-powered hashtags for YouTube, Instagram, TikTok & Facebook
- **Trending Topics** — Real-time trends from Google & YouTube
- **Best Posting Time** — Analyze your channel for optimal posting schedule
- **Channel Analytics** — Complete health score with fix recommendations
- **Content Calendar** — Schedule and auto-upload to YouTube
- **Multi-Platform SEO** — YouTube, Facebook, Instagram analyzers
- **AI Coach** — Personal AI assistant for channel growth
- **Chinki AI** — 24/7 YouTube SEO expert chatbot

All tools use a **9-provider AI failover system** (OpenAI → Gemini → Groq → and more) so you never face downtime.

### Try VidYT Free

Start creating viral ${kw} content today. VidYT's free plan includes 5 video analyses, title optimization, hashtag generation, and more.

**[Start Free — No Credit Card Required →](/signup)**

**[Try ${kwCap} SEO Tool →](/dashboard/youtube-seo)**

**[Generate ${kwCap} Script →](/ai/script-generator)**

**[Get ${kwCap} Hashtags →](/hashtags)**`;

  const hashtags = [
    `#${baseWord.replace(/\s+/g, '')}`, `#${kw.replace(/\s+/g, '')}`, '#viral', '#trending',
    `#${baseWord}${year}`, `#trending${baseWord}`, '#youtube', '#shorts', '#fyp', '#viralvideo',
    '#subscribe', '#explore', '#creator', `#${category.toLowerCase().replace(/\s+/g, '')}`,
    `#${baseWord}news`,
  ];

  const relatedKeywords = [
    `${kw} latest news`, `${kw} trending today`, `${kw} viral video`,
    `${kw} ${year}`, `${kw} explained`, `${kw} update`, `${kw} reaction`,
    `best ${kw} videos`,
  ];

  return { title, metaTitle, metaDescription, content, hashtags, relatedKeywords, viralScore: score, category };
}

const MAX_SEO_PAGES = 5000; // Hard cap to prevent MongoDB Atlas storage overflow

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    let created = 0;
    const target = 100;

    // If at capacity, delete oldest pages first to stay under cap
    const totalCount = await SeoPage.countDocuments();
    if (totalCount >= MAX_SEO_PAGES) {
      const deleteCount = totalCount - MAX_SEO_PAGES + target;
      const oldest = await SeoPage.find({}).sort({ createdAt: 1 }).limit(deleteCount).select('_id').lean();
      const ids = oldest.map((d: any) => d._id);
      if (ids.length > 0) await SeoPage.deleteMany({ _id: { $in: ids } });
    }

    const allTrending: { keyword: string; score: number }[] = [];

    // 1) Fetch from Google Trends
    try {
      const googleTrends = require('google-trends-api');
      const dailyRes = await googleTrends.dailyTrends({ geo: 'US' });
      const dailyData = JSON.parse(dailyRes);
      const days = dailyData?.default?.trendingSearchesDays || [];
      for (const day of days.slice(0, 3)) {
        for (const search of (day.trendingSearches || []).slice(0, 20)) {
          const title = search.title?.query;
          if (title) {
            const traffic = search.formattedTraffic || '0';
            let score = 70;
            if (traffic.includes('M')) score = 95;
            else if (traffic.includes('K')) score = 75 + Math.min(20, parseFloat(traffic));
            allTrending.push({ keyword: title, score: Math.min(98, Math.round(score)) });
          }
        }
      }
    } catch (e) {
      console.error('[TrendingPages] Google Trends failed:', e);
    }

    // 2) Fetch from YouTube trending
    try {
      const { getApiConfig } = await import('@/lib/apiConfig');
      const config = await getApiConfig();
      if (config.youtubeDataApiKey) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&maxResults=25&key=${config.youtubeDataApiKey}`);
        const data = await res.json();
        for (const video of (data.items || [])) {
          const title = video.snippet?.title || '';
          const words = title.replace(/[|#\[\](){}]/g, ' ').split(' ').filter((w: string) => w.length > 3).slice(0, 4).join(' ');
          if (words) allTrending.push({ keyword: words, score: 80 + Math.floor(Math.random() * 15) });
        }
      }
    } catch (e) {
      console.error('[TrendingPages] YouTube trending failed:', e);
    }

    // 3) AI fallback if not enough
    if (allTrending.length < 50) {
      try {
        const { routeAI } = await import('@/lib/ai-router');
        const today = new Date().toISOString().slice(0, 10);
        const aiRes = await routeAI({
          prompt: `List 50 currently trending topics worldwide as of ${today}. Mix: news, entertainment, tech, sports, gaming, social media. Return ONLY JSON array: [{"keyword":"topic","score":85}]. No markdown.`,
          cacheKey: `trending-pages-ai-${today}`,
          cacheTtlSec: 7200,
        });
        const match = aiRes.text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          parsed.forEach((item: any) => {
            if (item.keyword) allTrending.push({ keyword: item.keyword, score: item.score || 75 });
          });
        }
      } catch { /* silent */ }
    }

    // 4) Deduplicate
    const seen = new Set<string>();
    const unique = allTrending.filter(t => {
      const slug = slugify(t.keyword);
      if (seen.has(slug) || slug.length < 3) return false;
      seen.add(slug);
      return true;
    });

    // 5) Create pages — rich content via seoContentBuilder, quality-scored
    //    upfront so the promote cron can immediately pick the best ones.
    let trendRank = 0;
    for (const trend of unique) {
      if (created >= target) break;
      trendRank++;
      const slug = slugify(trend.keyword);
      if (!slug || slug.length < 3) continue;

      const exists = await SeoPage.findOne({ slug }).select('_id').lean();
      if (exists) continue;

      const built = buildSeoContent(trend.keyword, {
        viralScore: trend.score,
        trendingRank: trendRank,
        isTrending: true,
      });

      const qualityScore = computeQualityScore({
        wordCount: built.wordCount,
        viralScore: trend.score,
        trendingRank: trendRank,
        views: 0,
        hashtagCount: built.hashtags.length,
        faqCount: built.faqs.length,
      });

      await SeoPage.create({
        slug,
        keyword: trend.keyword,
        title: built.title,
        metaTitle: built.metaTitle,
        metaDescription: built.metaDescription,
        content: built.content,
        hashtags: built.hashtags,
        relatedKeywords: built.relatedKeywords,
        viralScore: trend.score,
        category: built.category,
        wordCount: built.wordCount,
        qualityScore,
        trendingRank: trendRank,
        source: 'trending',
        // Start un-indexable. promote-seo-pages cron decides daily which top
        // 100 (by qualityScore) to flip to isIndexable:true.
        isIndexable: false,
        publishedAt: null,
      });
      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      totalTrendingFound: unique.length,
      message: `Generated ${created} trending SEO pages`,
      note: 'Pages created as un-indexable. Run /api/cron/promote-seo-pages to gate-promote the top 100 by qualityScore into the sitemap.',
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('Trending page generation error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
