/**
 * USD-based FX rates (exchangerate-api). Shared by /api/public/currency-rates and payment routes.
 */

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getUsdRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRates;
  }

  if (process.env.NODE_ENV === 'test') {
    // Deterministic rates for unit/integration tests: avoid network.
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
    cachedRates = fallbackRates;
    cacheTimestamp = now;
    return fallbackRates;
  }

  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    cachedRates = data.rates as Record<string, number>;
    cacheTimestamp = now;
    return cachedRates;
  } catch (e) {
    console.error('getUsdRates:', e);
    const fallback: Record<string, number> = {
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
    return fallback;
  }
}
