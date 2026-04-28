import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import { unstable_cache } from 'next/cache';
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
      role: p.role,
      discount: d ? { percentage: d.percentage, label: d.label } : undefined,
    };
  });
}

// Cache plans for 5 minutes server-side — avoids DB hit on every homepage request
const getCachedPlans = unstable_cache(getPlans, ['homepage-plans'], { revalidate: 300 });

async function getPlansSafe(): Promise<MarketingPlan[]> {
  try {
    return await getCachedPlans();
  } catch (e) {
    console.error('[home] getPlans: database unavailable — showing empty pricing strip', e);
    return [];
  }
}

/** Read planId from JWT directly — no DB query needed on homepage */
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

  try {
    const { verifyToken } = await import('@/lib/auth-jwt');
    const jwtUser = await verifyToken(token);
    if (!jwtUser) return { planId: null };
    // Use JWT payload directly — subscription & role are embedded in the token
    const planId = (jwtUser as any).role === 'super-admin'
      ? 'owner'
      : (jwtUser as any).subscription || 'free';
    return { planId };
  } catch {
    return { planId: null };
  }
}

export default async function HomePage() {
  const [plans, { planId }] = await Promise.all([getPlansSafe(), getUserData()]);

  const planFeatures = planId ? getPlanRoll(planId) : null;

  return (
    <>
      <HomeClient
        initialPlans={plans}
        initialUserPlanId={planId}
        features={planFeatures ? planFeatures.features : null}
      />
      {/* Google OAuth verification — server-rendered so Googlebot sees Privacy/Terms in raw HTML */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 55,
        backgroundColor: 'rgba(10,10,10,0.96)',
        borderTop: '1px solid #222',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: '13px',
        color: '#888',
      }}>
        <span>Vidyt — AI-powered tools for content creators. Sign in with Google to get started.</span>
        <a href="/privacy-policy" style={{ color: '#00ffcc', fontWeight: 'bold', textDecoration: 'none' }}>Privacy Policy</a>
        <span style={{ color: '#444' }}>|</span>
        <a href="/terms" style={{ color: '#00ffcc', fontWeight: 'bold', textDecoration: 'none' }}>Terms of Service</a>
      </div>
    </>
  );
}
