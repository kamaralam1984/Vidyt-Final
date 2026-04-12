// lib/permissions.ts
/**
 * Role-Based Permission System
 * 
 * Usage in API routes:
 * 
 * import { canPerform, checkPermission } from '@/lib/permissions';
 * 
 * export async function POST(request: NextRequest) {
 *   const user = await getUserFromRequest(request);
 *   
 *   // Method 1: Check and return error
 *   const error = checkPermission(user, 'createTeam');
 *   if (error) return NextResponse.json(error, { status: 403 });
 *   
 *   // Method 2: Check and continue
 *   if (!canPerform(user, 'createTeam')) {
 *     throw new Error('Not permitted');
 *   }
 * }
 */

import type { NextRequest } from 'next/server';
import type { AuthUser } from './auth-jwt';

// ──────────────── Role Hierarchy ────────────────
export const ROLE_HIERARCHY = {
  'user': 1,
  'manager': 2,
  'admin': 3,
  'super-admin': 4,
} as const;

export type RoleLevel = 'user' | 'manager' | 'admin' | 'super-admin';

// ──────────────── Permission Definitions ────────────────

/**
 * Maps action names to allowed roles
 */
export const PERMISSIONS = {
  // Video & Analysis
  uploadVideo: ['user', 'manager', 'admin', 'super-admin'],
  analyzeVideo: ['user', 'manager', 'admin', 'super-admin'],
  deleteVideo: ['user', 'manager', 'admin', 'super-admin'],
  bulkUpload: ['manager', 'admin', 'super-admin'],

  // AI Studio
  useAIStudio: ['user', 'manager', 'admin', 'super-admin'],
  scriptWriter: ['user', 'manager', 'admin', 'super-admin'],
  thumbnailIdeas: ['user', 'manager', 'admin', 'super-admin'],
  hookGenerator: ['user', 'manager', 'admin', 'super-admin'],
  shortsCreator: ['user', 'manager', 'admin', 'super-admin'],
  aiCoach: ['manager', 'admin', 'super-admin'],
  channelAudit: ['manager', 'admin', 'super-admin'],

  // Analytics
  viewOwnAnalytics: ['user', 'manager', 'admin', 'super-admin'],
  viewAdvancedAnalytics: ['manager', 'admin', 'super-admin'],
  viewTeamAnalytics: ['manager', 'admin', 'super-admin'],
  exportReports: ['manager', 'admin', 'super-admin'],
  createCustomReports: ['manager', 'admin', 'super-admin'],
  whiteLabel: ['admin', 'super-admin'],

  // Team Management
  createTeam: ['manager', 'admin', 'super-admin'],
  inviteMembers: ['manager', 'admin', 'super-admin'],
  manageTeamMembers: ['manager', 'admin', 'super-admin'],
  removeMembers: ['manager', 'admin', 'super-admin'],
  setMemberRoles: ['admin', 'super-admin'],
  viewAuditLogs: ['admin', 'super-admin'],

  // Content Management
  useContentCalendar: ['manager', 'admin', 'super-admin'],
  schedulePost: ['manager', 'admin', 'super-admin'],
  bulkScheduling: ['manager', 'admin', 'super-admin'],

  // Competitor Analysis
  trackCompetitors: ['manager', 'admin', 'super-admin'],
  comparePerformance: ['manager', 'admin', 'super-admin'],
  benchmarking: ['manager', 'admin', 'super-admin'],

  // API & Integration
  useAPI: ['admin', 'super-admin'],
  createAPIKeys: ['admin', 'super-admin'],
  manageWebhooks: ['admin', 'super-admin'],
  customIntegrations: ['admin', 'super-admin'],

  // Admin Only
  accessAdmin: ['admin', 'super-admin'],
  accessTeamAdmin: ['manager', 'admin', 'super-admin'],

  // Super Admin Only
  accessSuperAdmin: ['super-admin'],
  createPlans: ['super-admin'],
  editPlans: ['super-admin'],
  deletePlans: ['super-admin'],
  managePlans: ['super-admin'],
  createDiscounts: ['super-admin'],
  manageDiscounts: ['super-admin'],
  assignPlanToUser: ['super-admin'],
  manageUsers: ['super-admin'],
  changeUserRoles: ['super-admin'],
  suspendUsers: ['super-admin'],
  systemSettings: ['super-admin'],
  viewMetrics: ['super-admin'],

  // AI Training (Enterprise/Custom)
  trainCustomModels: ['admin', 'super-admin'],
  fineTuneModels: ['admin', 'super-admin'],
} as const;

export type PermissionAction = keyof typeof PERMISSIONS;

// ──────────────── Permission Checking Functions ────────────────

/**
 * Check if user has permission for an action
 * 
 * @param user - User object from auth
 * @param action - Action to check
 * @returns true if allowed, false otherwise
 * 
 * @example
 * if (!canPerform(user, 'createTeam')) {
 *   throw new Error('Not permitted');
 * }
 */
