# 🚀 Quick Fix for "Invalid Token" Error

## ⚡ Immediate Steps:

### 1. **Restart Server** (CRITICAL!)
```bash
# In terminal where npm run dev is running:
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

### 2. **Clear Browser Token**
Open browser console (F12) and run:
```javascript
localStorage.removeItem('token')
```

### 3. **Login Again**
- Go to `/login`
- Enter email and password
- Click "Sign In"
- New token will be generated ✅

### 4. **Test Video Analysis**
- Go to `/dashboard`
- Paste YouTube URL
- Click "Analyze"
- Should work now! 🎉

## 🔍 Why This Happens:

1. **Old Token**: Generated with old JWT_SECRET
2. **New Secret**: Updated in `.env.local`
3. **Server**: Needs restart to load new secret
4. **Mismatch**: Old token doesn't match new secret → "Invalid token"

## ✅ After Restart + Login:

- ✅ Server loads correct JWT_SECRET
- ✅ New token generated with correct secret
- ✅ Token verification works
- ✅ Video analysis works

## 🆘 Still Not Working?

1. **Check server restarted**: Look for "Ready" message in terminal
2. **Verify .env.local**: Should have ONE JWT_SECRET line
3. **Clear all storage**: `localStorage.clear()` in console
4. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
5. **Check console**: Look for any other errors

---

**TL;DR**: Restart server → Clear token → Login again → Works! ✅
