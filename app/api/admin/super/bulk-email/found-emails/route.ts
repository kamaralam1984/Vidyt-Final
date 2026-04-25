export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FoundEmail from '@/models/FoundEmail';

async function assertSuperAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new Error('Unauthorized');
  const role = String(user.role || '').toLowerCase().replace(/_/g, '-');
  if (role !== 'super-admin' && role !== 'superadmin') throw new Error('Forbidden');
}

// GET /api/admin/super/bulk-email/found-emails
// query: page, limit, platform, keyword, search
export async function GET(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get('limit') || 50)));
    const platform = searchParams.get('platform') || '';
    const keyword = searchParams.get('keyword') || '';
    const search = searchParams.get('search') || '';

    const filter: Record<string, any> = {};
    if (platform) filter.platform = platform;
    if (keyword) filter.keyword = { $regex: keyword, $options: 'i' };
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const [emails, total] = await Promise.all([
      FoundEmail.find(filter).sort({ savedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      FoundEmail.countDocuments(filter),
    ]);

    return NextResponse.json({ emails, total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// POST /api/admin/super/bulk-email/found-emails
// body: { emails: FinderResult[], keyword: string }
export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    await dbConnect();

    const { emails, keyword = '' } = await req.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'emails array required' }, { status: 400 });
    }

    let saved = 0;
    let skipped = 0;

    for (const item of emails) {
      if (!item.email) { skipped++; continue; }
      try {
        await FoundEmail.updateOne(
          { email: item.email.toLowerCase() },
          {
            $set: {
              name: item.name || '',
              platform: item.platform || 'youtube',
              profileUrl: item.profileUrl || null,
              followers: item.followers ?? null,
              website: item.website || null,
              address: item.address || null,
              phone: item.phone || null,
              rating: item.rating ?? null,
              category: item.category || null,
              country: item.country || null,
              keyword: keyword.trim(),
              savedAt: new Date(),
            },
          },
          { upsert: true }
        );
        saved++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ saved, skipped });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// DELETE /api/admin/super/bulk-email/found-emails
// query: id (single) or body: { ids: string[] } (bulk) or query: all=true
export async function DELETE(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (all) {
      const result = await FoundEmail.deleteMany({});
      return NextResponse.json({ deleted: result.deletedCount });
    }

    if (id) {
      await FoundEmail.deleteOne({ _id: id });
      return NextResponse.json({ deleted: 1 });
    }

    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const result = await FoundEmail.deleteMany({ _id: { $in: body.ids } });
      return NextResponse.json({ deleted: result.deletedCount });
    }

    return NextResponse.json({ error: 'Provide id, ids[], or all=true' }, { status: 400 });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
