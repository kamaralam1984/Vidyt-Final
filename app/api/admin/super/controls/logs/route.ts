import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ControlLog from '@/models/ControlLog';

// GET all toggle history logs for Super Admin
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const user = await getUserFromRequest(request);
        
        if (!user || user.role !== 'super-admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const logs = await ControlLog.find()
            .sort({ createdAt: -1 })
            .limit(100); // return the last 100 history changes

        return NextResponse.json({ logs });
    } catch (error: any) {
        console.error('Fetch control logs error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