export function canPerform(
  user: AuthUser | null,
  action: PermissionAction
): boolean {
  if (!user) return false;

  const allowedRoles = PERMISSIONS[action];
  return (allowedRoles as readonly string[]).includes(user.role as string);
}

/**
 * Check multiple permissions at once (all must be true)
 * 
 * @param user - User object
 * @param actions - Array of actions to check
 * @returns true if all allowed, false if any denied
 * 
 * @example
 * if (!canPerformAll(user, ['createTeam', 'manageTeamMembers'])) {
 *   throw new Error('Insufficient permissions');
 * }
 */
export function canPerformAll(
  user: AuthUser | null,
  actions: PermissionAction[]
): boolean {
  if (!user) return false;
  return actions.every(action => canPerform(user, action));
}

/**
 * Check multiple permissions (any one true is enough)
 * 
 * @param user - User object
 * @param actions - Array of actions to check
 * @returns true if any allowed, false if all denied
 * 
 * @example
 * if (!canPerformAny(user, ['downloadReport', 'exportData'])) {
 *   throw new Error('No export permissions');
 * }
 */
export function canPerformAny(
  user: AuthUser | null,
  actions: PermissionAction[]
): boolean {
  if (!user) return false;
  return actions.some(action => canPerform(user, action));
}

/**
 * Check if user has minimum role level
 * 
 * @param user - User object
 * @param minRole - Minimum role required
 * @returns true if user role >= minRole, false otherwise
 * 
 * @example
 * if (!hasMinRole(user, 'manager')) {
 *   throw new Error('Managers and above only');
 * }
 */
export function hasMinRole(
  user: AuthUser | null,
  minRole: RoleLevel
): boolean {
  if (!user) return false;

  const userLevel = ROLE_HIERARCHY[user.role as RoleLevel] ?? 0;
  const minLevel = ROLE_HIERARCHY[minRole];

  return userLevel >= minLevel;
}

/**
 * Check if user has exactly one role
 * 
 * @param user - User object
 * @param role - Role to check
 * @returns true if user has this exact role
 * 
 * @example
 * if (hasRole(user, 'super-admin')) {
 *   // Load admin features
 * }
 */
export function hasRole(
  user: AuthUser | null,
  role: RoleLevel
): boolean {
  if (!user) return false;
  return (user.role as RoleLevel) === role;
}

/**
 * Check permission and return error object if denied
 * 
 * @param user - User object
 * @param action - Action to check
 * @returns { error, status } if denied, null if allowed
 * 
 * @example
 * const error = checkPermission(user, 'createTeam');
 * if (error) return NextResponse.json(error, { status: 403 });
 */
export function checkPermission(
  user: AuthUser | null,
  action: PermissionAction
): { error: string; status: number } | null {
  if (!user) {
    return {
      error: 'Unauthorized: Please login first',
      status: 401,
    };
  }

  if (!canPerform(user, action)) {
    return {
      error: `Permission denied: You need a higher plan to ${formatAction(action)}. Upgrade your plan to continue.`,
      status: 403,
    };
  }

  return null;
}

/**
 * Get human-readable action name
 * 
 * @param action - Action key
 * @returns Formatted action description
 * 
 * @example
 * formatAction('createTeam') → 'create teams'
 */
function formatAction(action: string): string {
  return action
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();
}

/**
 * Get all allowed actions for a role
 * 
 * @param role - Role to check
 * @returns Array of actions user can perform
 * 
 * @example
 * const managerActions = getAllActions('manager');
 * // Returns all actions 'manager' role can do
 */
export function getAllActions(role: RoleLevel): PermissionAction[] {
  return (Object.keys(PERMISSIONS) as PermissionAction[]).filter((action) =>
    (PERMISSIONS[action] as readonly string[]).includes(role)
  );
}

/**
 * Get minimum role required for an action
 * 
 * @param action - Action to check
 * @returns Minimum role required, or null if public
 * 
 * @example
 * const minRole = getMinRoleFor('createTeam');
 * // Returns 'manager'
 */
export function getMinRoleFor(action: PermissionAction): RoleLevel | null {
  const roles = PERMISSIONS[action] as readonly string[];

  // Find minimum role from allowed roles
  const roleNames = ['user', 'manager', 'admin', 'super-admin'] as const;
  for (const role of roleNames) {
    if (roles.includes(role)) return role;
  }

  return null;
}

/**
 * Check if user can manage another user
 * 
 * @param manager - User doing the managing
 * @param target - User being managed
 * @returns true if manager can control target
 * 
 * @example
 * if (!canManageUser(user, targetUser)) {
 *   throw new Error('Cannot manage this user');
 * }
 */
export function canManageUser(
  manager: AuthUser | null,
  target: AuthUser
): boolean {
  if (!manager) return false;

  // Super admin can manage anyone
  if (hasRole(manager, 'super-admin')) return true;

  // Admin can manage user/manager
  if (hasRole(manager, 'admin')) {
    return hasMinRole(target, 'user') && !hasRole(target, 'admin');
  }

  // Manager can manage other users
  if (hasRole(manager, 'manager')) {
    return hasRole(target, 'user');
  }

  // User cannot manage others
  return false;
}

