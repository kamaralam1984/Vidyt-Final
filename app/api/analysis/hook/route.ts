export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import { getUserFromRequest } from '@/lib/auth';
import { routeVisionAI } from '@/lib/ai-router';
import { analyzeVideoHookReal } from '@/services/ai/videoAnalysis';

/** Parse hook scores from Vision AI JSON response */
function parseVisionHook(text: string, duration: number): { facesDetected: number; motionIntensity: number; sceneChanges: number; brightness: number; score: number } {
  try {
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error('no json');
    const d = JSON.parse(json.replace(/,\s*([}\]])/g, '$1'));
    const faces = Math.min(5, Math.max(0, Number(d.faces ?? d.facesDetected ?? 0)));
    const motion = Math.min(100, Math.max(0, Number(d.motion ?? d.motionIntensity ?? 50)));
    const brightness = Math.min(100, Math.max(0, Number(d.brightness ?? 70)));
    const hasText = d.hasText ?? d.has_text ?? false;
    const emotionScore = Math.min(100, Math.max(0, Number(d.emotionScore ?? d.emotion_score ?? 50)));
    // Score formula: faces(30) + motion(20) + brightness(20) + text(10) + emotion(20)
    const score = Math.min(100, Math.round(
      Math.min(30, faces * 10) +
      (motion / 100) * 20 +
      (brightness >= 50 && brightness <= 90 ? 20 : 10) +
      (hasText ? 10 : 5) +
      (emotionScore / 100) * 20
    ));
    return { facesDetected: faces, motionIntensity: motion, sceneChanges: 1, brightness, score };
  } catch {
    return { facesDetected: 0, motionIntensity: 50, sceneChanges: 0, brightness: 70, score: 50 };
  }
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

    if (analysis.hookScore > 0) {
      return NextResponse.json({ success: true, analysis: analysis.hookAnalysis, score: analysis.hookScore });
    }

    const thumbnailUrl: string = video.thumbnailUrl || '';
    const duration: number = video.duration || 60;
    let hookAnalysis: { facesDetected: number; motionIntensity: number; sceneChanges: number; brightness: number; score: number };
    let method = 'backend';

    // ── Tier 1: Vision AI (OpenAI GPT-4o-mini or Gemini) ─────────────────
    if (thumbnailUrl && !thumbnailUrl.includes('placeholder')) {
      const prompt = `Analyze this YouTube thumbnail and return ONLY valid JSON with these fields:
{
  "faces": <number 0-5, count of visible human faces>,
  "motion": <number 0-100, how dynamic/energetic the thumbnail looks>,
  "brightness": <number 0-100, overall brightness>,
  "hasText": <true/false, is there visible text overlay>,
  "emotionScore": <number 0-100, how strong the emotion/expression is>
}
No explanation, just JSON.`;

      try {
        const visionResult = await routeVisionAI(thumbnailUrl, prompt, `hook:${videoId}`);
        if (visionResult) {
          hookAnalysis = parseVisionHook(visionResult.text, duration);
          method = visionResult.provider;
          console.log(`[Hook] Vision AI (${method}) score: ${hookAnalysis.score}`);
        }
      } catch (e) {
        console.warn('[Hook] Vision AI failed, falling back:', e);
      }
    }

    // ── Tier 2: Sharp-based real image analysis ───────────────────────────
    if (!hookAnalysis!) {
      try {
        hookAnalysis = await analyzeVideoHookReal(video.videoUrl, thumbnailUrl, undefined, video.platform as any, duration);
        method = 'sharp-vision';
        console.log(`[Hook] Sharp analysis score: ${hookAnalysis.score}`);
      } catch (e) {
        console.warn('[Hook] Sharp analysis failed:', e);
      }
    }

    // ── Tier 3: Deterministic backend formula ─────────────────────────────
    if (!hookAnalysis!) {
      // Score based on platform norms and video duration
      const durationScore = duration <= 60 ? 75 : duration <= 180 ? 65 : duration <= 600 ? 55 : 45;
      const platformBonus = video.platform === 'youtube' ? 5 : video.platform === 'instagram' ? 10 : 0;
      const score = Math.min(100, durationScore + platformBonus);
      hookAnalysis = { facesDetected: 0, motionIntensity: score, sceneChanges: 1, brightness: 70, score };
      method = 'formula';
      console.log(`[Hook] Formula fallback score: ${score}`);
    }

    analysis.hookAnalysis = hookAnalysis;
    analysis.hookScore = hookAnalysis.score;
    await analysis.save();

    return NextResponse.json({
      success: true,
      analysis: analysis.hookAnalysis,
      score: analysis.hookScore,
      method,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
