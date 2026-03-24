export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ControlLog from '@/models/ControlLog';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

// GET all toggle history logs for Super Admin
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const access = await requireSuperAdminAccess(request);
        if (access.error) return access.error;

        const logs = await ControlLog.find()
            .sort({ createdAt: -1 })
            .limit(100); // return the last 100 history changes

        return NextResponse.json({ logs });
    } catch (error: any) {
        console.error('Fetch control logs error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
