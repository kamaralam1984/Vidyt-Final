module.exports = {
  apps: [
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
      // Restart delay to avoid crash loop
      min_uptime: '30s',
      max_restarts: 15,
      restart_delay: 8000,
      // Logs
      error_file: '/home/server/.pm2/logs/vidyt-error.log',
      out_file: '/home/server/.pm2/logs/vidyt-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
