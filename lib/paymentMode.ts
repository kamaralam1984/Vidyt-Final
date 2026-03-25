/**
 * Classify payments for analytics: Razorpay test keys / mock / explicit demo flag
 * vs live (production) charges.
 */
export type PaymentKind = 'live' | 'demo_test';

export function razorpayKeyIsTest(): boolean {
  const key = process.env.RAZORPAY_KEY_ID || '';
  return key.startsWith('rzp_test');
}

/** Stored on Payment.metadata — use on verify + webhook writes */
export function buildRazorpayMetadata(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const testKey = razorpayKeyIsTest();
  const mock = process.env.RAZORPAY_MOCK === 'true';
  return {
    ...extra,
    paymentMode: testKey || mock ? 'test' : 'live',
    ...(mock ? { razorpayMock: true } : {}),
  };
}

export function paymentKindFromDoc(p: {
  metadata?: Record<string, unknown> | null;
  gateway?: string;
}): PaymentKind {
  const m = (p.metadata || {}) as Record<string, unknown>;
  if (m.demo === true || m.source === 'admin_demo') return 'demo_test';
  if (m.paymentMode === 'test' || m.razorpayMock === true) return 'demo_test';
  if (m.paymentMode === 'live') return 'live';
  // Legacy rows (no metadata): assume live real charges
  return 'live';
}

export function splitSuccessfulRevenueByKind(
  payments: Array<{
    amount: number;
    status: string;
    createdAt: Date;
    metadata?: Record<string, unknown> | null;
    gateway?: string;
  }>
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let liveMtd = 0;
  let demoMtd = 0;
  let liveToday = 0;
  let demoToday = 0;
  let liveAll = 0;
  let demoAll = 0;
  let liveCount = 0;
  let demoCount = 0;

  for (const p of payments) {
    if (p.status !== 'success') continue;
    const amt = Number(p.amount || 0);
    const kind = paymentKindFromDoc(p);
    const t = new Date(p.createdAt);
    if (kind === 'demo_test') {
      demoAll += amt;
      demoCount++;
      if (t >= startOfMonth) demoMtd += amt;
      if (t >= startOfToday) demoToday += amt;
    } else {
      liveAll += amt;
      liveCount++;
      if (t >= startOfMonth) liveMtd += amt;
      if (t >= startOfToday) liveToday += amt;
    }
  }

  return {
    live: { monthToDate: liveMtd, today: liveToday, allTime: liveAll, count: liveCount },
    demoTest: { monthToDate: demoMtd, today: demoToday, allTime: demoAll, count: demoCount },
  };
}
