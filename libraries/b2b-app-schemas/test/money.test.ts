import { describe, expect, it } from 'vitest';
import { formatMoney, toMoney } from '../src/money';

describe('formatMoney', () => {
  it('formats minor units with two decimals', () => {
    expect(formatMoney(1203, 'SEK')).toBe('12.03 SEK');
    expect(formatMoney(5, 'EUR')).toBe('0.05 EUR');
    expect(formatMoney(0, 'SEK')).toBe('0.00 SEK');
  });

  it('groups thousands and keeps the sign', () => {
    expect(formatMoney(1250000, 'SEK')).toBe('12,500.00 SEK');
    expect(formatMoney(-34900, 'SEK')).toBe('-349.00 SEK');
  });

  it('handles zero-decimal currencies', () => {
    expect(formatMoney(1500, 'JPY')).toBe('1,500 JPY');
  });

  it('builds a Money object', () => {
    expect(toMoney(1203, 'SEK')).toEqual({ 
      amount: 1203, 
      currency: 'SEK', 
      formattedAmount: '12.03 SEK' 
    });
  });
});
