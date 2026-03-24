export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ApiKey, { generateApiKey } from '@/models/ApiKey';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const keys = await ApiKey.find({ userId: authUser.id }).select('name keyPrefix createdAt lastUsedAt').lean();
    return NextResponse.json({ keys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to list keys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const name = (body.name || 'Default').trim();
    const { key, keyHash, keyPrefix } = generateApiKey();
    await ApiKey.create({ userId: authUser.id, name, keyHash, keyPrefix });
    return NextResponse.json({ success: true, key, keyPrefix, message: 'Save this key; it will not be shown again.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create key' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Key id required' }, { status: 400 });
    await connectDB();
    await ApiKey.findOneAndDelete({ _id: id, userId: authUser.id });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete key' }, { status: 500 });
  }
}
