# MongoDB Quick Start Guide 🚀

## ✅ MongoDB Status
MongoDB is **installed** but **not running**. You need to start it.

## 🎯 Quick Setup (3 Steps)

### Step 1: Start MongoDB Service
```bash
sudo systemctl start mongod
```

### Step 2: Enable MongoDB (Auto-start on boot)
```bash
sudo systemctl enable mongod
```

### Step 3: Verify MongoDB is Running
```bash
sudo systemctl status mongod
```

You should see: `Active: active (running)`

## 📝 Create Database

The database will be created automatically when you first use the app, OR you can create it manually:

```bash
mongosh
use viralboost
db.createCollection('users')
exit
```

## 🔍 Check Connection

After starting MongoDB, check the connection status on:
- **Login Page**: `http://localhost:3000/login`
- **Register Page**: `http://localhost:3000/register`

You should see:
- 🟢 **Green light** = Database Connected ✅
- 🔴 **Red light** = Database Disconnected ❌

## 🛠️ Troubleshooting

### If MongoDB Won't Start:

1. **Check logs:**
   ```bash
   sudo journalctl -u mongod -n 50
   ```

2. **Check data directory:**
   ```bash
   ls -la /var/lib/mongodb
   ```

3. **Fix permissions (if needed):**
   ```bash
   sudo chown -R mongodb:mongodb /var/lib/mongodb
   sudo chown -R mongodb:mongodb /var/log/mongodb
   ```

4. **Restart MongoDB:**
   ```bash
   sudo systemctl restart mongod
   ```

## 📊 Database Configuration

The app uses:
- **Database Name**: `viralboost`
- **Connection**: `mongodb://localhost:27017/viralboost`

This is set in `.env.local` (created automatically).

## ✅ After MongoDB is Running

1. ✅ Start MongoDB service
2. ✅ Check status indicator on login/register pages
3. ✅ Create your account
4. ✅ Start using ViralBoost AI!

## 🎉 That's It!

Once MongoDB is running, the app will automatically:
- Connect to database
- Create collections when needed
- Store all your data

**No manual database creation needed!** The app handles everything automatically.
