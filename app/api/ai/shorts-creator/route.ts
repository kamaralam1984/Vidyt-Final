import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import AIShorts from '@/models/AIShorts';
import { generateShortsMock, generateClipsFromSegments } from '@/services/ai/aiStudio';
import { detectClipsFromVideo } from '@/lib/videoShorts';
import { downloadYouTubeToFile } from '@/services/youtube';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';



export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'ai_shorts_clipping');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  let tmpPath: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const youtubeUrl = (formData.get('youtubeUrl') as string)?.trim() || '';
    const title = (formData.get('title') as string) || 'My Video';

    if (youtubeUrl && (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be'))) {
      tmpPath = path.join(os.tmpdir(), `shorts-yt-${Date.now()}.mp4`);
      try {
        await downloadYouTubeToFile(youtubeUrl, tmpPath);
      } catch (dlErr: unknown) {
        const msg = dlErr instanceof Error ? dlErr.message : 'YouTube download failed';
        return NextResponse.json({ error: `Video link se download fail: ${msg}. Try uploading file instead.` }, { status: 400 });
      }
      const segments = await detectClipsFromVideo(tmpPath);
      await fs.unlink(tmpPath).catch(() => { });
      tmpPath = null;
      if (segments.length > 0) {
        const clips = generateClipsFromSegments(segments, title);
        await connectDB();
        await AIShorts.create({
          userId: access.userId,
          originalTitle: title,
          clips,
        });
        return NextResponse.json({
          clips,
          youtubeUrl,
          message: 'Video link se clips banaye gaye (viral/key moments).',
        });
      }
      return NextResponse.json({
        clips: generateClipsFromSegments([{ startTime: 0, endTime: 60 }], title),
        youtubeUrl,
        message: 'Scene detect nahi hue; default clip use kiya.',
      });
    }

    if (file && file.size > 0) {
      const ext = path.extname(file.name) || '.mp4';
      tmpPath = path.join(os.tmpdir(), `shorts-${Date.now()}${ext}`);
      const buf = await file.arrayBuffer();
      await fs.writeFile(tmpPath, new Uint8Array(buf));
      const segments = await detectClipsFromVideo(tmpPath);
      await fs.unlink(tmpPath).catch(() => { });
      tmpPath = null;
      if (segments.length > 0) {
        const clips = generateClipsFromSegments(segments, title);
        await connectDB();
        await AIShorts.create({
          userId: access.userId,
          originalTitle: title,
          clips,
        });
        return NextResponse.json({
          clips,
          message: 'Video analysed. Clips cut from viral/key moments (scene changes).',
        });
      }
    }

    const result = generateShortsMock();
    await connectDB();
    await AIShorts.create({
      userId: access.userId,
      originalTitle: title,
      clips: result.clips,
    });
    return NextResponse.json({
      clips: result.clips,
      message: file ? 'Video uploaded but scene detection returned no segments; demo clips used.' : 'Demo clips generated.',
    });
  } catch (e: unknown) {
    if (tmpPath) await fs.unlink(tmpPath).catch(() => { });
    const msg = e instanceof Error ? e.message : 'Generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
