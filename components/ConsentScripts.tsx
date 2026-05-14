'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/**
 * Consent-gated third-party scripts: Google Analytics 4 + Google AdSense.
 *
 * Compliance rules:
 *  - GA4 only loads when consent.analytics === true.
 *  - AdSense only loads when consent.marketing === true AND the current path
 *    is a public content page. AdSense Program Policy prohibits ads on
 *    login / signup / dashboard / admin / error / no-content pages.
 *
 * Reads from localStorage key "cookieConsent" written by CookieConsent.tsx,
 * and listens for the "cookieConsentChanged" event so it reacts the moment
 * the user makes a choice.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

// AdSense is allowed only on these top-level paths — public content pages
// with real publisher content. Everything else (auth, dashboard, admin,
// settings, error, payment) is excluded.
const ADSENSE_ALLOWED_PREFIXES = [
  '/',          // homepage — handled as exact match below
  '/blog',
  '/k/',
  '/tools',
  '/help',
  '/faq',
  '/about',
  '/contact',
  '/changelog',
  '/compare',
  '/trending',
  '/hashtags',
  '/posting-time',
  '/facebook-audit',
  '/viral-optimizer',
  '/thumbnail-generator',
  '/pricing',
  '/status',
];

function isAdSensePathAllowed(pathname: string): boolean {
  if (pathname === '/') return true;
  return ADSENSE_ALLOWED_PREFIXES.some(
    p => p !== '/' && (pathname === p || pathname.startsWith(p + '/')),
  );
}

function readConsent(): { analytics: boolean; marketing: boolean } {
  try {
    const raw = window.localStorage.getItem('cookieConsent');
    if (!raw) return { analytics: false, marketing: false };
    const parsed = JSON.parse(raw);
    return {
      analytics: parsed?.analytics === true,
      marketing: parsed?.marketing === true,
    };
  } catch {
    return { analytics: false, marketing: false };
  }
}

export default function ConsentScripts() {
  const [consent, setConsent] = useState({ analytics: false, marketing: false });
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setConsent(readConsent());
    setPathname(window.location.pathname);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cookieConsent') setConsent(readConsent());
    };
    const onConsent = () => setConsent(readConsent());
    const onRoute = () => setPathname(window.location.pathname);

    window.addEventListener('storage', onStorage);
    window.addEventListener('cookieConsentChanged', onConsent as EventListener);
    window.addEventListener('popstate', onRoute);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cookieConsentChanged', onConsent as EventListener);
      window.removeEventListener('popstate', onRoute);
    };
  }, []);

  const showGA = !!GA_ID && consent.analytics;
  const showAds = !!ADSENSE_ID && consent.marketing && pathname && isAdSensePathAllowed(pathname);

  return (
    <>
      {showGA && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
                send_page_view: true,
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
              });
            `}
          </Script>
        </>
      )}

      {showAds && (
        <Script
          id="adsense-init"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
