'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
    __turnstileOnload?: () => void;
  }
}

interface Props {
  onToken: (token: string) => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  action?: string;
}

/**
 * Cloudflare Turnstile widget.
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset so local dev keeps working.
 */
export default function TurnstileWidget({ onToken, onError, theme = 'dark', action }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    const render = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        action,
        callback: (token: string) => onToken(token),
        'error-callback': () => onError?.(),
        'expired-callback': () => onError?.(),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      window.__turnstileOnload = render;
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, action, onToken, onError]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileOnload&render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}
