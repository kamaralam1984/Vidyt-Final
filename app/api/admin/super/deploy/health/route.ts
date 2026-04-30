export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireSuperAdminAccess } from '@/lib/adminAuth';

const execAsync = promisify(exec);

const APP_DIR = process.env.VIDYT_APP_DIR || '/var/www/vidyt';
const SNAPSHOT_DIR = process.env.VIDYT_SNAPSHOT_DIR || '/var/www/vidyt-backups';
const PM2_NAME = process.env.VIDYT_PM2_NAME || 'vidyt';

async function runSafe(cmd: string, timeoutMs = 8000): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: timeoutMs, maxBuffer: 1024 * 1024 });
    return stdout.trim();
  } catch (e: any) {
    return e?.stdout?.toString().trim() || '';
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminAccess(request);
  if ('error' in auth) return auth.error;

  const [
    currentCommit,
    currentBranch,
    lastDeployTime,
    pm2Status,
    snapshotCount,
    diskFree,
    nodeUptime,
  ] = await Promise.all([
    runSafe(`git -C ${APP_DIR} log -1 --pretty=format:'%h %s (%ar)' 2>/dev/null`),
    runSafe(`git -C ${APP_DIR} rev-parse --abbrev-ref HEAD 2>/dev/null`),
    runSafe(`stat -c '%y' ${APP_DIR}/.next 2>/dev/null | head -c 19`),
    runSafe(`pm2 jlist 2>/dev/null`),
    runSafe(`ls -1 ${SNAPSHOT_DIR} 2>/dev/null | wc -l`),
    runSafe(`df -BG ${APP_DIR} 2>/dev/null | tail -1 | awk '{print $4}'`),
    runSafe(`pm2 describe ${PM2_NAME} 2>/dev/null | grep -E 'uptime|status|restarts' | head -3`),
  ]);

  let pm2Apps: Array<{ name: string; status: string; uptime: number; restarts: number; cpu: number; memory: number }> = [];
  try {
    const arr = JSON.parse(pm2Status || '[]');
    pm2Apps = arr.map((a: any) => ({
      name: a.name,
      status: a.pm2_env?.status || 'unknown',
      uptime: a.pm2_env?.pm_uptime ? Date.now() - a.pm2_env.pm_uptime : 0,
      restarts: a.pm2_env?.restart_time || 0,
      cpu: a.monit?.cpu || 0,
      memory: Math.round((a.monit?.memory || 0) / 1024 / 1024),
    }));
  } catch {}

  return NextResponse.json({
    ok: true,
    appDir: APP_DIR,
    currentCommit,
    currentBranch,
    lastDeployTime,
    snapshotCount: parseInt(snapshotCount) || 0,
    diskFree,
    pm2Apps,
    nodeUptime,
    timestamp: new Date().toISOString(),
  });
}
