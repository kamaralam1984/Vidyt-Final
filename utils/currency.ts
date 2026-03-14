/**
 * Format amount with currency symbol/label based on currency code.
 * Used for display so user sees their country's currency (e.g. INR → ₹, USD → $).
 */
const CURRENCY_DISPLAY: Record<string, { symbol: string; locale?: string }> = {
  INR: { symbol: 'Rs-', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
};

export function formatAmount(amount: number, currencyCode: string = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
  const config = CURRENCY_DISPLAY[code] || { symbol: code + ' ', locale: 'en-IN' };
  const formatted = new Intl.NumberFormat(config.locale || 'en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${config.symbol}${formatted}`;
}

export function getCurrencySymbol(currencyCode: string = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
  return CURRENCY_DISPLAY[code]?.symbol ?? code + ' ';
}
