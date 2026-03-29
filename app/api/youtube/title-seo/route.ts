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

    const seoPack = buildUploadSeoPack({
      title,
      keywords: titleAnalysis.keywords,
      hookScore,
      viralProbability,
      rawHashtags: hashtags.map((h) => h.replace(/^#/, '')),
      trendingTopics,
    });

    const tags = commaSeparatedYoutubeTags(seoPack);

    return NextResponse.json({
      description: seoPack.description,
      tags,
      hashtags: seoPack.hashtags,
      viralProbability,
      hookScore,
    });
  } catch (e) {
    console.error('title-seo:', e);
    return NextResponse.json({ error: 'Failed to generate SEO' }, { status: 500 });
  }
}
