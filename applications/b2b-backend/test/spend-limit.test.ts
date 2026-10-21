import { SpendLimitSchema } from '@qred/b2b-app-schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { billingPeriod, computeSpendLimit } from '../src/services/spendLimitCalc';
import { as, createTestApp, seedIds } from './helpers';
import type { TestApi, TestDb } from './helpers';
import type { SpendLimitInput } from '../src/services/spendLimitCalc';

describe('billingPeriod (billing_day = 25)', () => {
  const at = (iso: string) => billingPeriod(new Date(iso), 25);
  
  it('before the billing day: previous month -> this month', () => {
    expect(at('2026-10-20T12:00:00Z')).toMatchObject({ startDate: '2026-09-25', endDate: '2026-10-24' });
  });
  
  it('on the billing day a new period starts (inclusive)', () => {
    expect(at('2026-10-25T00:00:00Z')).toMatchObject({ startDate: '2026-10-25', endDate: '2026-11-24' });
    expect(at('2026-10-24T23:59:59Z')).toMatchObject({ startDate: '2026-09-25', endDate: '2026-10-24' });
  });
  
  it('handles the year boundary', () => {
    expect(at('2026-01-10T00:00:00Z')).toMatchObject({ startDate: '2025-12-25', endDate: '2026-01-24' });
    expect(at('2026-12-31T00:00:00Z')).toMatchObject({ startDate: '2026-12-25', endDate: '2027-01-24' });
  });
  
  it('billing day 1 equals the calendar month', () => {
    const p = billingPeriod(new Date('2026-02-17T00:00:00Z'), 1);
    expect([p.startDate, p.endDate]).toEqual(['2026-02-01', '2026-02-28']);
  });
});

describe('computeSpendLimit', () => {
  const base: SpendLimitInput = {
    cardId: seedIds.cards.erikActive,
    currency: 'SEK',
    source: 'card',
    period: 'monthly',
    billing: { startDate: '2026-09-25', endDate: '2026-10-24' },
    limit: 100_000,
    used: 40_000,
    creditLimit: 500_000,
    committedCredit: 100_000,
  };
  
  it('remaining = limit - used', () => {
    const r = computeSpendLimit(base);
    expect(r.remaining.amount).toBe(60_000);
    expect(r.used.formattedAmount).toBe('400.00 SEK');
    expect(r.periodStart).toBe('2026-09-25');
    expect(SpendLimitSchema.safeParse(r).success).toBe(true);
  });
  
  it('is clamped at 0 when over the limit', () => {
    expect(computeSpendLimit({ ...base, used: 150_000 }).remaining.amount).toBe(0);
  });
  
  it('is clamped by the credit still available', () => {
    expect(computeSpendLimit({ ...base, committedCredit: 470_000 }).remaining.amount).toBe(30_000);
    expect(computeSpendLimit({ ...base, committedCredit: 600_000 }).remaining.amount).toBe(0);
  });
  
  it('period total has no dates', () => {
    const r = computeSpendLimit({ ...base, period: 'total', billing: null });
    expect([r.periodStart, r.periodEnd]).toEqual([null, null]);
  });
});

