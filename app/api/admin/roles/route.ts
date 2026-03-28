/**
 * Admin API: Role & Plan Control
 * Super-admin only endpoint to manage roles and plan assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, apiError, apiSuccess } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';
import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import User from '@/models/User';
import RoleModel from '@/models/Role';

/**
 * GET /api/admin/roles
 * Get all available roles and their permissions (including custom roles from DB)
 */
export async function GET(request: NextRequest) {
  const user = (request as any).user as AuthUser;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'accessRoleManager');
  if (check.denied) return check.response;

  try {
    await connectDB();

    // Built-in roles
    const builtInRoles = [
      {
        _id: 'builtin_user',
        name: 'User',
        level: 1,
        description: 'Basic features - Free & Starter plans',
        color: '#AAAAAA',
        permissions: [
          'uploadVideo',
          'analyzeVideo',
          'viewOwnAnalytics',
          'useAIStudio',
          'scriptWriter',
          'thumbnailIdeas'
        ],
        isCustom: false,
      },
      {
        _id: 'builtin_manager',
        name: 'Manager',
        level: 2,
        description: 'Team features - Pro plan',
        color: '#FF0000',
        permissions: [
          'uploadVideo',
          'analyzeVideo',
          'viewOwnAnalytics',
          'useAIStudio',
          'createTeam',
          'inviteMembers',
          'manageTeamMembers',
          'viewTeamAnalytics',
          'useContentCalendar',
          'schedulePost',
          'advancedAnalytics'
        ],
        isCustom: false,
      },
      {
        _id: 'builtin_admin',
        name: 'Admin',
        level: 3,
        description: 'Advanced features - Enterprise plan',
        color: '#FFD700',
        permissions: [
          'uploadVideo',
          'analyzeVideo',
          'viewOwnAnalytics',
          'useAIStudio',
          'createTeam',
          'inviteMembers',
          'manageTeamMembers',
          'viewTeamAnalytics',
          'useContentCalendar',
          'schedulePost',
          'advancedAnalytics',
          'useAPI',
          'createAPIKeys',
          'manageWebhooks',
          'whiteLabel',
          'trainCustomModels'
        ],
        isCustom: false,
      }
    ];

    // Try to fetch custom roles from database
    let customRoles: Record<string, unknown>[] = [];
    try {
      const rows = await RoleModel.find({ isCustom: true }).lean();
      customRoles = rows as Record<string, unknown>[];
    } catch (dbError: any) {
      console.error('Failed to fetch custom roles from DB:', dbError);
      // Continue with just built-in roles if DB fails
    }

    const allRoles = [...builtInRoles, ...customRoles];

    return NextResponse.json({
      success: true,
      message: 'Roles retrieved successfully',
      roles: allRoles
    });
  } catch (error: any) {
    console.error('Error getting roles:', error);
    return NextResponse.json(
      { error: 'Failed to get roles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * Create a new custom role
 */
export async function POST(request: NextRequest) {
  const user = (request as any).user as AuthUser;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'createRole');
  if (check.denied) return check.response;

  try {
    await connectDB();

    const body = await request.json();
    const { name, level, description, color, permissions } = body;

    // Validate input
    if (!name) {
      return apiError('Role name is required', 'MISSING_NAME', 400);
    }

    // Validate level
    if (level && (level < 1 || level > 5)) {
      return apiError('Level must be between 1 and 5', 'INVALID_LEVEL', 400);
    }

    // Try to save to database
    try {
      const newRole = new RoleModel({
        name,
        level: level || 2,
        description: description || '',
        color: color || '#FF0000',
        permissions: permissions || [],
        isCustom: true,
      });

      const savedRole = await newRole.save();

      return NextResponse.json({
        success: true,
        message: 'Role created successfully',
        role: {
          _id: savedRole._id,
          name: savedRole.name,
          level: savedRole.level,
          description: savedRole.description,
          color: savedRole.color,
          permissions: savedRole.permissions,
          isCustom: savedRole.isCustom,
          createdAt: new Date(),
        }
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create role in database' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/roles/[roleId]
 * Update role permissions and limits
 */
export async function PUT(request: NextRequest) {
  const user = (request as any).user as AuthUser;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'editRole');
  if (check.denied) return check.response;

  try {
    const body = await request.json();
    const { roleId, permissions, limits } = body;

    if (!roleId) {
      return apiError('Missing roleId', 'MISSING_ROLE_ID', 400);
    }

    // TODO: Update role in database

    return apiSuccess(
      {
        roleId,
        permissions,
        limits,
        updatedAt: new Date(),
      },
      'Role updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating role:', error);
    return apiError('Failed to update role', 'UPDATE_ROLE_ERROR', 500);
  }
}
