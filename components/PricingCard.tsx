'use client';

import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Loader2 } from 'lucide-react';
import { PLAN_UI_METADATA, DEFAULT_PLAN_METADATA } from '@/constants/pricing';

export interface PricingPlan {
  id: string;
  dbId?: string;
  name: string;
  price: number;
  priceYear: number;
  description: string;
  features: string[];
  popular?: boolean;
  role?: string;
  level?: number;
  limitsDisplay?: {
    videos: string;
    analyses: string;
    storage: string;
    support: string;
  };
  discount?: {
    percentage: number;
    label: string;
    discountedPrice?: number;
  };
}

interface PricingCardProps {
  plan: PricingPlan;
  billingPeriod: 'month' | 'year';
  isCurrentPlan?: boolean;
  onSubscribe?: (plan: PricingPlan) => void;
  onSubscribePaypal?: (plan: PricingPlan) => void;
  loading?: string | null;
  getPrice: (plan: PricingPlan) => string;
  getOriginalPrice: (plan: PricingPlan) => string;
  getSavings: (plan: PricingPlan) => number | null;
  index: number;
  variant?: 'homepage' | 'full';
}

export default function PricingCard({
  plan,
  billingPeriod,
  isCurrentPlan,
  onSubscribe,
  onSubscribePaypal,
  loading,
  getPrice,
  getOriginalPrice,
  getSavings,
  index,
  variant = 'full'
}: PricingCardProps) {
  const metadata = PLAN_UI_METADATA[plan.id] || DEFAULT_PLAN_METADATA;
  const Icon = metadata.icon;
  const isPopular = plan.popular || metadata.popular;
  const savings = getSavings(plan);
  
  const payBusy = loading === `rzp:${plan.id}` || loading === `paypal:${plan.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      className={`relative ${isPopular ? 'md:-mt-4 md:mb-4' : ''}`}
    >
      {isPopular && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Star className="w-4 h-4 fill-white" />
            Most Popular
          </div>
        </motion.div>
      )}

      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className={`relative bg-[#181818] border-2 rounded-2xl p-8 h-full ${
          isPopular ? 'border-[#FF0000] shadow-2xl shadow-[#FF0000]/20' : 'border-[#212121] hover:border-[#333333]'
        } transition-all duration-300`}
      >
        {/* Plan Header */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: `${metadata.color}20` }}
          >
            <Icon className="w-8 h-8" style={{ color: metadata.color }} />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

          {/* Role Badge (Only in full variant or if explicitly requested) */}
          {plan.role && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: metadata.color }}
              >
                {plan.role.charAt(0).toUpperCase() + plan.role.slice(1)} Role
              </span>
              {plan.level && (
                <span className="text-xs text-[#AAAAAA] font-medium">
                  Level {plan.level}
                </span>
              )}
            </div>
          )}

          <p className="text-[#AAAAAA] text-sm mb-4 h-10 line-clamp-2">{plan.description}</p>
          <div className="mb-2 space-y-1">
            <div className="flex flex-col items-center gap-1">
              {(billingPeriod === 'year' && plan.discount?.percentage) && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-[#AAAAAA] line-through">
                    {getOriginalPrice(plan)}
                  </span>
                  <span className="bg-red-500/20 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {plan.discount.percentage}% OFF
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-white">
                  {getPrice(plan)}
                </span>
              </div>
              {plan.price > 0 && (
                <span className="text-[#AAAAAA] text-[10px] font-semibold uppercase tracking-wider block mt-1">
                  (Inclusive of GST)
                </span>
              )}
            </div>
            {savings ? (
              <span className="text-sm text-[#10b981] block">
                Save {savings}%
              </span>
            ) : <span className="h-5 block" />}
          </div>
        </div>

        {/* Features List */}
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, featureIndex) => (
            <motion.li
              key={featureIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index + 0.05 * featureIndex }}
              className="flex items-start gap-3"
            >
              <Check className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
              <span className="text-[#AAAAAA] text-sm line-clamp-2">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* Limits - only in full variant */}
        {variant === 'full' && plan.limitsDisplay && (
          <div className="border-t border-[#212121] pt-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#AAAAAA] mb-1">Videos</p>
                <p className="text-white font-semibold">{plan.limitsDisplay.videos}</p>
              </div>
              <div>
                <p className="text-[#AAAAAA] mb-1">Analyses</p>
                <p className="text-white font-semibold">{plan.limitsDisplay.analyses}</p>
              </div>
              <div>
                <p className="text-[#AAAAAA] mb-1">Storage</p>
                <p className="text-white font-semibold">{plan.limitsDisplay.storage}</p>
              </div>
              <div>
                <p className="text-[#AAAAAA] mb-1">Support</p>
                <p className="text-white font-semibold">{plan.limitsDisplay.support}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="mt-auto">
          {isCurrentPlan ? (
            <button
              disabled
              className="w-full py-3 px-6 bg-[#212121] text-[#AAAAAA] rounded-lg font-semibold cursor-not-allowed"
            >
              Current Plan
            </button>
          ) : (
            <div className="space-y-2 w-full">
              {variant === 'homepage' ? (
                <a
                  href="/register"
                  className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${
                    isPopular
                      ? 'bg-[#FF0000] text-white hover:bg-[#CC0000]'
                      : 'bg-[#212121] text-white hover:bg-[#333333]'
                  }`}
                >
                  Get Started
                </a>
              ) : (
                <>
                  <motion.button
                    type="button"
                    onClick={() => onSubscribe?.(plan)}
                    disabled={payBusy}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                      isPopular
                        ? 'bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:from-[#CC0000] hover:to-[#AA0000]'
                        : 'bg-[#212121] hover:bg-[#333333]'
                    } flex items-center justify-center gap-2`}
                  >
                    {loading === `rzp:${plan.id}` ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {plan.price === 0 ? 'Get Started' : 'Upgrade to unlock more features'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                  {plan.price > 0 && onSubscribePaypal && (
                    <motion.button
                      type="button"
                      onClick={() => onSubscribePaypal(plan)}
                      disabled={payBusy}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2.5 px-6 rounded-lg font-medium text-white border border-[#253b80] bg-[#0070ba]/20 hover:bg-[#0070ba]/40 flex items-center justify-center gap-2 text-sm"
                    >
                      {loading === `paypal:${plan.id}` ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Opening PayPal…
                        </>
                      ) : (
                        <>Pay with PayPal</>
                      )}
                    </motion.button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
