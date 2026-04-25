export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FoundEmail from '@/models/FoundEmail';
import * as XLSX from 'xlsx';

async function assertSuperAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new Error('Unauthorized');
  const role = String(user.role || '').toLowerCase().replace(/_/g, '-');
  if (role !== 'super-admin' && role !== 'superadmin') throw new Error('Forbidden');
}

// GET /api/admin/super/bulk-email/found-emails/export?format=csv|excel|pdf&platform=&keyword=&search=
export async function GET(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
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

    const emails = await FoundEmail.find(filter).sort({ savedAt: -1 }).limit(10000).lean();

    const rows = emails.map((e: any) => ({
      Email: e.email || '',
      Name: e.name || '',
      Platform: e.platform || '',
      Followers: e.followers ?? '',
      Phone: e.phone || '',
      Website: e.website || '',
      Address: e.address || '',
      Rating: e.rating ?? '',
      Category: e.category || '',
      Country: e.country || '',
      Keyword: e.keyword || '',
      'Profile URL': e.profileUrl || '',
      'Saved At': e.savedAt ? new Date(e.savedAt).toLocaleString() : '',
    }));

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      if (rows.length === 0) {
        return new NextResponse('Email,Name,Platform\n', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="found-emails-${timestamp}.csv"`,
          },
        });
      }
      const headers = Object.keys(rows[0]);
      const csvRows = [
        headers.join(','),
        ...rows.map(row =>
          headers.map(h => {
            const val = String((row as any)[h] ?? '').replace(/"/g, '""');
            return `"${val}"`;
          }).join(',')
        ),
      ];
      const csv = csvRows.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="found-emails-${timestamp}.csv"`,
        },
      });
    }

    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Email: '', Name: '', Platform: '' }]);

      // Auto column widths
      const colWidths = Object.keys(rows[0] || { Email: '', Name: '', Platform: '' }).map(key => ({
        wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] ?? '').length).slice(0, 100)) + 2,
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Found Emails');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="found-emails-${timestamp}.xlsx"`,
        },
      });
    }

    if (format === 'pdf') {
      // Return JSON data — client will render PDF using jsPDF
      return NextResponse.json({ rows, timestamp });
    }

    return NextResponse.json({ error: 'Invalid format. Use csv, excel, or pdf' }, { status: 400 });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
