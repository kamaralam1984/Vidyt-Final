/**
 * Ground-truth labeling for viral predictions.
 * "engagement" on ViralPrediction = snapshot at prediction time (inputs).
 * "outcome" = verified post-hoc performance used for MAE/RMSE and training labels.
 */

export type OutcomeSource = 'youtube_api' | 'user_submitted' | 'admin' | 'cron_sync';

/**
 * Map public stats → 0–100 “actual viral score” for regression-style error metrics.
 * Same formula previously misused in /api/ai/metrics against pre-prediction engagement.
 */
export function viralScoreFromEngagement(views: number, likes: number, comments: number): number {
  const v = Math.max(0, Number(views) || 0);
  const lk = Math.max(0, Number(likes) || 0);
  const cm = Math.max(0, Number(comments) || 0);
  const er = v > 0 ? ((lk + cm) / v) * 100 : 0;
  const viewsScore = Math.min(100, (v / 10000) * 100);
  const engagementScore = Math.min(100, er * 10);
  return Math.max(0, Math.min(100, viewsScore * 0.7 + engagementScore * 0.3));
}

export function binaryClassifierLabelFromScore(viralScore0to100: number): 0 | 1 {
  return Number(viralScore0to100) >= 50 ? 1 : 0;
}

const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractYoutubeVideoId(input: string | undefined | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(YT_REGEX);
  return m?.[1] ?? null;
}
