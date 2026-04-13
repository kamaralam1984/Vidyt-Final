export const dynamic = "force-dynamic";

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

    // Fields to hide for security
    const HIDDEN_FIELDS = new Set(['password', 'passwordHash', 'hash', 'refresh_token', 'access_token', 'token', 'secret', 'apiKey', 'otp', 'resetToken', 'verificationToken', '__v']);

    // Preferred column order for users table
    const USERS_ORDER = ['_id', 'name', 'email', 'phone', 'role', 'subscription', 'uniqueId', 'isVerified', 'isYoutubeConnected', 'createdAt', 'lastLogin'];

    const rows = data.map((doc) => {
      const o = doc as Record<string, unknown>;
      const out: Record<string, unknown> = { _id: o._id?.toString?.() || o._id };

      // Get all keys, filter hidden ones
      const keys = Object.keys(o).filter(k => k !== '_id' && !HIDDEN_FIELDS.has(k));

      // Order columns: preferred first, then rest alphabetically
      const orderedKeys = name === 'users'
        ? [...USERS_ORDER.filter(k => keys.includes(k)), ...keys.filter(k => !USERS_ORDER.includes(k)).sort()]
        : keys.sort((a, b) => {
            // Common fields first
            const priority = ['name', 'email', 'title', 'userId', 'status', 'platform', 'type', 'createdAt'];
            const ai = priority.indexOf(a);
            const bi = priority.indexOf(b);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.localeCompare(b);
          });

      for (const k of orderedKeys) {
        const v = o[k];
        if (v instanceof Date) out[k] = v.toISOString();
        else if (v && typeof v === 'object' && Object.prototype.toString.call(v) === '[object ObjectId]') out[k] = String(v);
        else if (v && typeof v === 'object' && !Array.isArray(v)) {
          // Flatten nested objects (like youtube.access_token) but skip hidden
          const nested = v as Record<string, unknown>;
          const safeKeys = Object.keys(nested).filter(nk => !HIDDEN_FIELDS.has(nk));
          if (safeKeys.length <= 3) {
            safeKeys.forEach(nk => { out[`${k}.${nk}`] = nested[nk]; });
          } else {
            out[k] = `{${safeKeys.length} fields}`;
          }
        } else out[k] = v;
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
