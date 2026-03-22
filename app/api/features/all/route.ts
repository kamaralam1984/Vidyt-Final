import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import { ALL_FEATURES } from '@/utils/features';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    await connectDB();
    const existingFeatures = await FeatureAccess.find({}).lean();
    
    // Filter features based on user role and enabled status
    const features = ALL_FEATURES.map(f => {
      const dbFeature = existingFeatures.find(dbf => dbf.feature === f.id);
      const enabled = dbFeature ? dbFeature.enabled : true;
      const allowedRoles = dbFeature && dbFeature.allowedRoles?.length ? dbFeature.allowedRoles : f.defaultRoles;
      
      const isAllowed = authUser ? allowedRoles.includes(authUser.role) : false;

      return {
        id: f.id,
        enabled: enabled && isAllowed,
      };
    }).reduce((acc, curr) => {
      acc[curr.id] = curr.enabled;
      return acc;
    }, {} as Record<string, boolean>);

    return NextResponse.json({ features });
  } catch (error: any) {
    // If not logged in, return all as false or only public ones if any (none for now)
    return NextResponse.json({ features: {} });
  }
}
