export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache (lasts for the lifetime of the serverless function warm instance)
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();

    // Return cached rates if fresh
    if (cachedRates && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        base: 'USD',
        rates: cachedRates,
        cached: true,
        timestamp: new Date(cacheTimestamp).toISOString(),
      });
    }

    // Fetch fresh rates from exchangerate-api
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 }, // Next.js ISR cache
    });

    if (!response.ok) {
      throw new Error(`Exchange rate API responded with ${response.status}`);
    }

    const data = await response.json();

    // Cache the result
    cachedRates = data.rates;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      base: 'USD',
      rates: data.rates,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Currency rates error:', error.message);

    // Fallback rates (approximate) if the external API fails
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
      cached: false,
      fallback: true,
      timestamp: new Date().toISOString(),
    });
  }
}
