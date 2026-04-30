# VPS Setup — Deploy & Rollback System

One-time install on the Hostinger VPS to enable the **Super Admin → Deploy & Rollback** page.

## 1. Copy scripts to /usr/local/bin

```bash
ssh vidyt
cd /var/www/vidyt/scripts/vps
sudo cp vidyt-snapshot.sh /usr/local/bin/
sudo cp vidyt-restore.sh /usr/local/bin/
sudo cp vidyt-cleanup-snapshots.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/vidyt-*.sh
```

## 2. Create snapshot directory

```bash
sudo mkdir -p /var/www/vidyt-backups
sudo chown -R $(whoami):$(whoami) /var/www/vidyt-backups
```

## 3. Take a first snapshot to verify

```bash
/usr/local/bin/vidyt-snapshot.sh manual
ls -la /var/www/vidyt-backups
```

You should see one folder like `2026-04-30_09-15-22_manual/`.

## 4. Schedule hourly snapshots + nightly cleanup (cron)

```bash
crontab -e
```

Append:

```cron
# Hourly snapshot of vidyt app folder
0 * * * * /usr/local/bin/vidyt-snapshot.sh hourly >> /var/log/vidyt-snapshot.log 2>&1

# Keep only last 24 snapshots; runs every night at 3 AM
0 3 * * * /usr/local/bin/vidyt-cleanup-snapshots.sh 24 >> /var/log/vidyt-snapshot.log 2>&1
```

## 5. Optional env overrides

If your paths differ from defaults, set in PM2 ecosystem or shell profile:

```bash
export VIDYT_APP_DIR=/var/www/vidyt
export VIDYT_SNAPSHOT_DIR=/var/www/vidyt-backups
export VIDYT_PM2_NAME=vidyt
export VIDYT_DEPLOY_SCRIPT=/var/www/vidyt/deploy.sh
export VIDYT_SNAPSHOT_SCRIPT=/usr/local/bin/vidyt-snapshot.sh
export VIDYT_RESTORE_SCRIPT=/usr/local/bin/vidyt-restore.sh
```

Make sure these are exported in the same env PM2 sees (use `pm2 restart vidyt --update-env` after setting).

## 6. Verify in UI

Login as super-admin → `/admin/super/deploy` → you should see:
- Current commit + branch
- PM2 status
- Snapshot count > 0
- **Pull & Deploy Now** button works

## Disk space estimate

Each snapshot is roughly the size of the app folder *minus* `node_modules` and `.next/cache`.
Typical Vidyt snapshot: ~300-800 MB. With 24 hourly retention: ~10-20 GB.

Check available space before enabling:
```bash
df -h /var/www
```
