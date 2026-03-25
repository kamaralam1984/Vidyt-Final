# ViralBoost AI — native shell (Capacitor)

This folder wraps your **deployed website** in an Android/iOS WebView. Your Next.js server must be reachable at the URL you configure (HTTPS in production).

## One-time setup

```bash
cd mobile
npm install
```

Set where the app should load from:

```bash
export CAPACITOR_SERVER_URL=https://your-domain.com
```

For **Android emulator** hitting dev on your PC:

```bash
export CAPACITOR_SERVER_URL=http://10.0.2.2:3000
```

Add platforms and open IDE:

```bash
npx cap add android
# optional: npx cap add ios   (macOS + Xcode only)
npx cap sync
npx cap open android
```

Build/run the project from Android Studio. For **Play Store**, use Android Studio: **Build → Generate Signed App Bundle**.

## After changing `capacitor.config.ts`

```bash
npx cap sync
```

## PWA (no store)

Users can also **Add to Home Screen** from Chrome/Safari on the live site; that uses `public/manifest.webmanifest` and `public/sw.js` from the main Next.js app.
