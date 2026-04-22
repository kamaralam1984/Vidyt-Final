# 🔄 Server Restart Instructions

## ⚠️ Important: Restart Required

After fixing the JWT_SECRET issue, you **MUST** restart the Next.js server for changes to take effect.

## 📋 Steps to Fix "Invalid Token" / "Session Expired" Error:

### Step 1: Stop Current Server
1. Go to the terminal where `npm run dev` is running
2. Press `Ctrl + C` to stop the server
3. Wait for it to fully stop

### Step 2: Restart Server
```bash
npm run dev
```

### Step 3: Clear Old Token & Login Again
1. Open browser console (F12)
2. Run: `localStorage.removeItem('token')`
3. Go to `/login` page
4. Login with your credentials
5. New token will be generated with correct JWT_SECRET

### Step 4: Test Video Analysis
1. Go to `/dashboard`
2. Paste YouTube URL
3. Click "Analyze"
4. Should work now! ✅

## 🔍 Why This Happened:

- **Old tokens** were generated with a different JWT_SECRET
- **New JWT_SECRET** is now in `.env.local`
- **Server needs restart** to load new secret
- **Old tokens** won't work until you login again

## ✅ After Restart:

- ✅ Server loads new JWT_SECRET
- ✅ New tokens use correct secret
- ✅ Token verification works
- ✅ Video analysis works

## 🚨 If Still Not Working:

1. Check `.env.local` has only ONE JWT_SECRET
2. Verify server restarted (check terminal)
3. Clear browser localStorage: `localStorage.clear()`
4. Login again
5. Check browser console for errors

---

**Quick Fix:**
```bash
# Terminal 1: Stop server (Ctrl+C)
# Terminal 1: Restart
npm run dev

# Browser: Clear token
localStorage.removeItem('token')

# Browser: Login again
# Go to /login and login
```
