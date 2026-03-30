export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import { cutSegment } from '@/lib/videoShorts';
import { downloadYouTubeToFile } from '@/services/youtube';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'ai_shorts_clipping');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  let tmpInput: string | null = null;
  let tmpOutput: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const youtubeUrl = (formData.get('youtubeUrl') as string)?.trim() || '';
    const startTime = parseFloat(String(formData.get('startTime') ?? ''));
    const endTime = parseFloat(String(formData.get('endTime') ?? ''));
    const aspectRatio = ((formData.get('aspectRatio') as string) || '9:16') as '16:9' | '9:16';

    if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
      return NextResponse.json({ error: 'Valid startTime and endTime required' }, { status: 400 });
    }

    if (file && file.size > 0) {
      const ext = path.extname(file.name) || '.mp4';
      tmpInput = path.join(os.tmpdir(), `cut-in-${Date.now()}${ext}`);
      const buf = await file.arrayBuffer();
      await fs.writeFile(tmpInput, new Uint8Array(buf));
    } else if (youtubeUrl && (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be'))) {
      tmpInput = path.join(os.tmpdir(), `cut-yt-${Date.now()}.mp4`);
      await downloadYouTubeToFile(youtubeUrl, tmpInput);
    } else {
      return NextResponse.json({ error: 'Video file ya YouTube link required' }, { status: 400 });
    }

    tmpOutput = path.join(os.tmpdir(), `cut-out-${Date.now()}.mp4`);
    await cutSegment(tmpInput, startTime, endTime, tmpOutput, aspectRatio);

    const clipBuffer = await fs.readFile(tmpOutput);
    await fs.unlink(tmpInput).catch(() => {});
    await fs.unlink(tmpOutput).catch(() => {});
    tmpInput = null;
    tmpOutput = null;

    const filename = `short-clip-${startTime.toFixed(0)}s-${endTime.toFixed(0)}s.mp4`;
    return new NextResponse(clipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(clipBuffer.length),
      },
    });
  } catch (e: unknown) {
    if (tmpInput) await fs.unlink(tmpInput).catch(() => {});
    if (tmpOutput) await fs.unlink(tmpOutput).catch(() => {});
    const msg = e instanceof Error ? e.message : 'Cut failed. Is ffmpeg installed?';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
