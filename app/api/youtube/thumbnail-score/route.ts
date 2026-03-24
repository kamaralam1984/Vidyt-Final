export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { analyzeThumbnail } from '@/services/thumbnailAnalyzer';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('thumbnail') as File | null;
    const dataUrl = (formData.get('imageDataUrl') as string) || '';

    let url = dataUrl;
    if (!url && file && file.size > 0) {
      const buf = await file.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');
      const mime = file.type || 'image/jpeg';
      url = `data:${mime};base64,${base64}`;
    }

    if (!url) {
      return NextResponse.json({
        score: 70,
        faceDetection: 0,
        colorContrast: 70,
        textReadability: 70,
        message: 'No thumbnail provided',
      });
    }

    let result;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      result = await analyzeThumbnail(url);
    } else {
      result = {
        score: 72,
        facesDetected: 0,
        colorContrast: 75,
        textReadability: 70,
        suggestions: [
          'Add bold text (3–5 words) for better CTR.',
          'Use high contrast (e.g. white text on dark background).',
          'Include a face or emotion for higher engagement.',
          'Keep important elements in the center (safe zone).',
        ],
      };
    }

    const title = (formData.get('title') as string)?.trim() || '';
    const keyword = (formData.get('keyword') as string)?.trim() || '';
    const suggestions = [...(result.suggestions || [])];
    if (title || keyword) {
      const phrase = title ? title.split(/\s+/).slice(0, 4).join(' ') : keyword.split(/[,;]/)[0]?.trim() || keyword;
      if (phrase) suggestions.push(`Thumbnail ke hisaab se: Title/main keyword use karein — jaise "${phrase.slice(0, 40)}${phrase.length > 40 ? '...' : ''}" — taaki CTR better ho.`);
    }

    return NextResponse.json({
      score: Math.round(result.score),
      faceDetection: result.facesDetected ?? 0,
      colorContrast: Math.round(result.colorContrast ?? 70),
      textReadability: Math.round(result.textReadability ?? 70),
      suggestions,
    });
  } catch (e) {
    console.error('Thumbnail analysis error:', e);
    return NextResponse.json({
      score: 70,
      faceDetection: 0,
      colorContrast: 70,
      textReadability: 70,
      message: 'Analysis failed',
    });
  }
}
