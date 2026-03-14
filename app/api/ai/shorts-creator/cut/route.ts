import { NextRequest, NextResponse } from 'next/server';
import { requireAIStudioAccess } from '@/lib/aiStudioAccess';
import { cutSegment } from '@/lib/videoShorts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  const access = await requireAIStudioAccess(request);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  let tmpInput: string | null = null;
  let tmpOutput: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const startTime = parseFloat(String(formData.get('startTime') ?? ''));
    const endTime = parseFloat(String(formData.get('endTime') ?? ''));

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Video file required' }, { status: 400 });
    }
    if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
      return NextResponse.json({ error: 'Valid startTime and endTime required' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.mp4';
    tmpInput = path.join(os.tmpdir(), `cut-in-${Date.now()}${ext}`);
    tmpOutput = path.join(os.tmpdir(), `cut-out-${Date.now()}.mp4`);

    const buf = await file.arrayBuffer();
    await fs.writeFile(tmpInput, new Uint8Array(buf));
    await cutSegment(tmpInput, startTime, endTime, tmpOutput);

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
  } catch (e: any) {
    if (tmpInput) await fs.unlink(tmpInput).catch(() => {});
    if (tmpOutput) await fs.unlink(tmpOutput).catch(() => {});
    return NextResponse.json(
      { error: e.message || 'Cut failed. Is ffmpeg installed?' },
      { status: 500 }
    );
  }
}
