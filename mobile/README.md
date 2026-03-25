# ViralBoost AI — native shell (Capacitor)

This folder wraps your **deployed website** in an Android/iOS WebView. Your Next.js server must be reachable at the URL you configure (HTTPS in production).

## Run app from terminal (no Android Studio window needed)

1. **Emulator chalao** (Android Studio → Device Manager → Play) **ya** phone USB + USB debugging.
2. Repo se:

```bash
cd mobile
npm run run:android
```

Ya root se: `npm run mobile:run:android`

Kaunsa emulator/device: `npm run run:android:list` phir:

```bash
npx cap run android --target Medium_Phone_API_36.1
```

(Target naam tumhare PC par list se aayega.)

**Pehli baar:** `ANDROID_HOME` set karo agar `adb` nahi milta:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Build error: `jlink ... does not exist`

Gradle ko **poora JDK** chahiye. Agar sirf **JRE** hai (`openjdk-21-jre`) to yeh error aata hai.

```bash
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

Phir `npm run run:android` dubara. Optional: `mobile/android/gradle.properties` mein uncomment karke `org.gradle.java.home=...` set karo.

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
# or from this folder: npm run mobile:android   (same as open:android)
```

From **repo root** (parent folder), use: `npm run mobile:android` (runs `cd mobile && npx cap open android`).

Build/run the project from Android Studio. For **Play Store**, use Android Studio: **Build → Generate Signed App Bundle**.

### “Unable to launch Android Studio” (Linux)

Capacitor defaults to `/usr/local/android-studio/bin/studio.sh`. If you use **Snap**:

```bash
export CAPACITOR_ANDROID_STUDIO_PATH=/snap/android-studio/current/bin/studio.sh
npm run mobile:android
```

The `npm run open:android` / `mobile:android` scripts also try that path automatically via `scripts/open-android-studio.sh`.

**Without fixing the path:** open Android Studio manually → **File → Open** → choose this repo’s **`mobile/android`** folder.

**CLI only (no IDE):** install Android SDK + `ANDROID_HOME`, then from `mobile/android` run `./gradlew assembleDebug` (APK under `app/build/outputs/apk/debug/`).

## After changing `capacitor.config.ts`

```bash
npx cap sync
```

## PWA (no store)

Users can also **Add to Home Screen** from Chrome/Safari on the live site; that uses `public/manifest.webmanifest` and `public/sw.js` from the main Next.js app.
