export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

const execAsync = promisify(exec);

const APP_DIR = process.env.VIDYT_APP_DIR || '/var/www/vidyt';
const DEPLOY_SCRIPT = process.env.VIDYT_DEPLOY_SCRIPT || `${APP_DIR}/deploy.sh`;
const SNAPSHOT_SCRIPT = process.env.VIDYT_SNAPSHOT_SCRIPT || '/usr/local/bin/vidyt-snapshot.sh';

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminAccess(request);
  if ('error' in auth) return auth.error;

  const logs: string[] = [];

  async function run(label: string, cmd: string, timeoutMs = 180000) {
    logs.push(`\n──── ${label} ────`);
    logs.push(`$ ${cmd}`);
    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 });
      if (stdout) logs.push(stdout.trim());
      if (stderr) logs.push(`[stderr] ${stderr.trim()}`);
      return { ok: true };
    } catch (e: any) {
      if (e?.stdout) logs.push(e.stdout.toString().trim());
      if (e?.stderr) logs.push(`[stderr] ${e.stderr.toString().trim()}`);
      logs.push(`[error] ${e?.message || e}`);
      return { ok: false, error: e?.message || String(e) };
    }
  }

  // 1. Pre-deploy snapshot
  await run('Pre-deploy snapshot', `${SNAPSHOT_SCRIPT} pre-deploy 2>&1 || echo 'snapshot script missing — skipped'`, 60000);

  // 2. Pull latest
  const pull = await run('Git pull', `cd ${APP_DIR} && git fetch origin main && git reset --hard origin/main`);
  if (!pull.ok) {
    return NextResponse.json({ ok: false, logs, error: 'Git pull failed' }, { status: 500 });
  }

  // 3. Run deploy script (build + pm2 reload)
  const deploy = await run('Deploy script', `cd ${APP_DIR} && bash ${DEPLOY_SCRIPT}`, 300000);

  return NextResponse.json({
    ok: deploy.ok,
    logs,
    error: deploy.ok ? undefined : 'Deploy script failed — auto-rollback recommended',
  }, { status: deploy.ok ? 200 : 500 });
}
