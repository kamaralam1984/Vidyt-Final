import { getUsdRates } from '@/lib/currencyRates';
import {
  convertUsdToCurrency,
  resolveCheckoutCurrency,
  toRazorpaySmallestUnit,
} from '@/lib/paymentCurrencyShared';

export * from '@/lib/paymentCurrencyShared';

export async function buildRazorpayOrderFromUsd(
  amountUsd: number,
  preferredCurrency: string
): Promise<{
  amountMinor: number;
  currency: string;
  convertedMajor: number;
  rates: Record<string, number>;
}> {
  const rates = await getUsdRates();
  const currency = resolveCheckoutCurrency(preferredCurrency, rates);
  const convertedMajor = convertUsdToCurrency(amountUsd, currency, rates);
  const amountMinor = toRazorpaySmallestUnit(convertedMajor, currency);
  return { amountMinor, currency, convertedMajor, rates };
}
