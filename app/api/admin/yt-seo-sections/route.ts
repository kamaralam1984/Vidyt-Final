export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import { ALL_FEATURES } from '@/utils/features';

const YT_SEO_SECTION_IDS = [
  'yt_seo_video_setup',
  'yt_seo_seo_score',
  'yt_seo_ctr_predictor',
  'yt_seo_best_posting_time',
  'yt_seo_title_score',
  'yt_seo_keywords',
  'yt_seo_thumbnail',
  'yt_seo_descriptions',
  'yt_seo_hashtags',
  'yt_seo_competitors',
  'yt_seo_channel_summary',
  'yt_seo_viral_probability',
  'yt_seo_chinki',
  'yt_seo_video_analyze',
];

/**
 * GET /api/admin/yt-seo-sections
 * Returns section visibility flags for the current user's role.
 * Used by the YouTube SEO Analyzer page to conditionally show/hide sections.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userRole = (authUser.role as string) || 'user';

    const dbFeatures = await FeatureAccess.find({ feature: { $in: YT_SEO_SECTION_IDS } });

    const sections: Record<string, boolean> = {};

    for (const id of YT_SEO_SECTION_IDS) {
      const featureDef = ALL_FEATURES.find(f => f.id === id);
      const dbFeature = dbFeatures.find(f => f.feature === id);

      const enabled = dbFeature ? dbFeature.enabled : true;
      const allowedRoles: string[] = dbFeature
        ? dbFeature.allowedRoles
        : featureDef?.defaultRoles ?? ['user', 'manager', 'admin', 'super-admin'];

      // Section is visible if globally enabled AND user's role is in allowedRoles
      // Super-admin always sees everything
      const visible = enabled && (userRole === 'super-admin' || allowedRoles.includes(userRole));
      sections[id] = visible;
    }

    return NextResponse.json({ sections });
  } catch (error: any) {
    console.error('YT SEO sections GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
