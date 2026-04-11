import type { Metadata, Viewport } from "next";

import "./globals.css";
import { LocaleProvider } from "@/context/LocaleContext";
import TrackingScript from "@/components/TrackingScript";
import PWARegister from "@/components/PWARegister";
import CookieConsent from "@/components/CookieConsent";



export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Vid YT - AI-Powered Video Analysis Platform",
  description: "Analyze and optimize your social media videos to predict viral potential",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vid YT",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/Logo.png',
    apple: '/Logo.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: "Vid YT - AI-Powered Video Analysis Platform",
    description: "Analyze and optimize your social media videos to predict viral potential",
    images: ['/Logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#0F0F0F] text-white">
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
