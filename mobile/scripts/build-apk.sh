#!/usr/bin/env bash
# Build a debug APK for VidYT without Android Studio.
# Output: mobile/android/app/build/outputs/apk/debug/app-debug.apk
set -e
cd "$(dirname "$0")/.."

# ── Java: need full JDK with jlink ────────────────────────────────────────────
ensure_jdk_with_jlink() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/jlink" ]]; then
    export PATH="${JAVA_HOME}/bin:${PATH}"
    return 0
  fi
  for candidate in \
    /snap/android-studio/current/jbr \
    /usr/lib/jvm/java-17-openjdk-amd64 \
    /usr/lib/jvm/java-21-openjdk-amd64 \
    /usr/lib/jvm/java-1.17.0-openjdk-amd64 \
    /usr/lib/jvm/java-1.21.0-openjdk-amd64; do
    if [[ -x "${candidate}/bin/jlink" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="${JAVA_HOME}/bin:${PATH}"
      echo "Using JDK: $JAVA_HOME"
      return 0
    fi
  done
  echo ""
  echo "ERROR: Full JDK (with jlink) not found. Install it:"
  echo "  sudo apt install openjdk-17-jdk"
  echo ""
  exit 1
}
ensure_jdk_with_jlink

# ── Android SDK ───────────────────────────────────────────────────────────────
if [[ -z "${ANDROID_HOME:-}" ]]; then
  if [[ -d "${HOME}/Android/Sdk" ]]; then
    export ANDROID_HOME="${HOME}/Android/Sdk"
  elif [[ -d "/opt/android-sdk" ]]; then
    export ANDROID_HOME="/opt/android-sdk"
  else
    echo "ERROR: ANDROID_HOME not set and SDK not found at ~/Android/Sdk"
    exit 1
  fi
fi
export PATH="${PATH}:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator:${ANDROID_HOME}/cmdline-tools/latest/bin"
echo "Using Android SDK: $ANDROID_HOME"

# ── Sync Capacitor assets ─────────────────────────────────────────────────────
echo ""
echo "Syncing Capacitor..."
npx cap sync android

# ── Gradle build ─────────────────────────────────────────────────────────────
echo ""
echo "Building debug APK..."
cd android
./gradlew assembleDebug

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [[ -f "$APK_PATH" ]]; then
  echo ""
  echo "✅ APK built successfully!"
  echo "   Location: $(pwd)/$APK_PATH"
  echo ""
  echo "Install on connected device:"
  echo "   adb install $APK_PATH"
else
  echo "❌ APK build failed — check Gradle output above."
  exit 1
fi
