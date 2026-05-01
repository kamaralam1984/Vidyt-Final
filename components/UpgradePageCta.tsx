'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Lock } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

type Variant = 'hero' | 'inline' | 'final';

interface Props {
  toolTitle: string;
  toolHref: string;
  featureFlag: string;
  gradient: string;
  variant?: Variant;
}

/**
 * Plan-aware CTA pair for /upgrade/[slug] pages.
 *
 * - User has access (plan.features[flag] truthy) → primary "Open {Tool}" → toolHref
 * - User logged in but no access → primary "Upgrade to Pro" → /pricing
 * - Anonymous → primary "Upgrade to Pro" → /pricing (signup happens during checkout)
 */
export default function UpgradePageCta({
  toolTitle,
  toolHref,
  featureFlag,
  gradient,
  variant = 'hero',
}: Props) {
  const { authenticated, plan } = useUser();
  const hasAccess =
    authenticated && plan && featureFlag
      ? !!((plan.features || {}) as unknown as Record<string, unknown>)[featureFlag]
      : false;

  const baseBtn =
    'inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition hover:scale-[1.02]';
  const primaryShadow =
    variant === 'final'
      ? 'shadow-[0_0_40px_rgba(239,68,68,0.5)]'
      : 'shadow-[0_0_30px_rgba(239,68,68,0.4)]';

  if (hasAccess) {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={toolHref}
          className={`${baseBtn} bg-gradient-to-r ${gradient} text-white shadow-2xl`}
        >
          <Sparkles className="h-5 w-5" /> Open {toolTitle}{' '}
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          href="/dashboard"
          className={`${baseBtn} border border-white/15 bg-white/5 text-white hover:bg-white/10`}
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Link
        href="/pricing"
        className={`${baseBtn} bg-[#FF0000] text-white hover:bg-[#CC0000] ${primaryShadow}`}
      >
        {variant === 'hero' && <Lock className="h-5 w-5" />}
        Upgrade to Pro <ArrowRight className="h-5 w-5" />
      </Link>
      <Link
        href="/pricing#compare"
        className={`${baseBtn} border border-white/15 bg-white/5 text-white hover:bg-white/10`}
      >
        Compare Plans
      </Link>
    </div>
  );
}
