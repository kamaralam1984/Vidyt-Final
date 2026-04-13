export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import { cutSegment } from '@/lib/videoShorts';
import { downloadYouTubeToFile } from '@/services/youtube';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const QUALITY_MAP: Record<string, string> = {
  '720p': '1280:720',
  '1080p': '1920:1080',
  '4k': '3840:2160',
};

export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'ai_shorts_clipping');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  let tmpInput: string | null = null;
  let tmpOutput: string | null = null;
  const tmpFiles: string[] = [];

  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const youtubeUrl = (formData.get('youtubeUrl') as string)?.trim() || '';
    const startTime = parseFloat(String(formData.get('startTime') ?? ''));
    const endTime = parseFloat(String(formData.get('endTime') ?? ''));
    const aspectRatio = ((formData.get('aspectRatio') as string) || '9:16') as '16:9' | '9:16';

    // Editing params
    const quality = (formData.get('quality') as string) || '1080p';
    const overlayText = (formData.get('overlayText') as string) || '';
    const textPosition = (formData.get('textPosition') as string) || 'bottom';
    const textColor = (formData.get('textColor') as string) || '#FFFFFF';
    const musicFile = formData.get('musicFile') as File | null;
    const musicVolume = parseInt(String(formData.get('musicVolume') ?? '50'));
    const voiceoverFile = formData.get('voiceoverFile') as File | null;
    const overlayImage = formData.get('overlayImage') as File | null;
    const imagePosition = (formData.get('imagePosition') as string) || 'bottom-right';
    const colorFilter = (formData.get('colorFilter') as string) || 'none';
    const brightness = parseInt(String(formData.get('brightness') ?? '100'));
    const contrast = parseInt(String(formData.get('contrast') ?? '100'));

    if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
      return NextResponse.json({ error: 'Valid startTime and endTime required' }, { status: 400 });
    }

    // Get input video
    if (file && file.size > 0) {
      const ext = path.extname(file.name) || '.mp4';
      tmpInput = path.join(os.tmpdir(), `cut-in-${Date.now()}${ext}`);
      await fs.writeFile(tmpInput, new Uint8Array(await file.arrayBuffer()));
      tmpFiles.push(tmpInput);
    } else if (youtubeUrl && (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be'))) {
      tmpInput = path.join(os.tmpdir(), `cut-yt-${Date.now()}.mp4`);
      await downloadYouTubeToFile(youtubeUrl, tmpInput);
      tmpFiles.push(tmpInput);
    } else {
      return NextResponse.json({ error: 'Video file or YouTube link required' }, { status: 400 });
    }

    // Save music/voiceover/image files if provided
    let musicPath: string | undefined;
    let voiceoverPath: string | undefined;
    let imagePath: string | undefined;

    if (musicFile && musicFile.size > 0) {
      musicPath = path.join(os.tmpdir(), `music-${Date.now()}${path.extname(musicFile.name) || '.mp3'}`);
      await fs.writeFile(musicPath, new Uint8Array(await musicFile.arrayBuffer()));
      tmpFiles.push(musicPath);
    }
    if (voiceoverFile && voiceoverFile.size > 0) {
      voiceoverPath = path.join(os.tmpdir(), `voice-${Date.now()}${path.extname(voiceoverFile.name) || '.mp3'}`);
      await fs.writeFile(voiceoverPath, new Uint8Array(await voiceoverFile.arrayBuffer()));
      tmpFiles.push(voiceoverPath);
    }
    if (overlayImage && overlayImage.size > 0) {
      imagePath = path.join(os.tmpdir(), `img-${Date.now()}${path.extname(overlayImage.name) || '.png'}`);
      await fs.writeFile(imagePath, new Uint8Array(await overlayImage.arrayBuffer()));
      tmpFiles.push(imagePath);
    }

    // Build FFmpeg filter chain
    tmpOutput = path.join(os.tmpdir(), `cut-out-${Date.now()}.mp4`);
    tmpFiles.push(tmpOutput);

    // Use enhanced cut with editing params
    await cutSegmentWithEditing(tmpInput, startTime, endTime, tmpOutput, {
      aspectRatio,
      quality: QUALITY_MAP[quality] || QUALITY_MAP['1080p'],
      overlayText: overlayText || undefined,
      textPosition,
      textColor,
      musicPath,
      musicVolume,
      voiceoverPath,
      imagePath,
      imagePosition,
      colorFilter,
      brightness,
      contrast,
    });

    const clipBuffer = await fs.readFile(tmpOutput);

    // Cleanup all temp files
    for (const f of tmpFiles) {
      await fs.unlink(f).catch(() => {});
    }

    const filename = `short-${quality}-${startTime.toFixed(0)}s-${endTime.toFixed(0)}s.mp4`;
    return new NextResponse(clipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(clipBuffer.length),
      },
    });
  } catch (e: unknown) {
    for (const f of tmpFiles) { await fs.unlink(f).catch(() => {}); }
    const msg = e instanceof Error ? e.message : 'Cut failed. Make sure ffmpeg is installed.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Enhanced video cut with text overlay, music, color filter, image overlay
 */
async function cutSegmentWithEditing(
  inputPath: string,
  startTime: number,
  endTime: number,
  outputPath: string,
  options: {
    aspectRatio: '16:9' | '9:16';
    quality: string;
    overlayText?: string;
    textPosition: string;
    textColor: string;
    musicPath?: string;
    musicVolume: number;
    voiceoverPath?: string;
    imagePath?: string;
    imagePosition: string;
    colorFilter: string;
    brightness: number;
    contrast: number;
  }
) {
  // Try enhanced FFmpeg first, fall back to basic cut
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const duration = endTime - startTime;
    const args: string[] = ['-y', '-ss', String(startTime), '-t', String(duration), '-i', inputPath];
    const filterParts: string[] = [];
    let inputCount = 1;

    // Add music input
    if (options.musicPath) {
      args.push('-i', options.musicPath);
      inputCount++;
    }

    // Add voiceover input
    if (options.voiceoverPath) {
      args.push('-i', options.voiceoverPath);
      inputCount++;
    }

    // Add image overlay input
    if (options.imagePath) {
      args.push('-i', options.imagePath);
      inputCount++;
    }

    // Video filters
    const vFilters: string[] = [];

    // Scale to quality
    const [w, h] = options.quality.split(':').map(Number);
    if (options.aspectRatio === '9:16') {
      vFilters.push(`scale=${h}:${w}:force_original_aspect_ratio=decrease,pad=${h}:${w}:(ow-iw)/2:(oh-ih)/2:black`);
    } else {
      vFilters.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`);
    }

    // Color filter
    if (options.colorFilter !== 'none') {
      switch (options.colorFilter) {
        case 'warm': vFilters.push('colorbalance=rs=0.1:gs=-0.05:bs=-0.1'); break;
        case 'cool': vFilters.push('colorbalance=rs=-0.1:gs=0.05:bs=0.1'); break;
        case 'vintage': vFilters.push('curves=vintage'); break;
        case 'vivid': vFilters.push('eq=saturation=1.5'); break;
        case 'bw': vFilters.push('hue=s=0'); break;
        case 'cinematic': vFilters.push('colorbalance=rs=0.05:gs=-0.03:bs=0.08,eq=contrast=1.1:brightness=0.02'); break;
      }
    }

    // Brightness/Contrast
    if (options.brightness !== 100 || options.contrast !== 100) {
      const b = (options.brightness - 100) / 100;
      const c = options.contrast / 100;
      vFilters.push(`eq=brightness=${b}:contrast=${c}`);
    }

    // Text overlay
    if (options.overlayText) {
      const escaped = options.overlayText.replace(/'/g, "\\'").replace(/:/g, '\\:');
      const yPos = options.textPosition === 'top' ? '50' : options.textPosition === 'center' ? '(h-th)/2' : 'h-th-50';
      vFilters.push(`drawtext=text='${escaped}':fontsize=48:fontcolor=${options.textColor}:borderw=3:bordercolor=black:x=(w-tw)/2:y=${yPos}:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`);
    }

    // Build filter complex
    let filterComplex = '';
    if (vFilters.length > 0) {
      filterComplex = `[0:v]${vFilters.join(',')}[vout]`;
    }

    // Image overlay
    if (options.imagePath) {
      const imgIdx = inputCount - 1;
      const pos = options.imagePosition;
      const ox = pos.includes('right') ? 'W-w-20' : pos === 'center' ? '(W-w)/2' : '20';
      const oy = pos.includes('bottom') ? 'H-h-20' : pos === 'center' ? '(H-h)/2' : '20';
      const prevOut = filterComplex ? 'vout' : '0:v';
      filterComplex = filterComplex
        ? `${filterComplex};[${imgIdx}:v]scale=100:-1[logo];[${prevOut}][logo]overlay=${ox}:${oy}[vfinal]`
        : `[${imgIdx}:v]scale=100:-1[logo];[0:v][logo]overlay=${ox}:${oy}[vfinal]`;
    }

    const finalVideoLabel = options.imagePath ? 'vfinal' : (vFilters.length > 0 ? 'vout' : null);

    // Audio mixing
    let audioFilter = '';
    if (options.musicPath || options.voiceoverPath) {
      const parts = ['[0:a]'];
      let idx = 1;
      if (options.musicPath) { parts.push(`[${idx}:a]`); idx++; }
      if (options.voiceoverPath) { parts.push(`[${idx}:a]`); idx++; }
      audioFilter = `${parts.join('')}amix=inputs=${parts.length}:duration=first[aout]`;
    }

    // Build final args
    if (filterComplex || audioFilter) {
      const fullFilter = [filterComplex, audioFilter].filter(Boolean).join(';');
      args.push('-filter_complex', fullFilter);
      if (finalVideoLabel) args.push('-map', `[${finalVideoLabel}]`);
      if (audioFilter) args.push('-map', '[aout]');
      else if (finalVideoLabel) args.push('-map', '0:a?');
    }

    args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputPath);

    await execFileAsync('ffmpeg', args, { timeout: 120000 });
  } catch (ffmpegErr) {
    console.warn('[ShortsCreator] Enhanced FFmpeg failed, falling back to basic cut:', ffmpegErr);
    // Fallback to basic cut
    await cutSegment(inputPath, startTime, endTime, outputPath, options.aspectRatio);
  }
}
