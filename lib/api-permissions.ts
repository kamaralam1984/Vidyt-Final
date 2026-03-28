/**
 * API Permission & Role Check Utility
 * Prevents unauthorized access to endpoints based on user roles
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  canPerform,
  hasMinRole,
  getRoleFeatures,
  checkPermission,
  type PermissionAction,
  type RoleFeatures,
  type RoleLevel,
} from './permissions';
import { AuthUser } from '@/lib/auth-jwt';

/**
 * Response types for permission checks
 */
export interface PermissionCheckResult {
  allowed: boolean;
  error?: string;
  statusCode?: number;
  upgradeMessage?: string;
}

/**
 * Check if user has permission for an action
 * Returns error response if not allowed
 */
export function checkAPIPermission(
  user: AuthUser | null,
  action: PermissionAction,
  actionName?: string
): PermissionCheckResult {
  // First check: User is authenticated
  if (!user) {
    return {
      allowed: false,
      error: 'Authentication required',
      statusCode: 401,
    };
  }

  // Second check: User has permission
  const denied = checkPermission(user, action);
  if (denied) {
    return {
      allowed: false,
      error: denied.error,
      statusCode: denied.status,
    };
  }

  return { allowed: true };
}

/**
 * Express-like middleware for API route protection
 * Usage: const check = requireRole(req, 'manager', 'createTeam')
 */
export function requireRole(
  user: AuthUser | null,
  minRole: 'user' | 'manager' | 'admin' | 'super-admin',
  actionName: string = minRole
) {
  if (!user) {
    return {
      denied: true,
      response: NextResponse.json(
        {
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      ),
    };
  }

  if (!hasMinRole(user, minRole)) {
    const roleNames: Record<string, string> = {
      'user': 'Free/Starter',
      'manager': 'Pro',
      'admin': 'Enterprise',
      'super-admin': 'Super Admin',
    };

    return {
      denied: true,
      response: NextResponse.json(
        {
          error: `${roleNames[minRole]} plan required for this feature`,
          code: 'UPGRADE_REQUIRED',
          requiredPlan: minRole,
          currentPlan: user.subscription,
          currentRole: user.role,
        },
        { status: 403 }
      ),
    };
  }

  return { denied: false };
}

/**
 * Check usage limits for an action
 */
export interface UsageLimitCheckResult {
  withinLimit: boolean;
  used: number;
  limit: number;
  error?: string;
}

export function checkUsageLimit(
  user: AuthUser,
  action: string,
  currentUsage: number
): UsageLimitCheckResult {
  const features = getRoleFeatures(user.role as RoleLevel);

  // Map actions to numeric limits on RoleFeatures
  const limitMap: Record<string, keyof RoleFeatures> = {
    analyzeVideo: 'analysesPerDay',
    createTeam: 'teamMembers',
    bulkAnalysis: 'analysesPerDay',
    useAPI: 'connectedChannels',
    customModel: 'analysesPerDay',
  };

  const limitKey = limitMap[action];
  if (!limitKey) {
    // No limit defined for this action
    return { withinLimit: true, used: 0, limit: -1 };
  }

  const limit = features[limitKey] as number;

  // -1 means unlimited
  if (limit === -1) {
    return { withinLimit: true, used: currentUsage, limit: -1 };
  }

  const withinLimit = currentUsage < limit;
  return {
    withinLimit,
    used: currentUsage,
    limit,
    error: withinLimit
      ? undefined
      : `Daily limit exceeded. You have used ${currentUsage}/${limit}`,
  };
}

/**
 * Extract user from request
 * Handles Bearer token, cookies, and test tokens
 */
export async function extractUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Token will be verified by middleware
      // This is just extraction
    }

    // Try to get from cookie
    const tokenCookie = request.cookies.get('token')?.value;
    if (tokenCookie) {
      // Token already verified by middleware
    }

    // Note: Actual token verification happens in middleware
    // This function is just for extraction demonstration
    // The actual user object should be in request context
    return null;
  } catch (error) {
    console.error('Error extracting user:', error);
    return null;
  }
}

/**
 * Helper: Create a protected API route handler
 * Usage: 
 * const protected = protectedRoute('manager', 'createTeam');
 * export const POST = protected(async (req, user) => {...})
 */
export function protectedRoute(
  minRole: 'user' | 'manager' | 'admin' | 'super-admin',
  actionName: string = minRole
) {
  return (handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      // User should already be injected by middleware
      // This is handled at request level
      const user = (req as any).user;

      if (!user) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
          },
          { status: 401 }
        );
      }

      const check = requireRole(user, minRole, actionName);
      if (check.denied) {
        return check.response;
      }

      try {
        return await handler(req, user);
      } catch (error) {
        console.error(`Error in ${actionName}:`, error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Get appropriate error message based on what user needs
 */
export function getUpgradeMessage(action: string, currentRole: string): string {
  const upgradePaths: Record<string, Record<string, string>> = {
    createTeam: {
      'user': 'Upgrade to Pro plan to create teams',
      'manager': 'Upgrade to Enterprise to manage unlimited teams',
      'admin': 'Already have team features',
    },
    useAPI: {
      'user': 'Upgrade to Enterprise plan to use API',
      'manager': 'Upgrade to Enterprise plan to use API',
      'admin': 'API available in Enterprise plan',
    },
    whiteLabel: {
      'user': 'Upgrade to Enterprise for white-label features',
      'manager': 'Upgrade to Enterprise for white-label features',
      'admin': 'White-label available in Enterprise plan',
    },
  };

  return upgradePaths[action]?.[currentRole] || `Upgrade your plan for this feature`;
}

/**
 * Format error response for API
 */
export function apiError(
  message: string,
  code: string,
  statusCode: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Format success response for API
 */
export function apiSuccess(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    ...(message && { message }),
    data,
  });
}

/**
 * Verify user can manage another user (team member management)
 */
export function canManageUser(manager: AuthUser, targetUserId: string): boolean {
  // Only manager+ can manage users
  if (!hasMinRole(manager, 'manager')) {
    return false;
  }

  // TODO: Check if manager is in same team as target user
  // This would require checking database

  return true;
}

/**
 * Rate limiting check (basic implementation)
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
}

export function checkRateLimit(
  userId: string,
  action: string,
  requestsPerMinute: number = 60
): RateLimitCheckResult {
  // TODO: Implement actual rate limiting
  // For now, allow all requests
  // In production, use Redis or similar

  return { allowed: true };
}

/**
 * Log permission check for audit trail
 */
export function logPermissionCheck(
  userId: string,
  action: string,
  allowed: boolean,
  reason?: string
) {
  // TODO: Implement audit logging
  console.log(`[Permission Check] User: ${userId}, Action: ${action}, Allowed: ${allowed}${reason ? `, Reason: ${reason}` : ''}`);
}
