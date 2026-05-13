export const dynamic = 'force-dynamic';
export const maxDuration = 45;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

const NICHE_BENCHMARKS: Record<string, string> = {
  finance: '4–6%', business: '4–6%', investing: '4–6%',
  gaming: '3–5%', games: '3–5%',
  tech: '4–7%', technology: '4–7%', review: '4–7%',
  education: '2–4%', tutorial: '2–4%', howto: '2–4%',
  fitness: '3–5%', health: '3–5%',
  cooking: '2–4%', food: '2–4%',
  entertainment: '4–8%', comedy: '4–8%',
  default: '3–6%',
};

function getNicheBenchmark(niche: string): string {
  if (!niche) return NICHE_BENCHMARKS.default;
  const key = niche.toLowerCase();
  for (const [k, v] of Object.entries(NICHE_BENCHMARKS)) {
    if (key.includes(k)) return v;
  }
  return NICHE_BENCHMARKS.default;
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { thumbnailDescription?: string; videoTitle?: string; niche?: string; imageUrl?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { thumbnailDescription, videoTitle, niche, imageUrl } = body;
  if (!thumbnailDescription?.trim() && !videoTitle?.trim() && !imageUrl?.trim()) {
    return NextResponse.json({ error: 'Provide a thumbnail URL, description, or video title.' }, { status: 400 });
  }

  const nicheBenchmark = `${getNicheBenchmark(niche || '')} for ${niche || 'General'} niche`;

  const prompt = `You are a world-class YouTube thumbnail CTR expert who has analyzed 100,000+ thumbnails.

Video Title: ${videoTitle || 'Not provided'}
Thumbnail Description/URL: ${imageUrl || thumbnailDescription || 'Not provided'}
Niche: ${niche || 'General YouTube'}
Niche CTR Benchmark: ${nicheBenchmark}

Analyze this thumbnail and return a JSON object with EXACTLY this structure:
{
  "overallScore": <number 0-100>,
  "ctrPrediction": "<e.g. 5.2%>",
  "nicheBenchmark": "${nicheBenchmark}",
  "titleThumbnailSynergy": <number 0-100, how well thumbnail matches the video title>,
  "scores": {
    "readability": <number 0-100>,
    "emotionalImpact": <number 0-100>,
    "colorContrast": <number 0-100>,
    "clutterScore": <number 0-100>,
    "curiosityGap": <number 0-100>,
    "faceVisibility": <number 0-100, 0 if no face>,
    "textToImageRatio": <number 0-100>,
    "brandConsistency": <number 0-100>
  },
  "issues": [
    { "area": "Text Readability|Color Contrast|Emotional Impact|Clutter|Face/Expression|Curiosity Gap|Brand Consistency", "severity": "high|medium|low", "description": "specific issue with actionable detail" }
  ],
  "strengths": [
    "specific strength with detail"
  ],
  "suggestions": [
    "Specific high-impact improvement 1",
    "Specific high-impact improvement 2",
    "Specific high-impact improvement 3"
  ],
  "improvedVersionIdeas": [
    "Concept 1: describe exact colors, text overlay, face expression, background, layout",
    "Concept 2: alternative approach"
  ],
  "competitorBenchmark": "How this thumbnail compares to top 10% of performers in ${niche || 'this'} niche"
}

Be specific and honest. Reference the niche CTR benchmark in your analysis.`;

  const result = await routeAI({ prompt, maxTokens: 1800, temperature: 0.5 });
  if (!result.text) return NextResponse.json({ error: 'AI analysis failed. Please retry.' }, { status: 500 });

  try {
    const stripped = result.text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const data = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Non-object response');
    return NextResponse.json({ data: { ...data, imageUrl: imageUrl || null }, provider: result.provider });
  } catch (e: any) {
    console.error('[thumbnail-analyzer] parse error:', e?.message, '| snippet:', result.text?.slice(0, 300));
    return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 });
  }
}
