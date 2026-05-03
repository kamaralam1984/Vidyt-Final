import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import Script from "next/script";

import "./globals.css";
import { LocaleProvider } from "@/context/LocaleContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

// Defer non-critical client components — keep them out of the critical JS path
const TrackingScript = dynamic(() => import("@/components/TrackingScript"), { ssr: false });
const PWARegister = dynamic(() => import("@/components/PWARegister"), { ssr: false });
const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });
const LangDirectionSetter = dynamic(() => import("@/components/LangDirectionSetter"), { ssr: false });
const CountrySelectPopup = dynamic(() => import("@/components/CountrySelectPopup"), { ssr: false });
const MobileAppDownloadBar = dynamic(() => import("@/components/MobileAppDownloadBar"), { ssr: false });
const SiteAnnouncementBanner = dynamic(() => import("@/components/SiteAnnouncementBanner"), { ssr: false });

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "VidYT - AI-Powered Video SEO & Growth Platform",
    template: "%s | VidYT",
  },
  description: "Grow your YouTube channel with AI-powered SEO tools. Generate viral titles, thumbnails, hashtags & scripts. Trusted by 10,000+ creators.",
  keywords: ["youtube seo", "viral video", "youtube title generator", "hashtag generator", "thumbnail generator", "youtube growth", "video optimization", "ai seo tools", "youtube shorts", "content creator tools"],
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.vidyt.com"),
  alternates: {
    canonical: "/",
    // hreflang — tells Google which URL to serve per region/language.
    // x-default points to the global English version.
    languages: {
      'en': 'https://www.vidyt.com/',
      'en-US': 'https://www.vidyt.com/',
      'en-IN': 'https://www.vidyt.com/',
      'hi-IN': 'https://www.vidyt.com/',
      'x-default': 'https://www.vidyt.com/',
    },
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
    icon: '/Logo.webp',
    apple: '/Logo.webp',
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
    title: "VidYT - AI-Powered Video SEO & Growth Platform",
    description: "Grow your YouTube channel with AI-powered SEO tools. Trusted by 10,000+ creators.",
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'VidYT - AI Video Optimization Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vid YT - AI-Powered Video SEO Platform",
    description: "Grow your YouTube channel with AI. Generate viral titles, thumbnails, hashtags & scripts.",
    images: ['/og-image.png'],
  },
};

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VidYT",
  "alternateName": "Vid YT",
  "url": "https://www.vidyt.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.vidyt.com/Logo.webp",
    "width": 512,
    "height": 512,
  },
  "description": "AI-powered YouTube SEO & video optimization platform trusted by 10,000+ creators.",
  "foundingDate": "2024",
  "sameAs": [
    "https://www.youtube.com/@vidyt",
    "https://twitter.com/vidytcom",
    "https://www.instagram.com/vidyt",
    "https://www.linkedin.com/company/vidyt",
    "https://www.facebook.com/vidyt",
  ],
  "contactPoint": [{
    "@type": "ContactPoint",
    "contactType": "customer support",
    "url": "https://www.vidyt.com/contact",
    "availableLanguage": ["English", "Hindi"],
  }],
};

// WebSite schema with SearchAction — Google uses this to display a
// site-search box (sitelinks searchbox) directly under your SERP listing.
// The query target points at /trending which already accepts ?q= filtering.
const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "VidYT",
  "alternateName": "Vid YT",
  "url": "https://www.vidyt.com",
  "inLanguage": ["en", "en-IN", "hi-IN"],
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.vidyt.com/trending?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const SOFTWARE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VidYT",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://www.vidyt.com",
  "description": "Grow your YouTube channel with AI-powered SEO tools. Generate viral titles, thumbnails, hashtags, and scripts.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Early SW reconciliation + ChunkLoadError recovery — runs before any
            JS chunk loads. Forces registration.update() so users upgrading from
            an older sw.js drop that controller (one reload on controllerchange
            lands them on the no-op v4 worker). Also catches ChunkLoadError
            (a stale SW intercepting a subresource request can surface as
            webpack "Loading chunk X failed"): nukes all SW registrations and
            caches once per tab session, then hard-reloads. Must stay inline. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(!('serviceWorker' in navigator))return;var h=!!navigator.serviceWorker.controller,r=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(!h||r)return;r=true;location.reload();});navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(x){try{x.update()}catch(e){}});}).catch(function(){});var SS=window.sessionStorage;function recover(err){var n=(err&&err.name)||'';var m=((err&&err.message)||err||'')+'';if(n!=='ChunkLoadError'&&!/Loading chunk [^ ]+ failed|ChunkLoadError/i.test(m))return;try{if(SS.getItem('__vidyt_chunk_recovered'))return;SS.setItem('__vidyt_chunk_recovered','1');}catch(e){}Promise.all([navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(x){return x.unregister();}));}).catch(function(){}),(window.caches&&caches.keys)?caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k);}));}).catch(function(){}):Promise.resolve()]).then(function(){location.reload();}).catch(function(){location.reload();});}window.addEventListener('error',function(e){recover(e&&e.error||e);});window.addEventListener('unhandledrejection',function(e){recover(e&&e.reason||e);});}catch(e){}})();",
          }}
        />
        {/* Preconnect to critical origins — reduces DNS + TLS handshake time */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://static.cloudflareinsights.com" />
        <link rel="dns-prefetch" href="https://cdn.razorpay.com" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_SCHEMA) }}
        />
      </head>
      <body className="font-inter antialiased" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {/* Google Analytics 4 — afterInteractive so it never blocks FCP */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                  send_page_view: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `}
            </Script>
          </>
        )}
        {/* Google AdSense — lazyOnload so it never blocks LCP/TBT */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            id="adsense-init"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}
        <ThemeProvider>
          <LocaleProvider>
            <LangDirectionSetter />
            <PWARegister />
            <TrackingScript />
            <CookieConsent />
            <CountrySelectPopup />
            <SiteAnnouncementBanner />
            {children}
            <MobileAppDownloadBar />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
