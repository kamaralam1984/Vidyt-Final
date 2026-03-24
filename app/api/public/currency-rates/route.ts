export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUsdRates } from '@/lib/currencyRates';

export async function GET(_request: NextRequest) {
  try {
    const rates = await getUsdRates();
    return NextResponse.json({
      success: true,
      base: 'USD',
      rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Currency rates error:', error?.message);
    const fallbackRates: Record<string, number> = {
      USD: 1,
      INR: 83.5,
      EUR: 0.92,
      GBP: 0.79,
      AUD: 1.54,
      CAD: 1.36,
      SGD: 1.34,
      AED: 3.67,
      JPY: 149.5,
      BRL: 4.97,
      MXN: 17.1,
    };
    return NextResponse.json({
      success: true,
      base: 'USD',
      rates: fallbackRates,
      fallback: true,
      timestamp: new Date().toISOString(),
    });
  }
}
