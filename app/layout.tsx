import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";

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
const RetargetingPixels = dynamic(() => import("@/components/RetargetingPixels"), { ssr: false });
const ConsentScripts = dynamic(() => import("@/components/ConsentScripts"), { ssr: false });

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ── Maintenance gate ──────────────────────────────────────────────────
  // Wrapped in one outer try/catch so a broken dynamic import / mongoose
  // hiccup / cookies() edge case can never 502 the homepage. If anything
  // throws, we fail OPEN (render the site as normal).
  let maintenanceLock = false;
  try {
    const { headers, cookies } = await import('next/headers');
    const { getSiteSettings } = await import('@/lib/getSiteSettings');

    const hdr = headers();
    const pathname = hdr.get('x-vidyt-pathname') || '';
    const isWhitelisted =
      pathname === '/maintenance' ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/auth') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml';

    if (!isWhitelisted) {
      const settings = await getSiteSettings().catch(() => null);
      if (settings?.maintenanceMode) {
        let isSuper = false;
        try {
          const token = cookies().get('token')?.value;
          if (token) {
            const { verifyToken } = await import('@/lib/auth-jwt');
            const payload: any = await verifyToken(token).catch(() => null);
            isSuper = payload?.role === 'super-admin' || payload?.role === 'superadmin';
          }
        } catch {
          /* cookie/JWT issue — treat as not super-admin, fall through to lock */
        }
        if (!isSuper) maintenanceLock = true;
      }
    }
  } catch (e) {
    // Any unexpected error in the gate → log + fail open. Site stays up.
    try { console.error('[RootLayout maintenance gate]', e); } catch {}
    maintenanceLock = false;
  }

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* No-flash theme bootstrap — must run before paint so the correct
            data-theme is on <html> before any CSS evaluates. Without this we
            get a brief flash of dark theme on light/colorblind users' page
            loads. ThemeContext.tsx then takes over and keeps it in sync. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('vidyt_theme');if(t!=='light'&&t!=='dark'&&t!=='colorblind')t='dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=(t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();",
          }}
        />
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
        {/* Analytics + AdSense — consent-gated; AdSense restricted to public content pages */}
        <ConsentScripts />
        {/* Retargeting Pixels — consent-gated; skipped on auth/admin/dashboard paths */}
        <RetargetingPixels />
        {maintenanceLock ? (
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0F0F0F',
              color: '#fff',
              padding: '32px',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
              <div style={{ fontSize: 48, marginBottom: 24, lineHeight: 1 }} aria-hidden>
                🛠️
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
                We&apos;ll be right back
              </h1>
              <p style={{ color: '#9CA3AF', lineHeight: 1.6, fontSize: 16 }}>
                Vidyt is undergoing scheduled maintenance. Please check back in a few minutes.
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </body>
    </html>
  );
}
