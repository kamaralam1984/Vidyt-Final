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

export async function getVideoDuration(inputPath: string): Promise<number> {
  const ff = getFfmpegPath();
  const { stdout } = await execAsync(
    `"${ff}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
    { maxBuffer: 10 * 1024 }
  );
  const d = parseFloat(stdout.trim());
  return isNaN(d) ? 0 : d;
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
