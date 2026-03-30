import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/context/LocaleContext";
import TrackingScript from "@/components/TrackingScript";
import PWARegister from "@/components/PWARegister";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "ViralBoost AI - AI-Powered Video Analysis Platform",
  description: "Analyze and optimize your social media videos to predict viral potential",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ViralBoost AI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: "ViralBoost AI - AI-Powered Video Analysis Platform",
    description: "Analyze and optimize your social media videos to predict viral potential",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LocaleProvider>
          <PWARegister />
          <TrackingScript />
          <CookieConsent />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
