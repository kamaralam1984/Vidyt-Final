#!/usr/bin/env bash
# Capacitor looks for Android Studio in a few fixed paths; snap/Toolbox installs need this.
set -e
if [[ -z "${CAPACITOR_ANDROID_STUDIO_PATH:-}" ]]; then
  if [[ -x "/snap/android-studio/current/bin/studio.sh" ]]; then
    export CAPACITOR_ANDROID_STUDIO_PATH="/snap/android-studio/current/bin/studio.sh"
  elif [[ -x "${HOME}/android-studio/bin/studio.sh" ]]; then
    export CAPACITOR_ANDROID_STUDIO_PATH="${HOME}/android-studio/bin/studio.sh"
  elif [[ -x "/opt/android-studio/bin/studio.sh" ]]; then
    export CAPACITOR_ANDROID_STUDIO_PATH="/opt/android-studio/bin/studio.sh"
  fi
fi
exec npx cap open android
