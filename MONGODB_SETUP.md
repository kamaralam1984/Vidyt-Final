# MongoDB Setup Guide

## ✅ MongoDB Installation Check

MongoDB is already installed on your system at `/usr/bin/mongod`

## 🚀 Quick Start MongoDB

### 1. Start MongoDB Service

```bash
sudo systemctl start mongod
```

### 2. Enable MongoDB to Start on Boot

```bash
sudo systemctl enable mongod
```

### 3. Check MongoDB Status

```bash
sudo systemctl status mongod
```

### 4. Verify MongoDB is Running

```bash
mongosh --eval "db.adminCommand('listDatabases')"
```

or

```bash
mongo --eval "db.adminCommand('listDatabases')"
```

## 📝 Database Configuration

The application uses:
- **Database Name**: `viralboost`
- **Connection URI**: `mongodb://localhost:27017/viralboost`

This is configured in `.env.local` file.

## 🔧 Troubleshooting

### If MongoDB Service Fails:

1. **Check MongoDB logs:**
   ```bash
   sudo journalctl -u mongod -n 50
   ```

2. **Check MongoDB data directory:**
   ```bash
   ls -la /var/lib/mongodb
   ```

3. **Fix permissions if needed:**
   ```bash
   sudo chown -R mongodb:mongodb /var/lib/mongodb
   sudo chown -R mongodb:mongodb /var/log/mongodb
   ```

4. **Restart MongoDB:**
   ```bash
   sudo systemctl restart mongod
   ```

### Create Database Manually (if needed):

```bash
mongosh
use viralboost
db.createCollection('users')
db.createCollection('videos')
db.createCollection('analyses')
exit
```

## ✅ Verification

After starting MongoDB, check the connection status indicator on:
- `/login` page
- `/register` page

The indicator should show:
- 🟢 **Green light** = Database Connected
- 🔴 **Red light** = Database Disconnected

## 📊 Database Collections

The application will automatically create these collections:
- `users` - User accounts
- `videos` - Video metadata
- `analyses` - Video analysis results
- `viraldatasets` - Viral video data
- `trendhistories` - Trend data
- `competitors` - Competitor tracking
- `engagements` - Engagement metrics
- `scheduledposts` - Scheduled content
- `subscriptions` - Subscription data

## 🔐 Security Notes

1. **Change JWT_SECRET** in `.env.local` for production
2. **Use MongoDB authentication** in production
3. **Enable MongoDB firewall** rules
4. **Backup database** regularly

## 🎯 Next Steps

1. Start MongoDB service
2. Check connection status on login/register pages
3. Create your first account
4. Start using the platform!
