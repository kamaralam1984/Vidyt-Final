/**
 * Feature normalization for viral prediction model.
 * All 10 features are normalized to 0-1 range for the neural network.
 */

export const FEATURE_NAMES = [
  'hookScore',
  'thumbnailScore',
  'titleScore',
  'trendingScore',
  'videoDuration',
  'engagementRate',
  'growthVelocity',
  'commentVelocity',
  'likeRatio',
  'uploadTimingScore',
] as const;

export type ViralFeatures = {
  hookScore: number;
  thumbnailScore: number;
  titleScore: number;
  trendingScore: number;
  videoDuration: number;
  engagementRate: number;
  growthVelocity: number;
  commentVelocity: number;
  likeRatio: number;
  uploadTimingScore: number;
};

const DURATION_CAP_SEC = 600;
const GROWTH_VELOCITY_CAP = 10000;
const COMMENT_VELOCITY_CAP = 1000;
const ENGAGEMENT_CAP = 100;

export function normalizeFeatures(features: ViralFeatures): number[] {
  return [
    Math.min(1, Math.max(0, features.hookScore / 100)),
    Math.min(1, Math.max(0, features.thumbnailScore / 100)),
    Math.min(1, Math.max(0, features.titleScore / 100)),
    Math.min(1, Math.max(0, features.trendingScore / 100)),
    Math.min(1, Math.max(0, features.videoDuration / DURATION_CAP_SEC)),
    Math.min(1, Math.max(0, features.engagementRate / ENGAGEMENT_CAP)),
    Math.min(1, Math.max(0, features.growthVelocity / GROWTH_VELOCITY_CAP)),
    Math.min(1, Math.max(0, features.commentVelocity / COMMENT_VELOCITY_CAP)),
    Math.min(1, Math.max(0, features.likeRatio)),
    Math.min(1, Math.max(0, features.uploadTimingScore / 24)),
  ];
}

export function parseFeaturesFromBody(body: Record<string, unknown>): ViralFeatures {
  const num = (v: unknown, d: number) => (typeof v === 'number' && !Number.isNaN(v) ? v : typeof v === 'string' ? parseFloat(v) || d : d);
  return {
    hookScore: num(body.hookScore, 50),
    thumbnailScore: num(body.thumbnailScore, 50),
    titleScore: num(body.titleScore, 50),
    trendingScore: num(body.trendingScore, 50),
    videoDuration: num(body.videoDuration, 60),
    engagementRate: num(body.engagementRate, 5),
    growthVelocity: num(body.growthVelocity, 100),
    commentVelocity: num(body.commentVelocity, 10),
    likeRatio: num(body.likeRatio, 0.05),
    uploadTimingScore: num(body.uploadTimingScore, 12),
  };
}
