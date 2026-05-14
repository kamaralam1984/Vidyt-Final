export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FoundEmail from '@/models/FoundEmail';

// The email-finder feature has been removed for compliance.
// GET / POST are disabled. DELETE remains available so the admin can purge
// previously harvested data from the database.

async function assertSuperAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new Error('Unauthorized');
  const role = String(user.role || '').toLowerCase().replace(/_/g, '-');
  if (role !== 'super-admin' && role !== 'superadmin') throw new Error('Forbidden');
}

const DEPRECATION_NOTICE = {
  error: 'Feature removed',
  reason: 'Storing scraped third-party emails violates GDPR, CAN-SPAM, and platform ToS. Existing records can still be deleted via DELETE.',
};

export async function GET() {
  return NextResponse.json(DEPRECATION_NOTICE, { status: 410 });
}

export async function POST() {
  return NextResponse.json(DEPRECATION_NOTICE, { status: 410 });
}

// Kept so the admin can clean up any data that was previously collected.
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
