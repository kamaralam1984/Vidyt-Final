export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import { ALL_FEATURES } from '@/utils/features';

const CI_SECTION_IDS = [
  'ci_channel_input',
  'ci_channel_overview',
  'ci_ranking_panel',
  'ci_revenue_calculator',
  'ci_ai_insights',
  'ci_growth_prediction',
  'ci_competitor_comparison',
];

/**
 * GET /api/admin/channel-intelligence-sections
 * Returns section visibility flags for the current user's role.
 * Used by the Channel Intelligence page to conditionally show/hide sections.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userRole = (authUser.role as string) || 'user';

    const dbFeatures = await FeatureAccess.find({ feature: { $in: CI_SECTION_IDS } });

    const sections: Record<string, boolean> = {};

    for (const id of CI_SECTION_IDS) {
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
    console.error('Channel Intelligence sections GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
