export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';

function detectDropPoints(script: string): string[] {
  if (!script?.trim()) return ['00:12', '00:45', '01:30'];
  const lines = script.trim().split(/\n+/).filter(Boolean);
  const points: string[] = [];
  let sec = 12;
  const step = 25 + (lines.length % 20);
  for (let i = 0; i < 3; i++) {
    sec += step * (i + 1);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    points.push(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  }
  return points.slice(0, 3);
}

function predictRetention(script: string, title?: string): number {
  const t = script?.trim() || '';
  const titleLen = (title || '').trim().length;
  if (!t) {
    let s = 48;
    if (titleLen > 40) s += 5;
    if (titleLen > 60) s += 2;
    return Math.min(58, s);
  }
  const hasHook = /^(hey|so|welcome|today|in this video)/im.test(t) || t.length < 200;
  const hasStructure = /\n\n|first|second|finally|step \d|#/im.test(t);
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  let s = 50;
  if (hasHook) s += 8;
  if (hasStructure) s += 10;
  if (wordCount > 150) s += 5;
  if (wordCount > 300) s += 5;
  return Math.min(95, Math.round(s));
}

export async function POST(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'viral_optimizer');
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const script = (body.script as string)?.trim() || '';

    const predictedRetention = predictRetention(script);
    const dropPoints = detectDropPoints(script);

    const suggestions: string[] = [
      'Add a stronger hook in the first 3–5 seconds.',
      'Increase visual or scene transitions every 30–60 seconds.',
      'Add storytelling or “what’s next” teases to hold attention.',
    ];
    if (!script) suggestions.unshift('Add a video script or outline to get retention and drop-point suggestions.');

    return NextResponse.json({
      predictedRetention: Math.min(99, Math.max(10, predictedRetention)),
      dropPoints,
      suggestions,
      fromScript: script.length > 0,
    });
  } catch (e) {
    console.error('Retention API error:', e);
    return NextResponse.json(
      { predictedRetention: 50, dropPoints: ['00:12', '00:45', '01:30'], suggestions: ['Analysis failed.'] },
      { status: 500 }
    );
  }
}
