/**
 * Per-user revenue calculation logic.
 * Looks at a user's subscription plan and billing period to compute estimated earnings.
 */

export const PLAN_PRICES: Record<string, { month: number; year: number; currency: string }> = {
  free: { month: 0, year: 0, currency: 'INR' },
  starter: { month: 499, year: 4999, currency: 'INR' },
  pro: { month: 999, year: 9999, currency: 'INR' },
  enterprise: { month: 2999, year: 29999, currency: 'INR' },
  custom: { month: 4999, year: 49999, currency: 'INR' },
  owner: { month: 0, year: 0, currency: 'INR' },
};

export interface UserRevenueEstimate {
  daily: number;
  weekly: number;
  monthly: number;
  currency: string;
}

export function estimateUserRevenue(
  plan: string,
  billingPeriod: 'month' | 'year' = 'month',
  subscriptionStatus?: string
): UserRevenueEstimate {
  if (!plan || plan === 'free' || plan === 'owner' || subscriptionStatus === 'cancelled') {
    return { daily: 0, weekly: 0, monthly: 0, currency: 'INR' };
  }

  const planData = PLAN_PRICES[plan] || PLAN_PRICES.free;
  const monthlyAmount = billingPeriod === 'year'
    ? Math.round(planData.year / 12)
    : planData.month;

  return {
    daily: Math.round((monthlyAmount / 30) * 100) / 100,
    weekly: Math.round((monthlyAmount / 4.33) * 100) / 100,
    monthly: monthlyAmount,
    currency: planData.currency,
  };
}

export function calculateTotalRevenue(payments: Array<{ amount: number; status: string; createdAt: Date }>) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let daily = 0, yesterday = 0, weekly = 0, monthly = 0, total = 0;
  let success = 0, failed = 0, pending = 0;

  for (const p of payments) {
    if (p.status !== 'success') {
      if (p.status === 'failed') failed++;
      else if (p.status === 'pending') pending++;
      continue;
    }
    success++;
    total += p.amount;
    const t = new Date(p.createdAt);
    if (t >= startOfToday) daily += p.amount;
    else if (t >= startOfYesterday) yesterday += p.amount;
    
    if (t >= startOfWeek) weekly += p.amount;
    if (t >= startOfMonth) monthly += p.amount;
  }

  return { daily, yesterday, weekly, monthly, total, success, failed, pending };
}
