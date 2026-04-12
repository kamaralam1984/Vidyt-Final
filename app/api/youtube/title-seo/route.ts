export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { analyzeTitle } from '@/services/titleOptimizer';
import { getTrendingScore, getTrendingTopics } from '@/services/trendingEngine';
import { generateHashtags } from '@/services/hashtagGenerator';
import { getHashtagCount } from '@/lib/planLimits';
import {
  buildUploadSeoPack,
  clampYoutubeTitle,
  commaSeparatedYoutubeTags,
  enhanceForRankMode,
  estimateSeoRankScore,
  modeledHookStrengthForTitleSeo,
  modeledViralFitForTitleSeo,
} from '@/lib/buildUploadSeo';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = clampYoutubeTitle(String(body.title ?? '').trim());
    const rank1Mode = Boolean(body.rank1Mode);
    if (title.length < 2) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const dbUser = await User.findById(auth.id);
    const planId = dbUser?.subscription || 'free';

    const titleAnalysis = analyzeTitle(title, { maxSuggestions: 5 });
    const trendingScore = await getTrendingScore(titleAnalysis.keywords);
    const trendingTopics = await getTrendingTopics(titleAnalysis.keywords);
    const hashtags = await generateHashtags(titleAnalysis, '', [], getHashtagCount(planId));

    const viralProbability = modeledViralFitForTitleSeo(titleAnalysis.score, trendingScore);
    const hookScore = modeledHookStrengthForTitleSeo(titleAnalysis.score);

    const basePack = buildUploadSeoPack({
      title,
      keywords: titleAnalysis.keywords,
      hookScore,
      viralProbability,
      rawHashtags: hashtags.map((h) => h.replace(/^#/, '')),
      trendingTopics,
    });
    const seoPack = rank1Mode ? enhanceForRankMode(basePack) : basePack;

    const tags = commaSeparatedYoutubeTags(seoPack, rank1Mode ? 40 : 30);
    const keywordList = Array.from(
      new Set(
        [
          ...seoPack.trendingTags.map((t) => t.keyword),
          ...titleAnalysis.keywords,
          ...seoPack.hashtags,
          title,
        ]
          .map((x) => String(x || '').trim().replace(/^#/, '').toLowerCase())
          .filter(Boolean),
      ),
    ).slice(0, 10);
    const hashtagList = Array.from(
      new Set(
        [
          ...seoPack.hashtags,
          ...keywordList.slice(0, 5),
          'viral',
          'youtube',
          'shorts',
        ]
          .map((x) => String(x || '').trim().replace(/^#/, '').toLowerCase())
          .filter(Boolean)
          .map((x) => `#${x}`),
      ),
    ).slice(0, 10);
    const hashtagsText = hashtagList.join(' ');
    const seoRankScoreBase = estimateSeoRankScore(titleAnalysis.score, trendingScore, viralProbability);
    const seoRankScore = rank1Mode ? Math.min(99, Math.max(90, seoRankScoreBase + 4)) : seoRankScoreBase;

    return NextResponse.json({
      description: seoPack.description,
      tags,
      keywords: keywordList,
      hashtags: hashtagList,
      hashtagsText,
      seoRankScore,
      rank1Mode,
      recommendedTitle: titleAnalysis.optimizedTitles?.[0] || title,
      viralProbability,
      hookScore,
    });
  } catch (e) {
    console.error('title-seo:', e);
    return NextResponse.json({ error: 'Failed to generate SEO' }, { status: 500 });
  }
}
