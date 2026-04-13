import type { Metadata, Viewport } from "next";

import "./globals.css";
import { LocaleProvider } from "@/context/LocaleContext";
import TrackingScript from "@/components/TrackingScript";
import PWARegister from "@/components/PWARegister";
import CookieConsent from "@/components/CookieConsent";
import LangDirectionSetter from "@/components/LangDirectionSetter";
import CountrySelectPopup from "@/components/CountrySelectPopup";
import { ThemeProvider } from "@/context/ThemeContext";



export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Vid YT - #1 AI-Powered Video SEO & Viral Optimization Platform",
    template: "%s | VidYT",
  },
  description: "Grow your YouTube, Instagram, TikTok & Facebook with AI-powered SEO tools. Generate viral titles, thumbnails, hashtags, scripts, and optimize CTR to 11.8%+. Trusted by 10,000+ creators.",
  keywords: ["youtube seo", "viral video", "youtube title generator", "hashtag generator", "thumbnail generator", "youtube growth", "video optimization", "ai seo tools", "youtube shorts", "content creator tools"],
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vidyt.com"),
  alternates: {
    canonical: "/",
  },
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'VidYT',
    title: "Vid YT - #1 AI-Powered Video SEO & Viral Optimization Platform",
    description: "Grow your YouTube, Instagram, TikTok & Facebook with AI-powered SEO tools. Trusted by 10,000+ creators.",
    images: [{
      url: '/Logo.png',
      width: 1200,
      height: 630,
      alt: 'VidYT - AI Video Optimization Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vid YT - AI-Powered Video SEO Platform",
    description: "Grow your YouTube channel with AI. Generate viral titles, thumbnails, hashtags & scripts.",
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
      <head>
        {/* Google AdSense — replace ca-pub-XXXXXXXXXX with your real AdSense publisher ID */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="font-sans antialiased" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <LocaleProvider>
            <LangDirectionSetter />
            <PWARegister />
            <TrackingScript />
            <CookieConsent />
            <CountrySelectPopup />
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
