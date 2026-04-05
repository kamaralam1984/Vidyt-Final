'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PricingCard, { PricingPlan } from './PricingCard';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from '@/context/translations';
import { convertUsdToCurrency } from '@/lib/paymentCurrencyShared';

interface PricingSectionProps {
  plans: PricingPlan[];
  userPlanId?: string | null;
  loading?: string | null;
  onSubscribe?: (plan: PricingPlan) => void;
  onSubscribeStripe?: (plan: PricingPlan) => void;
  variant?: 'homepage' | 'full';
  fxRates?: Record<string, number> | null;
}

export default function PricingSection({
  plans,
  userPlanId,
  loading,
  onSubscribe,
  onSubscribeStripe,
  variant = 'full',
  fxRates: initialFxRates
}: PricingSectionProps) {
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const { locale } = useLocale();
  const { t } = useTranslations();

  const getPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 'Free';
    let base = billingPeriod === 'year' ? plan.priceYear : plan.price;
    
    // Apply discount ONLY for yearly billing if a discount exists
    if (billingPeriod === 'year' && plan.discount?.percentage) {
      base = base - (base * plan.discount.percentage) / 100;
    }

    const suffix = billingPeriod === 'year' ? '/year' : '/month';

    const format = (value: number) =>
      Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/\.00$/, '');

    // For homepage variant, we might not have fxRates passed properly or we want simple display
    if (!initialFxRates || locale.currency === 'USD') {
      return `$${format(base)}${suffix}`;
    }

    const baseConverted = convertUsdToCurrency(base, locale.currency, initialFxRates);
    return `${locale.currencySymbol}${format(baseConverted)}${suffix}`;
  };

  const getOriginalPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 'Free';
    const base = billingPeriod === 'year' ? plan.priceYear : plan.price;
    const suffix = billingPeriod === 'year' ? '/year' : '/month';

    const format = (value: number) =>
      Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/\.00$/, '');

    if (!initialFxRates || locale.currency === 'USD') {
      return `$${format(base)}${suffix}`;
    }

    const baseConverted = convertUsdToCurrency(base, locale.currency, initialFxRates);
    return `${locale.currencySymbol}${format(baseConverted)}${suffix}`;
  };

  const getSavings = (plan: PricingPlan) => {
    if (plan.price === 0 || billingPeriod === 'month') return null;
    const monthlyTotal = plan.price * 12;
    let yearlyPrice = plan.priceYear;
    
    // If there's a discount, savings are even higher
    if (plan.discount?.percentage) {
      yearlyPrice = yearlyPrice * (1 - plan.discount.percentage / 100);
    }
    
    const savings = (monthlyTotal - yearlyPrice) / monthlyTotal;
    return Math.round(savings * 100);
  };

  const filteredPlans = plans.filter(p => !userPlanId || (userPlanId === 'free' ? p.id !== 'free' : true));

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-4 mb-12"
      >
        <span className={`text-sm font-medium ${billingPeriod === 'month' ? 'text-white' : 'text-[#AAAAAA]'}`}>
          {t('pricing.toggle.monthly' as any) || 'Monthly'}
        </span>
        <button
          onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
          className="relative w-14 h-7 bg-[#212121] rounded-full p-1 transition-colors"
          aria-label="Toggle billing period"
        >
          <motion.div
            animate={{
              x: billingPeriod === 'year' ? 28 : 0,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-5 h-5 bg-[#FF0000] rounded-full absolute"
          />
        </button>
        <span className={`text-sm font-medium ${billingPeriod === 'year' ? 'text-white' : 'text-[#AAAAAA]'}`}>
          {t('pricing.toggle.yearly' as any) || 'Yearly'}
          {billingPeriod === 'year' && (
            <span className="ml-2 px-2 py-1 bg-[#FF0000]/20 text-[#FF0000] rounded text-xs">
              Save up to 17%
            </span>
          )}
        </span>
      </motion.div>

      {/* Plans Grid */}
      <div className={`grid grid-cols-1 ${variant === 'homepage' ? 'sm:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'} gap-8 max-w-7xl mx-auto`}>
        {filteredPlans.map((plan, index) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            billingPeriod={billingPeriod}
            isCurrentPlan={userPlanId === plan.id}
            onSubscribe={onSubscribe}
            onSubscribeStripe={onSubscribeStripe}
            loading={loading}
            getPrice={getPrice}
            getOriginalPrice={getOriginalPrice}
            getSavings={getSavings}
            index={index}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}
