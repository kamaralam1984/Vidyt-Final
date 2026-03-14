import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED = new Set([
  'users', 'videos', 'scheduledposts', 'subscriptions', 'viraldatasets',
  'trendhistories', 'engagementmetrics', 'competitors', 'analyses',
]);

function getStringKeys(doc: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(doc)) {
    if (k === '_id') continue;
    if (typeof v === 'string') keys.push(k);
    else if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      keys.push(...getStringKeys(v as Record<string, unknown>).map((sub) => `${k}.${sub}`));
    }
  }
  return keys;
}

function buildSearchQuery(keys: string[], search: string): Record<string, unknown> {
  if (!keys.length) return {};
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    $or: keys.map((k) => ({ [k]: { $regex: escaped, $options: 'i' } })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await connectDB();
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const name = (params.name || '').toLowerCase();
    if (!ALLOWED.has(name)) {
      return NextResponse.json({ error: 'Collection not allowed' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = (searchParams.get('search') || '').trim();

    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
    const coll = db.collection(name);

    let query: Record<string, unknown> = {};
    if (search) {
      const sample = await coll.findOne({});
      const stringKeys = sample ? getStringKeys(sample as Record<string, unknown>) : [];
      query = buildSearchQuery(stringKeys, search);
    }

    const [data, total] = await Promise.all([
      coll
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      coll.countDocuments(query),
    ]);

    const rows = data.map((doc) => {
      const o = doc as Record<string, unknown>;
      const out: Record<string, unknown> = { _id: o._id?.toString?.() || o._id };
      for (const [k, v] of Object.entries(o)) {
        if (k === '_id') continue;
        if (v instanceof Date) out[k] = v.toISOString();
        else if (v && typeof v === 'object' && Object.prototype.toString.call(v) === '[object ObjectId]') out[k] = String(v);
        else out[k] = v;
      }
      return out;
    });

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: { page, limit, total },
    });
  } catch (error: any) {
    console.error('Admin collection data error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load data' },
      { status: 500 }
    );
  }
}
