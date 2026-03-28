/**
 * Admin API: Assign Plans to Users
 * Super-admin endpoint to manage user subscriptions and roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, apiError, apiSuccess } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';
import User, { type IUser } from '@/models/User';
import Plan from '@/models/Plan';

const PLAN_ROLE_MAPPING: Record<string, string> = {
  'free': 'user',
  'starter': 'user',
  'pro': 'manager',
  'enterprise': 'admin',
  'custom': 'admin',
  'owner': 'super-admin',
};

/**
 * GET /api/admin/users/[userId]/role
 * Get user's current role and permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = (request as any).user as AuthUser;
  const { userId } = await params;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'manageUserRoles');
  if (check.denied) return check.response;

  try {
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return apiError('User not found', 'USER_NOT_FOUND', 404);
    }

    return apiSuccess(
      {
        userId: targetUser._id,
        email: targetUser.email,
        name: targetUser.name,
        subscription: targetUser.subscription,
        role: targetUser.role,
        plan: {
          id: targetUser.subscriptionPlan?.planId,
          name: targetUser.subscriptionPlan?.planName,
        },
      },
      'User role retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error getting user role:', error);
    return apiError('Failed to get user role', 'FETCH_USER_ROLE_ERROR', 500);
  }
}

/**
 * POST /api/admin/users/[userId]/role
 * Assign a plan and role to a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = (request as any).user as AuthUser;
  const { userId } = await params;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'assignPlanToUser');
  if (check.denied) return check.response;

  try {
    const body = await request.json();
    const { planId, customRole, customLimits } = body;

    // Validate input
    if (!planId) {
      return apiError('Missing planId', 'MISSING_PLAN_ID', 400);
    }

    // Get plan details
    const plan = await Plan.findOne({ planId });
    if (!plan) {
      return apiError('Plan not found', 'PLAN_NOT_FOUND', 404);
    }

    // Get user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return apiError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Determine role based on plan or custom role
    const newRole = (customRole ||
      PLAN_ROLE_MAPPING[planId] ||
      'user') as IUser['role'];

    // Update user with new plan and role
    targetUser.subscription = planId as IUser['subscription'];
    targetUser.role = newRole;
    targetUser.subscriptionPlan = {
      planId: plan.planId,
      planName: plan.name,
      billingPeriod: (plan.billingPeriod === 'year' ? 'year' : 'month') as 'month' | 'year',
      price: plan.priceMonthly || 0,
      currency: plan.currency || 'INR',
      status: 'active',
    };

    if (customLimits) {
      targetUser.customLimits = customLimits;
    }

    await targetUser.save();

    return apiSuccess(
      {
        userId: targetUser._id,
        planId: plan.planId,
        role: newRole,
        message: `User assigned to ${plan.name} plan with ${newRole} role`,
      },
      'Plan assigned successfully'
    );
  } catch (error: any) {
    console.error('Error assigning plan:', error);
    return apiError('Failed to assign plan', 'ASSIGN_PLAN_ERROR', 500);
  }
}

/**
 * PUT /api/admin/users/[userId]/role
 * Update user's role (can override plan-based role)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = (request as any).user as AuthUser;
  const { userId } = await params;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'editUserRole');
  if (check.denied) return check.response;

  try {
    const body = await request.json();
    const { role, customLimits } = body;

    // Validate role
    if (!role || !['user', 'manager', 'admin', 'super-admin'].includes(role)) {
      return apiError('Invalid role', 'INVALID_ROLE', 400);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return apiError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Update role
    const oldRole = targetUser.role;
    targetUser.role = role as IUser['role'];

    if (customLimits) {
      targetUser.customLimits = customLimits;
    }

    await targetUser.save();

    return apiSuccess(
      {
        userId: targetUser._id,
        oldRole,
        newRole: role,
        customLimits: customLimits || null,
      },
      `User role updated from ${oldRole} to ${role}`
    );
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return apiError('Failed to update user role', 'UPDATE_USER_ROLE_ERROR', 500);
  }
}

/**
 * DELETE /api/admin/users/[userId]/role
 * Reset user to default plan-based role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = (request as any).user as AuthUser;
  const { userId } = await params;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'resetUserRole');
  if (check.denied) return check.response;

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return apiError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Reset to default role based on subscription
    const subscription = targetUser.subscription || 'free';
    const defaultRole = (PLAN_ROLE_MAPPING[subscription] || 'user') as IUser['role'];

    targetUser.role = defaultRole;
    targetUser.customLimits = undefined;

    await targetUser.save();

    return apiSuccess(
      {
        userId: targetUser._id,
        resetRole: defaultRole,
        subscription,
      },
      'User role reset to default'
    );
  } catch (error: any) {
    console.error('Error resetting user role:', error);
    return apiError('Failed to reset user role', 'RESET_ROLE_ERROR', 500);
  }
}
