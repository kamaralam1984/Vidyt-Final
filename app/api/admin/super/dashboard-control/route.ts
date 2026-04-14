export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import User from '@/models/User';
import { ALL_FEATURES } from '@/utils/features';

async function requireSuperAdmin(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || !['super-admin', 'superadmin'].includes(authUser.role as string)) {
    return null;
  }
  return authUser;
}

// GET: features list + user list (paginated)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireSuperAdmin(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const userSearch = searchParams.get('userSearch') || '';
    const userPage = parseInt(searchParams.get('userPage') || '1');
    const limit = 20;

    await connectDB();

    // Features — return ALL features (client filters by group for display)
    const dbFeatures = await FeatureAccess.find({}).lean();
    const features = ALL_FEATURES.map(f => {
      const db = dbFeatures.find((d: any) => d.feature === f.id);
      return {
        id: f.id,
        label: f.label,
        group: f.group,
        enabled: db ? (db as any).enabled !== false : true,
        allowedRoles: db && (db as any).allowedRoles?.length > 0
          ? (db as any).allowedRoles
          : f.defaultRoles,
      };
    });

    // Users
    const userQuery: any = { isDeleted: { $ne: true } };
    if (userSearch) {
      userQuery.$or = [
        { name: { $regex: userSearch, $options: 'i' } },
        { email: { $regex: userSearch, $options: 'i' } },
      ];
    }
    const [users, totalUsers] = await Promise.all([
      User.find(userQuery)
        .select('_id name email role subscription uniqueId createdAt')
        .sort({ createdAt: -1 })
        .skip((userPage - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(userQuery),
    ]);

    return NextResponse.json({
      features,
      users,
      totalUsers,
      userPages: Math.ceil(totalUsers / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: update features OR update a user's role/plan
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireSuperAdmin(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    await connectDB();
    const body = await request.json();

    // Update features
    if (body.features && Array.isArray(body.features)) {
      for (const f of body.features) {
        const featureDef = ALL_FEATURES.find(x => x.id === f.id);
        await FeatureAccess.findOneAndUpdate(
          { feature: f.id },
          {
            feature: f.id,
            label: f.label || featureDef?.label || f.id,
            group: f.group || featureDef?.group || 'other',
            enabled: f.enabled,
            allowedRoles: f.allowedRoles,
          },
          { upsert: true, new: true }
        );
      }
      return NextResponse.json({ success: true, message: 'Features updated' });
    }

    // Update a single user's role/plan
    if (body.userId) {
      const updateFields: any = {};
      if (body.role) updateFields.role = body.role;
      if (body.subscription) updateFields.subscription = body.subscription;
      await User.findByIdAndUpdate(body.userId, { $set: updateFields });
      return NextResponse.json({ success: true, message: 'User updated' });
    }

    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
