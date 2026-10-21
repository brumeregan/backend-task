import { toMoney } from '@qred/b2b-app-schemas';
import type { SpendLimit, SpendLimitPeriod, SpendLimitSource } from '@qred/b2b-app-schemas';

const DAY_MS = 24 * 60 * 60 * 1000;
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

export type BillingPeriod = {
  start: Date; // inclusive, 00:00 UTC
  endExclusive: Date; // start of the next billing period, 00:00 UTC
  startDate: string; // YYYY-MM-DD, first day
  endDate: string; // YYYY-MM-DD, last day (the day before the next billing day)
};

// DECISION: a monthly limit follows the account's billing cycle, not the calendar month.
// The period runs from the most recent billing day (inclusive) to the day before the next one,
// in UTC. billing_day is capped at 28 in the DB, so the day exists in every month.
// e.g. billingDay 25, now = Oct 20 -> Sep 25 .. Oct 24; now = Oct 25 -> Oct 25 .. Nov 24.
export const billingPeriod = (now: Date, billingDay: number): BillingPeriod => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startMonth = now.getUTCDate() >= billingDay ? month : month - 1;
  const start = new Date(Date.UTC(year, startMonth, billingDay));
  const endExclusive = new Date(Date.UTC(year, startMonth + 1, billingDay));

  return {
    start,
    endExclusive,
    startDate: dateOnly(start),
    endDate: dateOnly(new Date(endExclusive.getTime() - DAY_MS)),
  };
};

export type SpendLimitInput = {
  cardId: string;
  currency: string;
  source: SpendLimitSource;
  period: SpendLimitPeriod;
  billing: Pick<BillingPeriod, 'startDate' | 'endDate'> | null; // null for period=total
  limit: number; // minor units
  used: number; // minor units, within the period
  creditLimit: number;
  // Credit already occupied: unpaid invoices + unbilled pending/cleared transactions.
  committedCredit: number;
};

// Pure: no I/O, no clock. remaining = max(0, min(limit - used, creditAvailable)).
export const computeSpendLimit = (input: SpendLimitInput): SpendLimit => {
  const creditAvailable = input.creditLimit - input.committedCredit;
  const remaining = Math.max(0, Math.min(input.limit - input.used, creditAvailable));
  
  return {
    cardId: input.cardId,
    source: input.source,
    period: input.period,
    periodStart: input.billing?.startDate ?? null,
    periodEnd: input.billing?.endDate ?? null,
    limit: toMoney(input.limit, input.currency),
    used: toMoney(input.used, input.currency),
    remaining: toMoney(remaining, input.currency),
  };
};
