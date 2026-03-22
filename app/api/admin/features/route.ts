import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import { ALL_FEATURES } from '@/utils/features';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const existingFeatures = await FeatureAccess.find({});
    
    // Merge database data with ALL_FEATURES constants
    const features = ALL_FEATURES.map(f => {
      const dbFeature = existingFeatures.find(dbf => dbf.feature === f.id);
      return {
        id: f.id,
        label: f.label,
        group: f.group,
        enabled: dbFeature ? dbFeature.enabled : true,
        allowedRoles: dbFeature ? dbFeature.allowedRoles : f.defaultRoles,
      };
    });

    return NextResponse.json({ features });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { features } = await request.json();
    if (!Array.isArray(features)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    await connectDB();

    for (const f of features) {
      await FeatureAccess.findOneAndUpdate(
        { feature: f.id },
        { 
          label: f.label,
          group: f.group,
          enabled: f.enabled,
          allowedRoles: f.allowedRoles
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ message: 'Features updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
