/**
 * Video processing for Shorts: scene detection (viral/key moments) and segment cut.
 * Uses ffmpeg from @ffmpeg-installer/ffmpeg.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

let ffmpegPath: string | null = null;
function getFfmpegPath(): string {
  if (ffmpegPath) return ffmpegPath;
  try {
    const p = require('@ffmpeg-installer/ffmpeg').path as string | null;
    ffmpegPath = p;
    return p ?? 'ffmpeg';
  } catch {
    return 'ffmpeg';
  }
}

/**
 * Get video duration in seconds using ffmpeg -i (output is on stderr; parse Duration: HH:MM:SS.ms).
 * ffmpeg -i exits with 1 when no output file is given, so we parse stderr from result or error.
 */
export async function getVideoDuration(inputPath: string): Promise<number> {
  const ff = getFfmpegPath();
  const parseDuration = (str: string): number => {
    const m = /Duration:\s*(\d{1,2}):(\d{2}):(\d{2}\.\d+)/.exec(str);
    if (!m) return 0;
    const hours = parseFloat(m[1]) || 0;
    const minutes = parseFloat(m[2]) || 0;
    const seconds = parseFloat(m[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };
  try {
    const { stderr } = await execAsync(
      `"${ff}" -i "${inputPath}" 2>&1`,
      { maxBuffer: 2 * 1024 * 1024 }
    );
    return parseDuration(stderr || '') || 0;
  } catch (err: unknown) {
    const msg = err && typeof err === 'object' && 'stderr' in err ? String((err as { stderr?: string }).stderr) : '';
    return parseDuration(msg) || 0;
  }
}

/**
 * Detect scene change timestamps (seconds). Returns array of start times for each scene.
 */
export async function getSceneTimes(inputPath: string): Promise<number[]> {
  const ff = getFfmpegPath();
  try {
    const { stderr } = await execAsync(
      `"${ff}" -i "${inputPath}" -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1`,
      { maxBuffer: 2 * 1024 * 1024 }
    );
    const times: number[] = [];
    const re = /pts_time:([\d.]+)/g;
    let m;
    while ((m = re.exec(stderr)) !== null) {
      const t = parseFloat(m[1]);
      if (!isNaN(t)) times.push(t);
    }
    return times;
  } catch (e) {
    return [];
  }
}

export interface ClipSegment {
  startTime: number;
  endTime: number;
}

const MAX_CLIP_DURATION = 60;
const TARGET_CLIPS = 5;

/**
 * From scene times and duration, build up to TARGET_CLIPS segments (viral/key moments).
 */
export function buildClipSegments(sceneTimes: number[], durationSeconds: number): ClipSegment[] {
  const segments: ClipSegment[] = [];
  if (sceneTimes.length >= 2) {
    for (let i = 0; i < sceneTimes.length - 1 && segments.length < TARGET_CLIPS; i++) {
      const start = sceneTimes[i];
      const end = Math.min(sceneTimes[i + 1], start + MAX_CLIP_DURATION);
      if (end - start >= 5) segments.push({ startTime: start, endTime: end });
    }
  }
  if (segments.length >= TARGET_CLIPS) return segments.slice(0, TARGET_CLIPS);
  const step = durationSeconds / TARGET_CLIPS;
  for (let i = 0; i < TARGET_CLIPS; i++) {
    const start = i * step;
    const end = Math.min(start + Math.min(step, MAX_CLIP_DURATION), durationSeconds);
    if (end - start >= 3) segments.push({ startTime: start, endTime: end });
  }
  return segments.slice(0, TARGET_CLIPS);
}

/**
 * Cut one segment from input to output file.
 */
export async function cutSegment(
  inputPath: string,
  startTime: number,
  endTime: number,
  outputPath: string
): Promise<void> {
  const ff = getFfmpegPath();
  const duration = endTime - startTime;
  await execAsync(
    `"${ff}" -y -i "${inputPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`,
    { maxBuffer: 10 * 1024 * 1024 }
  );
}

export async function detectClipsFromVideo(inputPath: string): Promise<ClipSegment[]> {
  const duration = await getVideoDuration(inputPath);
  if (duration <= 0) return [];
  const sceneTimes = await getSceneTimes(inputPath);
  const segments = buildClipSegments(sceneTimes, duration);
  return segments;
}
