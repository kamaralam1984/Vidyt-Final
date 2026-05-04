export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

const execAsync = promisify(exec);

const GIT_DIR = process.env.VIDYT_GIT_DIR || process.env.VIDYT_APP_DIR || '/var/www/vidyt';

async function run(logs: string[], label: string, cmd: string, timeoutMs = 60000) {
  logs.push(`\n──── ${label} ────`);
  logs.push(`$ ${cmd}`);
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: timeoutMs, maxBuffer: 2 * 1024 * 1024 });
    if (stdout) logs.push(stdout.trim());
    if (stderr) logs.push(`[stderr] ${stderr.trim()}`);
    return { ok: true, stdout: stdout.trim() };
  } catch (e: any) {
    if (e?.stdout) logs.push(e.stdout.toString().trim());
    if (e?.stderr) logs.push(`[stderr] ${e.stderr.toString().trim()}`);
    logs.push(`[error] ${e?.message || e}`);
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminAccess(request);
  if ('error' in auth) return auth.error;

  try {
    const { stdout: status } = await execAsync(`cd ${GIT_DIR} && git status --short`, { timeout: 10000 });
    const { stdout: log } = await execAsync(`cd ${GIT_DIR} && git log --oneline -5`, { timeout: 10000 });
    const { stdout: branch } = await execAsync(`cd ${GIT_DIR} && git branch --show-current`, { timeout: 10000 });
    const { stdout: ahead } = await execAsync(
      `cd ${GIT_DIR} && git rev-list --count origin/main..HEAD 2>/dev/null || echo 0`,
      { timeout: 10000 }
    );
    const changedFiles = status.trim().split('\n').filter(Boolean);
    return NextResponse.json({
      gitDir: GIT_DIR,
      branch: branch.trim(),
      changedFiles,
      changedCount: changedFiles.length,
      ahead: parseInt(ahead.trim(), 10) || 0,
      recentCommits: log.trim().split('\n').filter(Boolean),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminAccess(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const message: string = (body?.message || '').trim();
  if (!message) {
    return NextResponse.json({ ok: false, error: 'Commit message is required' }, { status: 400 });
  }

  const logs: string[] = [];

  const status = await run(logs, 'Git status', `cd ${GIT_DIR} && git status --short`);
  if (!status.ok) return NextResponse.json({ ok: false, logs, error: 'git status failed' }, { status: 500 });

  const hasChanges = (status.stdout || '').trim().length > 0;
  const ahead = await run(logs, 'Commits ahead', `cd ${GIT_DIR} && git rev-list --count origin/main..HEAD 2>/dev/null || echo 0`);
  const aheadCount = parseInt((ahead.stdout || '0').trim(), 10) || 0;

  if (!hasChanges && aheadCount === 0) {
    logs.push('\n✓ Nothing to push — working tree is clean and no unpushed commits.');
    return NextResponse.json({ ok: true, logs, noop: true });
  }

  if (hasChanges) {
    const add = await run(logs, 'Git add', `cd ${GIT_DIR} && git add -A`);
    if (!add.ok) return NextResponse.json({ ok: false, logs, error: 'git add failed' }, { status: 500 });

    const safeMsg = message.replace(/'/g, "'\\''");
    const commit = await run(logs, 'Git commit', `cd ${GIT_DIR} && git commit -m '${safeMsg}'`);
    if (!commit.ok) return NextResponse.json({ ok: false, logs, error: 'git commit failed' }, { status: 500 });
  }

  const push = await run(logs, 'Git push', `cd ${GIT_DIR} && git push origin main`, 60000);
  if (!push.ok) return NextResponse.json({ ok: false, logs, error: 'git push failed' }, { status: 500 });

  logs.push('\n✓ Pushed to GitHub. VPS cron will pick it up within ~1 minute.');
  return NextResponse.json({ ok: true, logs });
}
