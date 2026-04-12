export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PlatformControl from '@/models/PlatformControl';
import ControlLog from '@/models/ControlLog';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

// Master switch - enables/disables all platforms
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const access = await requireSuperAdminAccess(request);
        if (access.error) return access.error;
        const user = access.user;

        const body = await request.json();
        const { isEnabled } = body; // boolean true/false

        if (typeof isEnabled !== 'boolean') {
            return NextResponse.json({ error: 'Boolean isEnabled is required' }, { status: 400 });
        }

        // Update all configured platforms
        await PlatformControl.updateMany(
            {},
            { 
               isEnabled: isEnabled,
               updatedBy: user.id 
            }
        );

        // Log the master toggle
        await ControlLog.create({
            action: 'MASTER_TOGGLE',
            platform: 'ALL',
            changes: JSON.stringify({ globalState: isEnabled ? 'ENABLED' : 'DISABLED' }),
            adminId: user.id,
            adminEmail: user.email
        });

        return NextResponse.json({ success: true, message: `All platforms ${isEnabled ? 'enabled' : 'disabled'}` });
    } catch (error: any) {
        console.error('Master toggle error:', error);
        return NextResponse.json({ error: 'Failed to apply master toggle' }, { status: 500 });
    }
}