/**
 * Get role-based feature availability
 * 
 * @param role - User role
 * @returns Object with feature flags
 * 
 * @example
 * const features = getRoleFeatures('pro');
 * if (features.canUseAPI) {
 *   // Show API section
 * }
 */
export interface RoleFeatures {
  canUploadVideos: boolean;
  canUseAI: boolean;
  canCreateTeam: boolean;
  canUseAPI: boolean;
  canWhiteLabel: boolean;
  canTrainModels: boolean;
  canAccessAdmin: boolean;
  canManagePlans: boolean;
  analysesPerDay: number;
  teamMembers: number;
  scheduledPosts: number;
  connectedChannels: number;
}

export function getRoleFeatures(role: RoleLevel): RoleFeatures {
  const features: Record<RoleLevel, RoleFeatures> = {
    user: {
      canUploadVideos: true,
      canUseAI: true,
      canCreateTeam: false,
      canUseAPI: false,
      canWhiteLabel: false,
      canTrainModels: false,
      canAccessAdmin: false,
      canManagePlans: false,
      analysesPerDay: 5,    // Adjusted by plan
      teamMembers: 1,
      scheduledPosts: 0,
      connectedChannels: 1,
    },
    manager: {
      canUploadVideos: true,
      canUseAI: true,
      canCreateTeam: true,
      canUseAPI: false,
      canWhiteLabel: false,
      canTrainModels: false,
      canAccessAdmin: true,
      canManagePlans: false,
      analysesPerDay: 30,
      teamMembers: 3,
      scheduledPosts: 50,
      connectedChannels: 5,
    },
    admin: {
      canUploadVideos: true,
      canUseAI: true,
      canCreateTeam: true,
      canUseAPI: true,
      canWhiteLabel: true,
      canTrainModels: true,
      canAccessAdmin: true,
      canManagePlans: false,
      analysesPerDay: 100,
      teamMembers: -1,  // Unlimited
      scheduledPosts: -1,
      connectedChannels: -1,
    },
    'super-admin': {
      canUploadVideos: true,
      canUseAI: true,
      canCreateTeam: true,
      canUseAPI: true,
      canWhiteLabel: true,
      canTrainModels: true,
      canAccessAdmin: true,
      canManagePlans: true,
      analysesPerDay: -1,  // Unlimited
      teamMembers: -1,
      scheduledPosts: -1,
      connectedChannels: -1,
    },
  };

  return features[role];
}

// ──────────────── API Route Helpers ────────────────

/**
 * Middleware for API routes to check permission
 * 
 * Usage in route.ts:
 * export async function POST(request: NextRequest) {
 *   const error = await requirePermission(request, 'createTeam');
 *   if (error) return error;
 *   // ... continue with endpoint
 * }
 */
export async function requirePermission(
  request: NextRequest,
  action: PermissionAction
) {
  const { NextResponse } = await import('next/server');
  
  try {
    const { getUserFromRequest } = await import('./auth');
    const user = await getUserFromRequest(request);

    const error = checkPermission(user, action);
    if (error) {
      return NextResponse.json(
        { error: error.error },
        { status: error.status }
      );
    }

    return null; // Permission granted
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}

/**
 * Check if feature is enabled for role
 * 
 * @param role - User role
 * @param feature - Feature name
 * @returns true if enabled
 * 
 * @example
 * if (isFeatureEnabled(user.role, 'teamCollaboration')) {
 *   // Show team features
 * }
 */
export function isFeatureEnabled(
  role: RoleLevel,
  feature: string
): boolean {
  const features = getRoleFeatures(role);
  return !!(features as any)[`can${feature}`];
}

/**
 * Get upgrade message for denied permission
 * 
 * @param action - Action that was denied
 * @param userRole - Current user role
 * @returns upgrade message
 * 
 * @example
 * if (!canPerform(user, 'useAPI')) {
 *   const msg = getUpgradeMessage('useAPI', user.role);
 *   // msg = "please upgrade to Enterprise plan to use API"
 * }
 */
export function getUpgradeMessage(
  action: PermissionAction,
  userRole: RoleLevel
): string {
  const minRole = getMinRoleFor(action);
  if (!minRole) return 'This feature is not available.';

  const minLevel = ROLE_HIERARCHY[minRole];
  const userLevel = ROLE_HIERARCHY[userRole];

  if (userLevel >= minLevel) {
    return 'You have access to this feature.';
  }

  const rolePlanMap: Record<RoleLevel, string> = {
    'user': 'Starter',
    'manager': 'Pro',
    'admin': 'Enterprise',
    'super-admin': 'Owner',
  };

  const targetPlan = rolePlanMap[minRole];
  const actionText = formatAction(action);

  return `Please upgrade to ${targetPlan} plan to ${actionText}.`;
}

// ──────────────── Export Types ────────────────

export type { AuthUser } from './auth-jwt';
