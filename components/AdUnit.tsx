'use client';

import { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
}

/**
 * Google AdSense Ad Unit Component
 * Usage: <AdUnit slot="1234567890" format="auto" />
 *
 * Set NEXT_PUBLIC_ADSENSE_ID in .env.local:
 * NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXX
 */
export default function AdUnit({ slot, format = 'auto', responsive = true, className = '' }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ADSENSE_ID) return;
    if (pushed.current) return;

    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      // AdSense not loaded yet — ignore
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_ADSENSE_ID) return null;

  return (
    <div className={`ad-container overflow-hidden ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
