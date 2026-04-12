export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PlatformControl from '@/models/PlatformControl';
import ControlLog from '@/models/ControlLog';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

// GET all controls for Super Admin
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const access = await requireSuperAdminAccess(request);
        if (access.error) return access.error;
        const user = access.user;

        const controls = await PlatformControl.find().sort({ platform: 1 });
        return NextResponse.json({ controls });
    } catch (error: any) {
        console.error('Fetch controls error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// POST update controls
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const access = await requireSuperAdminAccess(request);
        if (access.error) return access.error;
        const user = access.user;

        const body = await request.json();
        const { platform, isEnabled, allowedPlans, features } = body;

        // Validation
        if (!platform) {
            return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
        }

        const updatedControl = await PlatformControl.findOneAndUpdate(
            { platform },
            {
                platform,
                isEnabled,
                allowedPlans,
                features,
                updatedBy: user.id
            },
            { upsert: true, new: true }
        );

        // Log the change
        await ControlLog.create({
            action: 'UPDATE',
            platform,
            changes: JSON.stringify({ isEnabled, allowedPlans, features }),
            adminId: user.id,
            adminEmail: user.email
        });

        return NextResponse.json({ success: true, control: updatedControl });
    } catch (error: any) {
        console.error('Update controls error:', error);
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }
}
