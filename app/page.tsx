import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import User from '@/models/User';
import { yearlyUsdFromMonthly } from '@/lib/planPricing';
import { getPlanRoll } from '@/lib/planLimits';
import { headers, cookies } from 'next/headers';
import HomeClient, { type MarketingPlan } from '@/components/HomeClient';


async function getPlans(): Promise<MarketingPlan[]> {
  await connectDB();
  const [dbPlans, discounts] = await Promise.all([
    Plan.find({ isActive: true }).sort({ priceMonthly: 1 }).lean(),
    import('@/models/PlanDiscount').then(m => m.default.find({
      startsAt: { $lte: new Date() },
      endsAt: { $gte: new Date() }
    }).lean())
  ]);

  return dbPlans.map((p: any) => {
    const priceMonth = p.priceMonthly;
    const priceYear = yearlyUsdFromMonthly(priceMonth, p.priceYearly);
    
    const d = discounts.find((disc: any) => disc.planId === p.planId || disc.planId === p._id.toString());

    return {
      planId: p.planId,
      name: p.name,
      popular: p.planId === 'pro',
      priceMonth,
      priceYear,
      description: p.description || '',
      features: p.features || [],
      discount: d ? {
        percentage: d.percentage,
        label: d.label,
      } : undefined
    };
  });
}

/** Home page should render even when Atlas is down or IP is not allowlisted */
async function getPlansSafe(): Promise<MarketingPlan[]> {
  try {
    return await getPlans();
  } catch (e) {
    console.error('[home] getPlans: database unavailable — showing empty pricing strip', e);
    return [];
  }
}

async function getUserData() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    const headerList = headers();
    const userId = headerList.get('x-user-id');
    if (userId) {
      return { planId: (headerList.get('x-user-subscription') || 'free') as any };
    }
    return { planId: null };
  }

  const { verifyToken } = await import('@/lib/auth-jwt');
  const jwtUser = await verifyToken(token);
  if (!jwtUser) return { planId: null };

  try {
    await connectDB();
    const user = await User.findById(jwtUser.id);
    if (!user) return { planId: null };

    const planId = user.role === 'super-admin' ? 'owner' : user.subscription || 'free';
    return { planId };
  } catch {
    return { planId: null };
  }
}

export default async function HomePage() {
  const [plans, { planId }] = await Promise.all([getPlansSafe(), getUserData()]);

  const planFeatures = planId ? getPlanRoll(planId) : null;

  return (
    <HomeClient 
      initialPlans={plans} 
      initialUserPlanId={planId} 
      features={planFeatures ? planFeatures.features : null} 
    />
  );
}
