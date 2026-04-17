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
      name: 'vidyt',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/vidyt',
      exec_mode: 'fork',
      instances: 1,
      // Auto-restart when memory exceeds 2.2GB (system has 7.6GB total)
      max_memory_restart: '2200M',
      // Node.js heap limit + aggressive GC to prevent leaks
      node_args: '--max_old_space_size=2048 --expose-gc --gc-interval=100 --max-semi-space-size=64',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
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
