# 🔧 Troubleshooting Guide

## Common Errors & Solutions

### 1. ❌ 503 Service Unavailable (`/api/health/db`)

**Problem:** MongoDB connection is failing or timing out.

**Solutions:**
- Check MongoDB Atlas connection string in `.env.local`
- Verify internet connection (for MongoDB Atlas)
- Check MongoDB Atlas cluster is running
- Increase connection timeout (already done in code)

**Test:**
```bash
curl http://localhost:3000/api/health/db
```

Should return: `{"status":"connected","message":"Database connection successful"}`

---

### 2. ❌ 401 Unauthorized (`/api/auth/login`)

**Problem:** Login API is returning 401.

**Possible Causes:**
1. **Wrong credentials** - Email/password incorrect
2. **Database connection failed** - MongoDB not connected
3. **User doesn't exist** - Need to register first

**Solutions:**
- Check if user exists in database
- Try registering a new account first
- Check MongoDB connection status
- Verify credentials are correct

**Test:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

---

### 3. ❌ Invalid Token Error

**Problem:** Token verification is failing.

**Solutions:**
1. **Clear old token:**
   ```javascript
   localStorage.removeItem('token')
   ```

2. **Login again** to get new token

3. **Restart server** if JWT_SECRET changed:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### 4. ❌ "Session Expired" Alert

**Problem:** Token is invalid or expired.

**Solutions:**
- Clear browser localStorage
- Login again
- Check server is running with correct JWT_SECRET

---

## 🔍 Debug Steps

### Check Server Status:
```bash
# Check if server is running
ps aux | grep "next dev"

# Check MongoDB connection
curl http://localhost:3000/api/health/db
```

### Check Browser:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Check for errors
4. Go to Application tab → Local Storage
5. Check if `token` exists

### Check Environment:
```bash
# Verify .env.local exists
cat .env.local

# Check JWT_SECRET (should be single line)
grep JWT_SECRET .env.local
```

---

## ✅ Quick Fix Checklist

- [ ] Server is running (`npm run dev`)
- [ ] MongoDB connected (check `/api/health/db`)
- [ ] `.env.local` has correct MONGODB_URI
- [ ] `.env.local` has single JWT_SECRET
- [ ] Browser localStorage has valid token
- [ ] User account exists in database
- [ ] Credentials are correct

---

## 🚨 Still Not Working?

1. **Restart everything:**
   ```bash
   # Stop server
   Ctrl+C
   
   # Restart
   npm run dev
   ```

2. **Clear browser:**
   ```javascript
   localStorage.clear()
   ```

3. **Register new account:**
   - Go to `/register`
   - Create new account
   - Login with new credentials

4. **Check server logs:**
   - Look for MongoDB connection errors
   - Check for JWT_SECRET issues
   - Verify API routes are compiling

---

## 📞 Need More Help?

Check these files:
- `lib/mongodb.ts` - Database connection
- `lib/auth-jwt.ts` - Token generation/verification
- `middleware.ts` - API route protection
- `.env.local` - Environment variables
