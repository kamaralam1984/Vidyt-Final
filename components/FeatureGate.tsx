'use client';

/**
 * FeatureGate — Monetization funnel component.
 *
 * Shows partial content, then blurs the rest and shows a
 * login/upgrade CTA. Works for any tool result list.
 *
 * Usage:
 *   <FeatureGate
 *     items={titles}            // full results array
 *     visibleCount={2}          // show first N for free
 *     isLoggedIn={!!user}
 *     isPro={user?.subscription !== 'free'}
 *     feature="AI Title Generator"
 *     onLoginClick={() => router.push('/auth')}
 *     onUpgradeClick={() => router.push('/pricing')}
 *   >
 *     {(item, i) => <TitleCard key={i} title={item} />}
 *   </FeatureGate>
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from './TrackingScript';

interface FeatureGateProps<T> {
  items: T[];
  /** How many items show without blur (default: 2) */
  visibleCount?: number;
  isLoggedIn: boolean;
  isPro: boolean;
  feature?: string;
  onLoginClick?: () => void;
  onUpgradeClick?: () => void;
  children: (item: T, index: number) => React.ReactNode;
  /** If true, gate is disabled — show everything (e.g. admin) */
  bypass?: boolean;
}

export default function FeatureGate<T>({
  items,
  visibleCount = 2,
  isLoggedIn,
  isPro,
  feature = 'this feature',
  onLoginClick,
  onUpgradeClick,
  children,
  bypass = false,
}: FeatureGateProps<T>) {
  const [revealed, setRevealed] = useState(false);
  const gateRef = useRef<HTMLDivElement>(null);
  const impressionFired = useRef(false);

  // Track gate impression once it enters viewport
  useEffect(() => {
    if (!hasLocked || impressionFired.current) return;
    const el = gateRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionFired.current) {
          impressionFired.current = true;
          trackEvent('feature_gate_impression', { feature, isLoggedIn, plan: isLoggedIn ? 'free' : 'anon' });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  });

  // If pro or bypass — show everything
  if (bypass || isPro) {
    return <>{items.map((item, i) => children(item, i))}</>;
  }

  const visible = items.slice(0, visibleCount);
  const locked = items.slice(visibleCount);
  const hasLocked = locked.length > 0;

  const handleLoginClick = () => {
    trackEvent('feature_gate_login_click', { feature, source: 'gate' });
    onLoginClick?.();
  };

  const handleUpgradeClick = () => {
    trackEvent('feature_gate_upgrade_click', { feature, source: 'gate' });
    onUpgradeClick?.();
  };

  return (
    <div className="space-y-3">
      {/* Free results */}
      {visible.map((item, i) => children(item, i))}

      {/* Locked results */}
      {hasLocked && (
        <div className="relative" ref={gateRef}>
          {/* Blurred preview */}
          <div className="select-none pointer-events-none" aria-hidden>
            <div className="blur-[6px] opacity-40 space-y-3">
              {locked.slice(0, 3).map((item, i) => children(item, visibleCount + i))}
            </div>
          </div>

          {/* Overlay CTA */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/80 to-transparent rounded-2xl px-6 py-8 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-[#FF0000]" />
              </div>

              <p className="text-white font-bold text-lg mb-1">
                {locked.length} more result{locked.length > 1 ? 's' : ''} locked
              </p>
              <p className="text-[#AAAAAA] text-sm mb-6 max-w-xs">
                {isLoggedIn
                  ? `Upgrade to Pro to unlock all results from ${feature}`
                  : `Sign in free to unlock all results from ${feature}`}
              </p>

              {isLoggedIn ? (
                // Logged in but free plan — upgrade
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUpgradeClick}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FF0000] text-white rounded-xl font-semibold text-sm hover:bg-[#CC0000] transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <Link
                    href="/pricing"
                    className="flex items-center gap-2 px-6 py-3 bg-[#181818] border border-[#333] text-white rounded-xl font-semibold text-sm hover:bg-[#212121] transition"
                  >
                    View Plans
                  </Link>
                </div>
              ) : (
                // Not logged in — sign up free
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLoginClick}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FF0000] text-white rounded-xl font-semibold text-sm hover:bg-[#CC0000] transition"
                  >
                    <Zap className="w-4 h-4" />
                    Sign up free — unlock all
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <button
                    onClick={handleLoginClick}
                    className="px-6 py-3 bg-[#181818] border border-[#333] text-[#AAAAAA] rounded-xl font-semibold text-sm hover:text-white hover:bg-[#212121] transition"
                  >
                    Already have an account?
                  </button>
                </div>
              )}

              {/* Trust line */}
              <p className="text-[#717171] text-xs mt-4">
                Free plan · No credit card · 5 analyses/month
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
