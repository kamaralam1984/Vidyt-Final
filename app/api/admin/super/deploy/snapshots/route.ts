export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

const execAsync = promisify(exec);
const SNAPSHOT_DIR = process.env.VIDYT_SNAPSHOT_DIR || '/var/www/vidyt-backups';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminAccess(request);
  if ('error' in auth) return auth.error;

  try {
    const { stdout } = await execAsync(
      `ls -lt ${SNAPSHOT_DIR} 2>/dev/null | tail -n +2 | awk '{print $NF, $5, $6, $7, $8}'`,
      { timeout: 5000 }
    );
    const lines = stdout.trim().split('\n').filter(Boolean);
    const snapshots = lines.map(line => {
      const parts = line.split(' ').filter(Boolean);
      const id = parts[0];
      const size = parts[1];
      const mtime = parts.slice(2).join(' ');
      const ts = id.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/);
      return {
        id,
        size,
        mtime,
        readableTime: ts ? `${ts[1]} ${ts[2]}:${ts[3]}:${ts[4]}` : id,
        kind: id.includes('pre-deploy') ? 'pre-deploy' : id.includes('hourly') ? 'hourly' : 'manual',
      };
    });
    return NextResponse.json({ ok: true, snapshots, dir: SNAPSHOT_DIR });
  } catch (e: any) {
    return NextResponse.json({ ok: true, snapshots: [], dir: SNAPSHOT_DIR, error: e?.message });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminAccess(request);
  if ('error' in auth) return auth.error;

  const SNAPSHOT_SCRIPT = process.env.VIDYT_SNAPSHOT_SCRIPT || '/usr/local/bin/vidyt-snapshot.sh';
  try {
    const body = await request.json().catch(() => ({}));
    const tag = (body.tag || 'manual').toString().replace(/[^a-zA-Z0-9_-]/g, '');
    const { stdout, stderr } = await execAsync(`${SNAPSHOT_SCRIPT} ${tag}`, { timeout: 60000, maxBuffer: 1024 * 1024 });
    return NextResponse.json({ ok: true, output: stdout.trim() || stderr.trim() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'snapshot failed' }, { status: 500 });
  }
}
