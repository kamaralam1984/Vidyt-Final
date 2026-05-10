// cloudflared-tunnel is now managed by systemd (user service)
// ~/.config/systemd/user/cloudflared.service
// To check: systemctl --user status cloudflared

module.exports = {
  apps: [
    {
      name: 'tracking-worker',
      script: './node_modules/.bin/ts-node',
      args: '--project tsconfig.server.json --transpile-only -r tsconfig-paths/register workers/trackingWorker.ts',
      cwd: '/var/www/vidyt',
      exec_mode: 'fork',
      instances: 1,
      // Worker is lightweight — cap at 512MB
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        TRACKING_WORKER_START: 'true',
      },
      kill_timeout: 5000,
      min_uptime: '15s',
      max_restarts: 20,
      restart_delay: 3000,
      error_file: '/home/server/.pm2/logs/tracking-worker-error.log',
      out_file: '/home/server/.pm2/logs/tracking-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'ai-worker',
      script: './node_modules/.bin/ts-node',
      args: '--project tsconfig.server.json --transpile-only -r tsconfig-paths/register workers/aiWorker.ts',
      cwd: '/var/www/vidyt',
      exec_mode: 'fork',
      instances: 1,
      // AI scoring uses tfjs/natural — give it more headroom than tracking
      max_memory_restart: '1024M',
      env: {
        NODE_ENV: 'production',
        AI_WORKER_START: 'true',
      },
      kill_timeout: 5000,
      min_uptime: '15s',
      max_restarts: 20,
      restart_delay: 3000,
      error_file: '/home/server/.pm2/logs/ai-worker-error.log',
      out_file: '/home/server/.pm2/logs/ai-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'bulk-email-worker',
      script: './node_modules/.bin/ts-node',
      args: '--project tsconfig.server.json --transpile-only -r tsconfig-paths/register workers/bulkEmailWorker.ts',
      cwd: '/var/www/vidyt',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        BULK_EMAIL_WORKER_START: 'true',
      },
      kill_timeout: 5000,
      min_uptime: '15s',
      max_restarts: 20,
      restart_delay: 3000,
      error_file: '/home/server/.pm2/logs/bulk-email-worker-error.log',
      out_file: '/home/server/.pm2/logs/bulk-email-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'posting-worker',
      script: './node_modules/.bin/ts-node',
      args: '--project tsconfig.server.json --transpile-only -r tsconfig-paths/register workers/postingWorker.ts',
      cwd: '/var/www/vidyt',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        POSTING_WORKER_START: 'true',
      },
      kill_timeout: 5000,
      min_uptime: '15s',
      max_restarts: 20,
      restart_delay: 3000,
      error_file: '/home/server/.pm2/logs/posting-worker-error.log',
      out_file: '/home/server/.pm2/logs/posting-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'vidyt',
      script: 'npm',
      // Run the custom Express + Socket.io server (server.ts) instead of
      // the default `next start` so the live dashboard's WebSocket-driven
      // real-time updates work end-to-end. Falls back to polling only when
      // a client genuinely can't upgrade — never as steady-state.
      args: 'run start:ws',
      cwd: '/var/www/vidyt',
      exec_mode: 'fork',
      instances: 1,
      // Auto-restart when memory exceeds 2.2GB (system has 7.6GB total)
      max_memory_restart: '2200M',
      // Node.js heap limit + aggressive GC to prevent leaks. Pass via
      // NODE_OPTIONS env so the npm-spawned ts-node child inherits it
      // (PM2 node_args only apply to the direct npm process, not its
      // grandchildren).
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max_old_space_size=2048 --expose-gc --max-semi-space-size=64',
      },
      // Wait for old process to fully release port before restarting
      kill_timeout: 8000,
      // Restart delay to avoid crash loop
      min_uptime: '30s',
      max_restarts: 15,
      restart_delay: 4000,
      // Logs
      error_file: '/home/server/.pm2/logs/vidyt-error.log',
      out_file: '/home/server/.pm2/logs/vidyt-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
