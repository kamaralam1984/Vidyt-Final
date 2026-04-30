export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

const execAsync = promisify(exec);
const RESTORE_SCRIPT = process.env.VIDYT_RESTORE_SCRIPT || '/usr/local/bin/vidyt-restore.sh';

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminAccess(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const snapshotId = String(body.snapshotId || '').trim();
  if (!snapshotId || !/^[a-zA-Z0-9_.-]+$/.test(snapshotId)) {
    return NextResponse.json({ ok: false, error: 'Invalid snapshotId' }, { status: 400 });
  }

  const logs: string[] = [];
  logs.push(`──── Rolling back to ${snapshotId} ────`);

  try {
    const { stdout, stderr } = await execAsync(`${RESTORE_SCRIPT} ${snapshotId}`, {
      timeout: 300000,
      maxBuffer: 4 * 1024 * 1024,
    });
    if (stdout) logs.push(stdout.trim());
    if (stderr) logs.push(`[stderr] ${stderr.trim()}`);
    return NextResponse.json({ ok: true, logs });
  } catch (e: any) {
    if (e?.stdout) logs.push(e.stdout.toString().trim());
    if (e?.stderr) logs.push(`[stderr] ${e.stderr.toString().trim()}`);
    logs.push(`[error] ${e?.message || e}`);
    return NextResponse.json({ ok: false, logs, error: e?.message || 'Restore failed' }, { status: 500 });
  }
}
