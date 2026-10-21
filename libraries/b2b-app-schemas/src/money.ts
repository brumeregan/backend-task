// Number of minor-unit digits per ISO 4217 currency (SEK/EUR/USD = 2, JPY = 0, ...).
export const currencyMinorDigits = (currency: string): number =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;

// Formats an integer amount in minor units, e.g. (1203, 'SEK') -> "12.03 SEK".
// Uses integer math only, so no floating point rounding can leak into the UI.
export const formatMoney = (amount: number, currency: string): string => {
  const digits = currencyMinorDigits(currency);
  const divisor = 10 ** digits;
  const abs = Math.abs(amount);
  const whole = Math.trunc(abs / divisor).toLocaleString('en-US');
  const fraction = digits > 0 ? `.${String(abs % divisor).padStart(digits, '0')}` : '';
  const sign = amount < 0 ? '-' : '';
  return `${sign}${whole}${fraction} ${currency}`;
};

export const toMoney = (amount: number, currency: string) => ({
  amount,
  currency,
  formattedAmount: formatMoney(amount, currency),
});
