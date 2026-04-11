/**
 * Ad revenue estimation based on platform, niche, and views.
 * Data-backed by industry average RPM (Revenue Per Mille) values.
 */
export { PLAN_PRICES } from './planPricing';

export interface RevenueFactors {
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  niche: 'finance' | 'tech' | 'gaming' | 'lifestyle' | 'education' | 'entertainment';
  views: number;
  countryRegion?: 'US' | 'EU' | 'IN' | 'GLOBAL';
}

const RPM_DATA: Record<string, Record<string, number>> = {
  youtube: {
    finance: 15,
    tech: 10,
    education: 8,
    lifestyle: 5,
    gaming: 3,
    entertainment: 2,
  },
  facebook: {
    finance: 8,
    tech: 5,
    education: 4,
    lifestyle: 3,
    gaming: 1.5,
    entertainment: 1,
  },
  tiktok: {
    finance: 2,
    tech: 1.5,
    education: 1.2,
    lifestyle: 0.8,
    gaming: 0.5,
    entertainment: 0.3,
  },
  instagram: {
    finance: 5,
    tech: 4,
    education: 3,
    lifestyle: 6, // High for influencers
    gaming: 2,
    entertainment: 1.5,
  }
};

const REGION_MULTIPLIERS: Record<string, number> = {
  US: 1.5,
  EU: 1.2,
  IN: 0.6,
  GLOBAL: 1.0
};

export function estimateAdRevenue(factors: RevenueFactors): {
  estimatedRevenue: number;
  range: string;
  confidence: 'low' | 'medium' | 'high';
  rpmUsed: number;
} {
  const { platform, niche, views, countryRegion = 'GLOBAL' } = factors;
  
  const baseRpm = RPM_DATA[platform]?.[niche] || RPM_DATA.youtube.entertainment;
  const multiplier = REGION_MULTIPLIERS[countryRegion] || 1.0;
  
  const finalRpm = baseRpm * multiplier;
  const estimatedRevenue = (views / 1000) * finalRpm;
  
  const minRpm = finalRpm * 0.7;
  const maxRpm = finalRpm * 1.4;
  const minRev = (views / 1000) * minRpm;
  const maxRev = (views / 1000) * maxRpm;

  return {
    estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
    range: `$${minRev.toFixed(0)} - $${maxRev.toFixed(0)}`,
    confidence: views > 100000 ? 'high' : views > 10000 ? 'medium' : 'low',
    rpmUsed: finalRpm,
  };
}

export function calculateTotalRevenue(payments: any[]) {
    // Keep original subscription revenue logic for dashboard compatibility
    let total = 0;
    payments.forEach(p => { if (p.status === 'success') total += p.amount; });
    return { total };
}

export function estimateUserRevenue(planId: string | undefined, billingPeriod: string | undefined, status: string | undefined = 'active'): number {
  if (status !== 'active') return 0;
  const plan = String(planId || 'free').toLowerCase();
  const p = PLAN_PRICES[plan] || PLAN_PRICES.free;
  return billingPeriod === 'year' ? p.year : p.month;
}
