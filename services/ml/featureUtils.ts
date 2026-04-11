/**
 * Feature normalization for viral prediction model.
 * All 10 features are normalized to 0-1 range for the neural network.
 */

export const FEATURE_NAMES = [
  // Group 1: Base Engagement (10)
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
  // Group 2: Content & Context (10)
  'titleLength',
  'descriptionLength',
  'hashtagCount',
  'emotionalTriggers',
  'clickPotential',
  'nicheConcentration',
  'timeOfDayScore',
  'dayOfWeekScore',
  'audioQualityScore',
  'visualClarityScore',
  // Group 3: Algorithm & Metadata (10)
  'retentionEstimate',
  'ctrEstimate',
  'subscriberCountLog',
  'channelAgeDays',
  'averageViewsLast10',
  'shareVelocity',
  'saveVelocity',
  'watchTimeEstimate',
  'competitionScore',
  'platformFitScore',
] as const;

export type ViralFeatures = {
  [K in typeof FEATURE_NAMES[number]]: number;
};

const DURATION_CAP_SEC = 600;
const GROWTH_VELOCITY_CAP = 10000;
const COMMENT_VELOCITY_CAP = 1000;
const ENGAGEMENT_CAP = 100;
const SUB_COUNT_LOG_CAP = 10;
const VIEWS_CAP = 10000000;

export function normalizeFeatures(features: ViralFeatures): number[] {
  return [
    // Group 1
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

    // Group 2
    Math.min(1, Math.max(0, features.titleLength / 100)),
    Math.min(1, Math.max(0, features.descriptionLength / 5000)),
    Math.min(1, Math.max(0, features.hashtagCount / 30)),
    Math.min(1, Math.max(0, features.emotionalTriggers)),
    Math.min(1, Math.max(0, features.clickPotential)),
    Math.min(1, Math.max(0, features.nicheConcentration)),
    Math.min(1, Math.max(0, features.timeOfDayScore)),
    Math.min(1, Math.max(0, features.dayOfWeekScore)),
    Math.min(1, Math.max(0, features.audioQualityScore)),
    Math.min(1, Math.max(0, features.visualClarityScore)),

    // Group 3
    Math.min(1, Math.max(0, features.retentionEstimate)),
    Math.min(1, Math.max(0, features.ctrEstimate)),
    Math.min(1, Math.max(0, features.subscriberCountLog / SUB_COUNT_LOG_CAP)),
    Math.min(1, Math.max(0, features.channelAgeDays / 5000)),
    Math.min(1, Math.max(0, features.averageViewsLast10 / VIEWS_CAP)),
    Math.min(1, Math.max(0, features.shareVelocity / 100)),
    Math.min(1, Math.max(0, features.saveVelocity / 100)),
    Math.min(1, Math.max(0, features.watchTimeEstimate / 3600)),
    Math.min(1, Math.max(0, features.competitionScore)),
    Math.min(1, Math.max(0, features.platformFitScore)),
  ];
}

const FEATURE_DEFAULTS: Record<string, number> = {
  hookScore: 50,
  thumbnailScore: 50,
  titleScore: 50,
  trendingScore: 50,
  videoDuration: 60,
  engagementRate: 5,
  growthVelocity: 100,
  commentVelocity: 10,
  likeRatio: 0.05,
  uploadTimingScore: 12,
  titleLength: 50,
  descriptionLength: 2500,
  hashtagCount: 15,
  subscriberCountLog: 5,
  channelAgeDays: 1000,
  averageViewsLast10: 100000,
  shareVelocity: 10,
  saveVelocity: 10,
  watchTimeEstimate: 300,
};

export function parseFeaturesFromBody(body: Record<string, unknown>): ViralFeatures {
  const features: any = {};

  FEATURE_NAMES.forEach(name => {
    const val = body[name];
    const defaultValue = FEATURE_DEFAULTS[name as string] ?? 0.5;

    if (typeof val === 'number' && !Number.isNaN(val)) {
      features[name] = val;
    } else if (typeof val === 'string') {
      const parsed = parseFloat(val);
      features[name] = !Number.isNaN(parsed) ? parsed : defaultValue;
    } else {
      features[name] = defaultValue;
    }
  });

  return features as ViralFeatures;
}