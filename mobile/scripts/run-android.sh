#!/usr/bin/env bash
# Build + install app on USB device or emulator — no need to open Android Studio.
set -e
cd "$(dirname "$0")/.."

if [[ -z "${ANDROID_HOME:-}" && -d "${HOME}/Android/Sdk" ]]; then
  export ANDROID_HOME="${HOME}/Android/Sdk"
  export PATH="${PATH}:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator:${ANDROID_HOME}/cmdline-tools/latest/bin"
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install Android SDK (via Android Studio) and set ANDROID_HOME, e.g.:"
  echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
  echo "  export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
  exit 1
fi

if [[ "$(adb devices | grep -v '^List' | grep 'device$' | wc -l)" -eq 0 ]]; then
  echo "No device/emulator connected. Start an AVD (Android Studio → Device Manager) or plug in USB + enable USB debugging."
  echo "List targets:  npx cap run android --list"
  exit 1
fi

exec npx cap run android "$@"
