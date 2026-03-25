#!/usr/bin/env bash
# Build + install app on USB device or emulator — no need to open Android Studio.
set -e
cd "$(dirname "$0")/.."

# Android Gradle needs a full JDK (includes jlink). JRE-only installs fail with:
#   jlink executable .../bin/jlink does not exist
ensure_jdk_with_jlink() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/jlink" ]]; then
    export PATH="${JAVA_HOME}/bin:${PATH}"
    return 0
  fi
  # Android Studio (Snap) ships a full JDK with jlink — no apt install needed
  for candidate in \
    /snap/android-studio/current/jbr \
    /usr/lib/jvm/java-17-openjdk-amd64 \
    /usr/lib/jvm/java-21-openjdk-amd64 \
    /usr/lib/jvm/java-1.17.0-openjdk-amd64 \
    /usr/lib/jvm/java-1.21.0-openjdk-amd64; do
    if [[ -x "${candidate}/bin/jlink" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="${JAVA_HOME}/bin:${PATH}"
      return 0
    fi
  done
  echo "Gradle needs a full JDK (with \`jlink\`). OpenJDK JRE-only packages do not include it."
  echo ""
  echo "Ubuntu / Debian:"
  echo "  sudo apt install openjdk-17-jdk"
  echo "  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
  echo ""
  echo "Optional: add to ~/.bashrc, or set org.gradle.java.home in mobile/android/gradle.properties"
  exit 1
}
ensure_jdk_with_jlink

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
