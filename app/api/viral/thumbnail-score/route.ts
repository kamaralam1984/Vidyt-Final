import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { analyzeThumbnail, analyzeThumbnailFromBuffer } from '@/services/thumbnailAnalyzer';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('thumbnail') as File | null;
    const imageUrl = (formData.get('imageUrl') as string)?.trim() || '';

    let result;
    if (file && file.size > 0) {
      const buf = await file.arrayBuffer();
      const buffer = Buffer.from(buf);
      result = await analyzeThumbnailFromBuffer(buffer);
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      result = await analyzeThumbnail(imageUrl);
    } else {
      return NextResponse.json({
        score: 65,
        facePresence: 0,
        emotionIntensity: 50,
        colorContrast: 65,
        textReadability: 65,
        suggestions: ['Upload a thumbnail or provide image URL for real analysis.'],
      });
    }

    const facePresence = result.facesDetected ?? 0;
    const emotionIntensity = result.emotion ? 70 : (facePresence > 0 ? 65 : 45);
    const colorContrast = Math.round(result.colorContrast ?? 70);
    const textReadability = Math.round(result.textReadability ?? 70);
    const score = Math.min(100, Math.max(0, Math.round(result.score ?? 70)));

    return NextResponse.json({
      score,
      facePresence,
      emotionIntensity: Math.min(100, emotionIntensity),
      colorContrast,
      textReadability,
      suggestions: result.suggestions || [],
    });
  } catch (e) {
    console.error('Thumbnail score API error:', e);
    return NextResponse.json({
      score: 65,
      facePresence: 0,
      emotionIntensity: 50,
      colorContrast: 65,
      textReadability: 65,
      suggestions: ['Analysis failed. Try another image.'],
    });
  }
}
