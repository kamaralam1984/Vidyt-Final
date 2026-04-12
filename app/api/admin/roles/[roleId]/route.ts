/**
 * Admin API: Individual Role Management
 * Handle PATCH requests for updating specific roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, apiError, apiSuccess } from '@/lib/api-permissions';
import { AuthUser } from '@/lib/auth-jwt';
import connectDB from '@/lib/mongodb';
import RoleModel from '@/models/Role';

/**
 * PATCH /api/admin/roles/[roleId]
 * Update a specific role's properties
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  const user = (request as any).user as AuthUser;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'editRole');
  if (check.denied) return check.response;

  try {
    await connectDB();

    const body = await request.json();
    const { roleId } = params;
    const { name, level, description, color, permissions } = body;

    // Validate input
    if (!name || !roleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate level
    if (level && (level < 1 || level > 5)) {
      return NextResponse.json(
        { error: 'Level must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Try to update in database
    try {
      const updatedRole = await RoleModel.findByIdAndUpdate(
        roleId,
        {
          name,
          level: level || 2,
          description: description || '',
          color: color || '#FF0000',
          permissions: permissions || [],
        },
        { new: true, runValidators: true }
      );

      if (!updatedRole) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Role updated successfully',
        role: {
          _id: updatedRole._id,
          name: updatedRole.name,
          level: updatedRole.level,
          description: updatedRole.description,
          color: updatedRole.color,
          permissions: updatedRole.permissions,
          isCustom: updatedRole.isCustom,
          updatedAt: new Date(),
        }
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update role in database' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/roles/[roleId]
 * Delete a specific role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  const user = (request as any).user as AuthUser;

  // Only super-admin can access
  const check = requireRole(user, 'super-admin', 'deleteRole');
  if (check.denied) return check.response;

  try {
    await connectDB();

    const { roleId } = params;

    if (!roleId) {
      return NextResponse.json(
        { error: 'Missing roleId' },
        { status: 400 }
      );
    }

    // Delete from database
    try {
      const deletedRole = await RoleModel.findByIdAndDelete(roleId);

      if (!deletedRole) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Role deleted successfully',
        deletedId: roleId
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete role from database' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
