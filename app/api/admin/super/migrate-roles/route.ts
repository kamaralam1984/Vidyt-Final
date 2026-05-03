// One-shot migration: align every User.role + Plan.role with the new
// "role name == plan name" convention. Owner stays super-admin.
//
//  user (legacy)     → user.subscription (free / starter)
//  manager (legacy)  → 'pro'
//  admin (legacy)    → user.subscription (enterprise / custom)
//  super-admin       → kept
//  enterprise / custom / pro / starter / free already-correct → no-op
//
// Plan.role is also normalized so each Plan doc stores its plan-name role.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Plan from '@/models/Plan';
import { roleForPlan, migrateRole } from '@/lib/roleNormalizer';

async function migrate(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  // ── Plans ──────────────────────────────────────────────────────────
  const plans = await Plan.find({}).select('planId role').lean();
  const planOps: any[] = [];
  for (const p of plans as any[]) {
    const target = roleForPlan(p.planId);
    if (p.role !== target) {
      planOps.push({
        updateOne: { filter: { planId: p.planId }, update: { $set: { role: target } } },
      });
    }
  }
  if (planOps.length) await Plan.bulkWrite(planOps, { ordered: false });

  // ── Users ──────────────────────────────────────────────────────────
  const users = await User.find({}).select('role subscription').lean();
  const userOps: any[] = [];
  let usersUpdated = 0;
  for (const u of users as any[]) {
    const target = migrateRole(String(u.role || ''), String(u.subscription || 'free'));
    if (u.role !== target) {
      userOps.push({
        updateOne: { filter: { _id: u._id }, update: { $set: { role: target } } },
      });
      usersUpdated++;
    }
  }
  if (userOps.length) await User.bulkWrite(userOps, { ordered: false });

  return NextResponse.json({
    success: true,
    plansUpdated: planOps.length,
    usersUpdated,
    totalUsers: users.length,
    totalPlans: plans.length,
    timestamp: new Date().toISOString(),
  });
}

export const POST = migrate;
export const GET = migrate;