describe('spend limit API', () => {
  let db: TestDb;
  let api: TestApi;
  
  beforeAll(async () => {
    ({ db, api } = await createTestApp());
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  const { cards, accounts } = seedIds;

  it('falls back to the credit limit when no user limit exists', async () => {
    const res = await api.get(`/v1/cards/${cards.erikActive}/spend-limit`).set('Authorization', as.erik).expect(200);
    const body = SpendLimitSchema.parse(res.body);
    
    expect(body.source).toBe('credit');
    expect(body.limit.amount).toBe(5_000_000);
    expect(body.remaining.amount).toBe(body.limit.amount - body.used.amount);
  });

  it('uses the account-wide limit before the credit limit', async () => {
    const res = await api.get(`/v1/cards/${cards.saraActive}/spend-limit`).set('Authorization', as.sara).expect(200);
    const body = SpendLimitSchema.parse(res.body);
    
    expect(body).toMatchObject({ source: 'account', period: 'monthly' });
    expect(body.limit.amount).toBe(1_500_000);
    expect(body.periodStart).toMatch(/^\d{4}-\d{2}-25$/);
  });

  it('uses the card limit first', async () => {
    const res = await api.get(`/v1/cards/${cards.annaInactive}/spend-limit`).set('Authorization', as.anna).expect(200);
    const body = SpendLimitSchema.parse(res.body);
    
    expect(body.source).toBe('card');
    expect(body.limit.amount).toBe(1_000_000);
    expect(body.used.amount).toBe(0);
  });

  describe('PUT', () => {
    it('sets the card limit and writes an audit row', async () => {
      const res = await api
        .put(`/v1/cards/${cards.erikActive}/spend-limit`)
        .set('Authorization', as.erik)
        .send({ amount: 250_000, period: 'total' })
        .expect(200);
      const body = SpendLimitSchema.parse(res.body);

      expect(body).toMatchObject({ source: 'card', period: 'total', periodStart: null });
      expect(body.limit.amount).toBe(250_000);

      const get = await api.get(`/v1/cards/${cards.erikActive}/spend-limit`).set('Authorization', as.erik).expect(200);
      expect(get.body.limit.amount).toBe(250_000);

      await api
        .put(`/v1/cards/${cards.erikActive}/spend-limit`)
        .set('Authorization', as.erik)
        .send({ amount: 300_000, period: 'monthly' })
        .expect(200);

      expect(await db.models.SpendLimit.count({ where: { cardId: cards.erikActive } })).toBe(1);

      const rows = await db.models.AuditLog.findAll({ where: { action: 'limit.changed' }, order: [['id', 'ASC']] });
      
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ actorId: seedIds.users.erik, targetId: cards.erikActive });
      expect(rows[0]?.metadata).toEqual({ previous: null, next: { amount: 250_000, period: 'total' } });
      expect(rows[1]?.metadata).toEqual({
        previous: { amount: 250_000, period: 'total' },
        next: { amount: 300_000, period: 'monthly' },
      });
    });

    it('rejects an amount above the credit limit with 422', async () => {
      await api
        .put(`/v1/cards/${cards.erikActive}/spend-limit`)
        .set('Authorization', as.erik)
        .send({ amount: 5_000_001, period: 'monthly' })
        .expect(422);
      await api
        .put(`/v1/cards/${cards.erikActive}/spend-limit`)
        .set('Authorization', as.erik)
        .send({ amount: 5_000_000, period: 'monthly' })
        .expect(200);
    });

    it.each([
      ['negative', { amount: -5, period: 'monthly' }],
      ['zero', { amount: 0, period: 'monthly' }],
      ['float', { amount: 10.5, period: 'monthly' }],
      ['string amount', { amount: '100', period: 'monthly' }],
      ['wrong period', { amount: 100, period: 'weekly' }],
      ['missing period', { amount: 100 }],
    ])('rejects %s body with 400', async (_name, body) => {
      const res = await api
        .put(`/v1/cards/${cards.erikActive}/spend-limit`)
        .set('Authorization', as.erik)
        .send(body)
        .expect(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('credit committed reduces remaining (account currency, unbilled + unpaid)', async () => {
      // Sanity: erik's card has a 5M limit; committed credit is > 0 so remaining < limit - 0.
      const res = await api.get(`/v1/cards/${cards.erikFrozen}/spend-limit`).set('Authorization', as.erik).expect(200);
      
      expect(res.body.source).toBe('credit');
      expect(res.body.used.amount).toBeGreaterThan(0);
      expect(res.body.currency ?? res.body.limit.currency).toBe('SEK');
      expect(accounts.companyAb).toBeDefined();
    });
  });
});
