export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getTrendingTopics } from '@/services/trendingEngine';
import { generateLearningInsights } from '@/services/ai/adaptiveLearning';
import { randomUUID } from 'crypto';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import User from '@/models/User';
import { routeAI } from '@/lib/ai-router';

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────
interface UltraRequest {
  topic?: string;
  niche?: string;
  platform?: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'shorts';
  region?: string;
  language?: string;
}

function safeParseJson(text: string): Record<string, unknown> {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return {};
    return JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ─────────────────────────────────────
// Fallback generators (ALWAYS produce output)
// ─────────────────────────────────────
function buildFallbackOutput(topic: string, platform: string, region: string, year: number) {
  const t = topic || 'viral content';
  const slug = t.replace(/\s+/g, '');

  const trendingTopics = [
    { title: t, category: 'Trending', platform, trend_score: '88', freshness_hours: '2', competition: 'Medium', reason: 'Rapidly rising search volume in last 24h' },
    { title: `${t} latest news`, category: 'News', platform, trend_score: '82', freshness_hours: '4', competition: 'Low', reason: 'High search intent, low saturation' },
    { title: `${t} today update`, category: 'News', platform, trend_score: '78', freshness_hours: '6', competition: 'Low', reason: 'Breaking content window open' },
    { title: `${t} explained`, category: 'Education', platform, trend_score: '74', freshness_hours: '8', competition: 'Medium', reason: 'Evergreen + trending combo' },
    { title: `${t} viral video`, category: 'Entertainment', platform, trend_score: '70', freshness_hours: '12', competition: 'High', reason: 'High volume, competitive niche' },
  ];

  const viral_hooks = [
    `You won't believe what's happening with ${t} right now...`,
    `Everyone is talking about ${t} — and nobody is explaining it correctly.`,
    `STOP. Before you scroll — you need to know this about ${t}.`,
    `I investigated ${t} for 48 hours. Here's what I found.`,
    `The hidden truth about ${t} that mainstream media won't cover.`,
    `${t} just changed everything — here's what it means for YOU.`,
    `Why ${t} is trending and why it matters more than you think.`,
    `Last week I ignored ${t}. This week I can't stop talking about it.`,
    `The ${t} situation is getting out of control — full breakdown inside.`,
    `Exclusive: What really happened with ${t} (unfiltered).`,
  ];

  const optimized_titles = [
    `${t} EXPOSED! Full Truth ${year} | Viral Breakdown`,
    `${t} — What They're NOT Telling You (MUST WATCH)`,
    `Why ${t} Is the Biggest Story of ${year} | Deep Dive`,
    `${t}: Complete Update + Analysis | ${region === 'india' ? 'Hindi' : 'English'} Explained`,
    `🔥 ${t} VIRAL: Everything You Need to Know in 5 Minutes`,
  ];

  const ai_descriptions = [
    `In this video, we cover everything about ${t} with full analysis, facts, and latest updates for ${year}. Don't miss this deep dive. Like & Subscribe for daily updates.`,
    `${t} has taken the internet by storm. We break down what happened, why it matters, and what comes next. Subscribe for more viral content coverage.`,
  ];

  const thumbnail_suggestions = [
    { text: `${t.toUpperCase()} EXPOSED`, emotion: 'shock', color_style: 'Red + Black + White high contrast', composition: 'Bold text center. Shocked face left. Breaking news banner bottom.' },
    { text: `THE TRUTH ABOUT ${t.toUpperCase()}`, emotion: 'curiosity', color_style: 'Gold + Dark Blue', composition: 'Question-mark graphic. Arrow pointing right. Blurred mystery image background.' },
    { text: `${t.toUpperCase()} BREAKDOWN`, emotion: 'urgency', color_style: 'Orange + Black', composition: 'Timer graphic. Text overlay top-third. Creator face bottom-right.' },
  ];

  const viral_keywords = [
    t, `${t} news`, `${t} update`, `${t} today`, `${t} ${year}`,
    `${t} explained`, `${t} viral`, `${t} latest`, `${t} live`,
    `${t} breaking news`, `what is ${t}`, `${t} truth`,
    `${t} analysis`, `${t} full video`, `${t} reaction`,
    `${t} hindi`, `${t} english`, `${t} trending`,
    '#viral', '#trending', `#${slug}`, '#breakingnews', '#fyp',
    '#shorts', '#youtubeshorts', '#viralvideo', '#news', '#${year}',
    'viral news', 'trending news', 'breaking news today', 'latest news',
    `${t} update news`, 'news viral video', 'viral content', 'news today',
    `${t} facts`, `${t} reality`, `${t} story`,
    'youtube viral', 'shorts viral', `${t} short video`,
    'news shorts', 'viral shorts', `${t} explained hindi`,
    'india news', 'world news', `${t} world update`,
    `${t} full story`, `${t} background`, `${t} history`,
    'content creator', 'youtuber', 'viral strategy', 'youtube seo',
    `best ${t} video`, `${t} channel`, `subscribe ${t}`,
    `${t} like share`, `trending ${year}`, `viral ${year}`,
  ];

  const hashtags = [
    `#${slug}`, `#${slug}News`, `#${slug}Update`,
    '#viral', '#trending', '#breakingnews', '#fyp', '#shorts',
    '#youtubeshorts', '#viralvideo', '#news', `#${year}`,
    '#india', '#worldnews', '#latestnews', '#mustwatch',
    '#subscribe', '#like', '#share', '#explore', '#reels',
    '#contentcreator', '#youtuber', '#newsupdate', '#todaynews',
  ];

  return {
    trending_topics: trendingTopics,
    viral_hooks,
    optimized_titles,
    ai_descriptions,
    thumbnail_suggestions,
    scripts: {
      short_script: `[HOOK - 0-3s]\n"Stop scrolling! ${t} just changed everything — and I'll explain it in 60 seconds."\n\n[MAIN - 3-50s]\nPoint 1: What is ${t}?\nPoint 2: Why is it trending right now?\nPoint 3: What does it mean for you?\n\n[CTA - 50-60s]\n"Like this video, subscribe, and comment your thoughts on ${t} below! 👇"`,
      long_script: `[HOOK - 0-5s]\n"In the next 10 minutes, I'm going to tell you everything about ${t} that you need to know — and I promise you'll see it differently by the end."\n\n[INTRO - 5-30s]\nGreet audience. Introduce ${t}. Tell them what they'll learn.\n\n[SECTION 1 - Background (30s-2min)]\nWhat is ${t}? Where did it start? Who is involved?\n\n[SECTION 2 - Why it's trending (2-4min)]\nWhat triggered ${t} to go viral? Social media snowball effect. Key moments.\n\n[SECTION 3 - Deep Dive (4-7min)]\nFull analysis of ${t}. Facts, data, expert opinions.\n\n[SECTION 4 - Impact (7-9min)]\nWhat does ${t} mean for the world? For India? For viewers?\n\n[OUTRO & CTA - 9-10min]\n"That's the full truth about ${t}. If this helped you, SMASH the like button, SUBSCRIBE for daily breakdowns, and COMMENT your biggest question below! See you in the next one!"`,
    },
    viral_keywords,
    hashtags,
    best_posting_time: {
      platform,
      time_slots: [
        { day: 'Monday', time: '7:00 PM IST', estimated_reach: 'High' },
        { day: 'Tuesday', time: '8:00 PM IST', estimated_reach: 'Very High' },
        { day: 'Wednesday', time: '6:00 PM IST', estimated_reach: 'High' },
        { day: 'Friday', time: '9:00 PM IST', estimated_reach: 'Peak' },
        { day: 'Saturday', time: '11:00 AM IST', estimated_reach: 'Very High' },
        { day: 'Sunday', time: '10:00 AM IST', estimated_reach: 'Peak' },
      ],
    },
    competitor_insight: {
      what_is_working: `Videos on ${t} with fast-cut editing, bold thumbnails + shock text, and 5-10 min length are getting 3-10x typical views. News + opinion hybrid format performs best.`,
      content_pattern: `Hook first 5 seconds → Problem/situation → Analysis → Personal take → CTA. Thumbnails use red/yellow high contrast + shocked face. Titles include "${t}" + power word (EXPOSED, TRUTH, SHOCKING).`,
      opportunity_gap: `Most creators cover ${t} surface-level. Deep-dive explainer videos under 8 min with Hindi or bilingual commentary are UNDERSERVED. You can capture this gap immediately.`,
    },
    api_status: { primary: 'fallback', secondary: 'fallback', fallback_mode: 'yes' },
    seo_score_estimate: '78/100',
    viral_probability: '74%',
  };
}

// ─────────────────────────────────────
// Main AI prompt
// ─────────────────────────────────────
function buildMasterPrompt(topic: string, platform: string, region: string, language: string, year: number): string {
  return `You are VidYT Ultra AI Engine — the most advanced viral content intelligence system.

Generate a COMPLETE viral content strategy for:
- Topic: "${topic}"
- Platform: ${platform}
- Region: ${region}
- Language: ${language}
- Year: ${year}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "trending_topics": [
    { "title": "", "category": "", "platform": "${platform}", "trend_score": "0-100", "freshness_hours": "0-48", "competition": "Low/Medium/High", "reason": "" }
  ],
  "viral_hooks": ["hook1", "hook2", "hook3", "hook4", "hook5", "hook6", "hook7", "hook8", "hook9", "hook10"],
  "optimized_titles": ["title1", "title2", "title3", "title4", "title5"],
  "ai_descriptions": ["desc1", "desc2"],
  "thumbnail_suggestions": [
    { "text": "", "emotion": "", "color_style": "", "composition": "" },
    { "text": "", "emotion": "", "color_style": "", "composition": "" },
    { "text": "", "emotion": "", "color_style": "", "composition": "" }
  ],
  "scripts": {
    "short_script": "60-second script for Shorts/Reels with hook, main points, CTA",
    "long_script": "8-10 minute script with full structure: hook, intro, 4 sections, outro"
  },
  "viral_keywords": ["50+ keywords mixing high-volume, long-tail, trending"],
  "hashtags": ["25+ hashtags with #"],
  "best_posting_time": {
    "platform": "${platform}",
    "time_slots": [{ "day": "", "time": "HH:MM IST", "estimated_reach": "Low/Medium/High/Very High/Peak" }]
  },
  "competitor_insight": {
    "what_is_working": "",
    "content_pattern": "",
    "opportunity_gap": ""
  },
  "seo_score_estimate": "score/100",
  "viral_probability": "percent%"
}

RULES:
- trending_topics: 5 entries, each with distinct angle on "${topic}"
- viral_hooks: use DIFFERENT styles — curiosity, shock, story, FOMO, controversy, emotional, reverse, numbers
- optimized_titles: CTR-focused, platform-specific, mix news/shock/curiosity styles
- all keywords in viral_keywords: minimum 50 items
- hashtags: minimum 25 items
- scripts: full, production-ready, word-count appropriate
- competitor_insight: specific, actionable, real tactics
- API and api_status fields: NOT included in this response (handled server side)`;
}

// ─────────────────────────────────────
// Route handler
// ─────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as UltraRequest;
    const topic = (body.topic || '').trim() || 'viral content';
    const niche = (body.niche || '').trim() || topic;
    const platform = body.platform || 'youtube';
    const region = (body.region || 'india').toLowerCase();
    const language = (body.language || 'english').toLowerCase();
    const year = new Date().getFullYear();
    const sessionId = randomUUID();

    // ── 1. Run trending + learning in parallel  ──────────────────────────────
    let trendingRaw: { keyword: string; score: number }[] = [];
    let trendApiStatus: 'success' | 'fallback' = 'fallback';
    let learningInsightsResult: Awaited<ReturnType<typeof generateLearningInsights>>;

    [trendingRaw, learningInsightsResult] = await Promise.all([
      getTrendingTopics([topic, niche], platform === 'shorts' ? 'youtube' : platform as any).then(r => { trendApiStatus = 'success'; return r; }).catch(() => { return []; }),
      generateLearningInsights(user.id, topic, platform, niche),
    ]);

    const trendingTopicsFromEngine = trendingRaw.map((t, i) => ({
      title: t.keyword,
      category: i % 2 === 0 ? 'Trending' : 'News',
      platform,
      trend_score: String(t.score),
      freshness_hours: String(Math.round(Math.random() * 20 + 2)),
      competition: t.score > 80 ? 'High' : t.score > 60 ? 'Medium' : 'Low',
      reason: `Google Trends spike detected — score ${t.score}/100`,
    }));

    // ── 2. AI content generation ─────────────────────────────────────────────
    let primaryApiStatus: 'success' | 'fail' = 'fail';
    let secondaryApiStatus: 'used' | 'fallback' = 'fallback';
    let fallbackMode: 'yes' | 'no' = 'yes';
    let aiJson: Record<string, unknown> = {};
    const prompt = buildMasterPrompt(topic, platform, region, language, year);
    const ai = await routeAI({
      prompt,
      timeoutMs: 15000,
      cacheKey: `ultra-intel:${platform}:${topic}:${region}:${language}`.toLowerCase(),
      cacheTtlSec: 180,
      fallbackText: '{}',
    });
    aiJson = safeParseJson(ai.text || '{}');
    if (Object.keys(aiJson).length > 3) {
      fallbackMode = 'no';
      if (['openai', 'gemini'].includes(ai.provider)) {
        primaryApiStatus = 'success';
      } else {
        primaryApiStatus = 'fail';
        secondaryApiStatus = 'used';
      }
    } else {
      primaryApiStatus = 'fail';
      secondaryApiStatus = 'fallback';
      fallbackMode = 'yes';
    }

    // ── 3. Merge AI output with engine data + fallback fill ───────────────────
    const fallback = buildFallbackOutput(topic, platform, region, year);

    const aiTopics = Array.isArray(aiJson.trending_topics) ? aiJson.trending_topics as any[] : [];
    const mergedTrendingTopics = [
      ...trendingTopicsFromEngine.slice(0, 3),
      ...aiTopics.slice(0, 5),
      ...(aiTopics.length === 0 ? fallback.trending_topics.slice(3) : []),
    ].slice(0, 8);

    const viral_hooks = (Array.isArray(aiJson.viral_hooks) && aiJson.viral_hooks.length >= 5)
      ? aiJson.viral_hooks
      : fallback.viral_hooks;

    const optimized_titles = (Array.isArray(aiJson.optimized_titles) && aiJson.optimized_titles.length >= 3)
      ? aiJson.optimized_titles
      : fallback.optimized_titles;

    const ai_descriptions = (Array.isArray(aiJson.ai_descriptions) && aiJson.ai_descriptions.length > 0)
      ? aiJson.ai_descriptions
      : fallback.ai_descriptions;

    const thumbnail_suggestions = (Array.isArray(aiJson.thumbnail_suggestions) && aiJson.thumbnail_suggestions.length > 0)
      ? aiJson.thumbnail_suggestions
      : fallback.thumbnail_suggestions;

    const scripts = (aiJson.scripts && typeof (aiJson.scripts as any).short_script === 'string')
      ? aiJson.scripts
      : fallback.scripts;

    const aiKeywords = Array.isArray(aiJson.viral_keywords) ? aiJson.viral_keywords as string[] : [];
    const viral_keywords = Array.from(new Set([...aiKeywords, ...fallback.viral_keywords])).slice(0, 80);

    const aiHashtags = Array.isArray(aiJson.hashtags) ? aiJson.hashtags as string[] : [];
    const hashtags = Array.from(new Set([...aiHashtags, ...fallback.hashtags])).slice(0, 30);

    const best_posting_time = (aiJson.best_posting_time && typeof aiJson.best_posting_time === 'object')
      ? aiJson.best_posting_time
      : fallback.best_posting_time;

    const competitor_insight = (aiJson.competitor_insight && typeof aiJson.competitor_insight === 'object')
      ? aiJson.competitor_insight
      : fallback.competitor_insight;

    const seo_score_estimate = (typeof aiJson.seo_score_estimate === 'string' && aiJson.seo_score_estimate)
      ? aiJson.seo_score_estimate
      : fallback.seo_score_estimate;

    const viral_probability = (typeof aiJson.viral_probability === 'string' && aiJson.viral_probability)
      ? aiJson.viral_probability
      : fallback.viral_probability;

    const result = {
      session_id: sessionId,
      trending_topics: mergedTrendingTopics,
      viral_hooks,
      optimized_titles,
      ai_descriptions,
      thumbnail_suggestions,
      scripts,
      viral_keywords,
      hashtags,
      best_posting_time,
      competitor_insight,
      api_status: {
        primary: primaryApiStatus,
        secondary: secondaryApiStatus,
        fallback_mode: fallbackMode,
      },
      seo_score_estimate,
      viral_probability,
      learning_insights: {
        top_performing_pattern: learningInsightsResult.top_performing_pattern,
        recommended_strategy: learningInsightsResult.recommended_strategy,
        confidence_score: learningInsightsResult.confidence_score,
        personalized: learningInsightsResult.personalized,
        data_points_used: learningInsightsResult.data_points_used,
        top_hook_styles: learningInsightsResult.top_hook_styles,
        top_keywords: learningInsightsResult.top_keywords,
        learning_notes: learningInsightsResult.learning_notes,
      },
      meta: {
        topic,
        niche,
        platform,
        region,
        language,
        generated_at: new Date().toISOString(),
        trend_api: trendApiStatus,
      },
    };

    // ── 4. Save to DB for Usage Tracking & Analytics  ────────────────────────
    try {
      await connectDB();
      const video = new Video({
        userId: user.id,
        title: `Ultra AI Strategy: ${topic}`,
        description: `Viral strategy for ${topic} on ${platform}.`,
        videoUrl: `https://vidyt.ai/strategy/${sessionId}`,
        thumbnailUrl: (thumbnail_suggestions[0] as any)?.url || '',
        platform: platform === 'shorts' ? 'youtube' : platform,
        duration: 60,
        hashtags: hashtags.slice(0, 5).map(h => h.replace('#', '')),
        uploadedAt: new Date(),
      });
      await video.save();

      const analysis = new Analysis({
        videoId: video._id,
        viralProbability: parseInt(viral_probability) || 70,
        hookScore: 80,
        thumbnailScore: 80,
        titleScore: 80,
        confidenceLevel: 85,
        titleAnalysis: {
          optimizedTitles: optimized_titles,
          keywords: viral_keywords.slice(0, 5),
        },
        hashtags: hashtags.map(h => h.replace('#', '')),
      });
      await analysis.save();

      video.analysisId = analysis._id;
      await video.save();

      // Update manual counters too
      const dbUser = await User.findById(user.id);
      if (dbUser) {
        if (!dbUser.usageStats) dbUser.usageStats = { videosAnalyzed: 0, analysesThisMonth: 0, competitorsTracked: 0, hashtagsGenerated: 0 };
        dbUser.usageStats.analysesThisMonth = (dbUser.usageStats.analysesThisMonth || 0) + 1;
        dbUser.usageStats.videosAnalyzed = (dbUser.usageStats.videosAnalyzed || 0) + 1;
        await dbUser.save();
      }
    } catch (saveError) {
      console.error('Ultra AI DB Save Error:', saveError);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Ultra intelligence error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
