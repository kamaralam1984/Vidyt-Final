import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Loads your live Next.js site inside the native WebView.
 * Set CAPACITOR_SERVER_URL before sync/build (production HTTPS URL recommended).
 *
 * Local Android emulator: http://10.0.2.2:3000
 * Local device (same Wi‑Fi): http://YOUR_PC_LAN_IP:3000
 */
/** Override when syncing: `CAPACITOR_SERVER_URL=https://yourdomain.com npx cap sync` */
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000';

const config: CapacitorConfig = {
  appId: 'com.viralboostai.app',
  appName: 'ViralBoost AI',
  webDir: 'www',
  server: {
    url: serverUrl.replace(/\/$/, ''),
    androidScheme: 'https',
    cleartext: serverUrl.startsWith('http://'),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F0F0F',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F0F0F',
    },
  },
};

export default config;
