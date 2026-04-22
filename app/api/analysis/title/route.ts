export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import { getUserFromRequest } from '@/lib/auth';
import { analyzeTitle } from '@/services/titleOptimizer';
import { getTitleSuggestionsCount } from '@/lib/planLimits';
import { routeAI } from '@/lib/ai-router';
import User from '@/models/User';

/** Use AI to generate real optimized title suggestions */
async function generateAITitles(originalTitle: string, keywords: string[], maxSuggestions: number): Promise<string[]> {
  const keywordHint = keywords.length > 0 ? `Main keywords: ${keywords.slice(0, 5).join(', ')}.` : '';
  const prompt = `You are a YouTube SEO expert. Generate ${maxSuggestions} optimized title variations for this YouTube video:

Original title: "${originalTitle}"
${keywordHint}

Rules:
- Each title must be 40–70 characters
- Use power words, numbers, or questions where natural
- Keep the core topic but make it more clickable
- Do NOT start multiple titles with the same word
- Titles must reflect the actual video content

Return ONLY a JSON array of strings. Example: ["Title 1", "Title 2"]
No explanation, no markdown, just the JSON array.`;

  try {
    const result = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `titles:${Buffer.from(originalTitle).toString('base64').slice(0, 32)}`,
      cacheTtlSec: 3600,
    });

    // Parse array from response
    const text = result.text || '';
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const arr = JSON.parse(match[0].replace(/,\s*([}\]])/g, '$1'));
      if (Array.isArray(arr) && arr.length > 0) {
        return arr
          .filter((t: any) => typeof t === 'string' && t.trim().length > 0)
          .map((t: string) => t.trim())
          .slice(0, maxSuggestions);
      }
    }
  } catch (e) {
    console.warn('[TitleAI] Failed, using template fallback:', e);
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId, analysisId } = await request.json();
    if (!videoId || !analysisId) return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });

    const video = await Video.findOne({ _id: videoId, userId: authUser.id });
    const analysis = await Analysis.findOne({ _id: analysisId, videoId });
    if (!video || !analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (analysis.titleScore > 0) {
      return NextResponse.json({ success: true, analysis: analysis.titleAnalysis, score: analysis.titleScore });
    }

    const user = await User.findById(authUser.id);
    const limit = getTitleSuggestionsCount(user?.subscription || 'free');

    // ── Tier 1+2+3: NLP analysis (always runs — real) ─────────────────────
    let titleAnalysis;
    try {
      titleAnalysis = analyzeTitle(video.title, { maxSuggestions: limit });
    } catch {
      titleAnalysis = {
        keywords: video.title.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5),
        emotionalTriggers: [],
        length: video.title.length,
        clickPotential: 50,
        optimizedTitles: [],
        score: 50,
      };
    }

    // ── Tier 1: AI-generated title suggestions (OpenAI → Gemini → Groq → ...) ──
    const aiTitles = await generateAITitles(video.title, titleAnalysis.keywords, limit);
    if (aiTitles.length > 0) {
      titleAnalysis.optimizedTitles = aiTitles;
      console.log(`[Title] AI generated ${aiTitles.length} titles`);
    } else {
      // ── Tier 3: Template fallback (already in analyzeTitle) ───────────────
      console.log(`[Title] Using template-based ${titleAnalysis.optimizedTitles.length} titles`);
    }

    analysis.titleAnalysis = titleAnalysis;
    analysis.titleScore = titleAnalysis.score;
    await analysis.save();

    return NextResponse.json({
      success: true,
      analysis: analysis.titleAnalysis,
      score: analysis.titleScore,
      aiGenerated: aiTitles.length > 0,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
