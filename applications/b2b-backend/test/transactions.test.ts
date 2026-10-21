import { TransactionListResponseSchema, TransactionSchema } from '@qred/b2b-app-schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createTestApp, seedIds } from './helpers';
import type { TestApi, TestDb } from './helpers';

describe('transactions', () => {
  let db: TestDb;
  let api: TestApi;
  
  beforeAll(async () => {
    ({ db, api } = await createTestApp());
  });
  
  afterAll(async () => {
    await db.close();
  });

  const { companyAb, nordicTrade } = seedIds.companies;
  const list = (query: string, company: string = companyAb, auth: string = as.anna) =>
    api.get(`/v1/companies/${company}/transactions${query}`).set('Authorization', auth);

  it('walks every page without duplicates or gaps, newest first', async () => {
    const total = await db.models.Transaction.count({
      include: [{ association: 'card', where: { accountId: seedIds.accounts.companyAb }, attributes: [] }],
    });
    const seen: { id: string; authorizedAt: string }[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore && page < 20) {
      page += 1;
      const res = await list(`?limit=5&page=${page}`).expect(200);
      const body = TransactionListResponseSchema.parse(res.body);
      
      expect(body.data.length).toBeLessThanOrEqual(5);
      expect(body.page).toMatchObject({ number: page, limit: 5, totalCount: total, totalPages: Math.ceil(total / 5) });
      
      seen.push(...body.data);
      hasMore = body.page.hasMore;
    }

    expect(seen).toHaveLength(total);
    expect(new Set(seen.map((t) => t.id)).size).toBe(total);
    
    const times = seen.map((t) => t.authorizedAt);
    
    expect(times).toEqual([...times].sort().reverse());
    expect(page).toBe(Math.ceil(total / 5));
  });

  it('returns an empty page past the end', async () => {
    const res = await list('?limit=5&page=1000').expect(200);
    
    expect(res.body.data).toEqual([]);
    expect(res.body.page.hasMore).toBe(false);
  });

  it('uses the default limit of 20', async () => {
    const res = await list('').expect(200);
    
    expect(res.body.data).toHaveLength(20);
    expect(res.body.page.hasMore).toBe(true);
  });

  it('breaks ties on id when authorized_at is equal', async () => {
    const at = new Date('2026-01-01T10:00:00Z');
    const base = { cardId: seedIds.cards.erikActive, status: 'cleared' as const, amount: 1, currency: 'SEK', authorizedAt: at };
    
    await db.models.Transaction.bulkCreate([base, base, base, base]);
    
    const ids: string[] = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      page += 1;
      const res = await list(`?limit=7&page=${page}&cardId=${seedIds.cards.erikActive}`).expect(200);
      const body = TransactionListResponseSchema.parse(res.body);
      ids.push(...body.data.map((t) => t.id));
      hasMore = body.page.hasMore;
    }
    
    expect(new Set(ids).size).toBe(ids.length);
    
    const n = await db.models.Transaction.count({ where: { cardId: seedIds.cards.erikActive } });
    
    expect(ids).toHaveLength(n);
  });

  it('filters by status and by card', async () => {
    const pending = await list('?status=pending&limit=100').expect(200);
    
    expect(pending.body.data.length).toBeGreaterThan(0);
    expect(pending.body.data.every((t: { status: string }) => t.status === 'pending')).toBe(true);
    // totalCount respects the filters, not just the page.
    expect(pending.body.page.totalCount).toBe(pending.body.data.length);

    const frozen = await list(`?cardId=${seedIds.cards.erikFrozen}&limit=100`).expect(200);
    expect(frozen.body.data).toHaveLength(3);
    expect(frozen.body.data.every((t: { cardId: string }) => t.cardId === seedIds.cards.erikFrozen)).toBe(true);
  });

  it('returns 404 for a cardId that belongs to another company', async () => {
    await list(`?cardId=${seedIds.cards.saraActive}`).expect(404);
    await list(`?cardId=${seedIds.cards.erikActive}`, nordicTrade, as.anna).expect(404);
  });

  it('rejects invalid pages and limits with 400', async () => {
    await list('?page=0').expect(400);
    await list('?page=abc').expect(400);
    await list('?limit=101').expect(400);
    await list('?limit=0').expect(400);
    await list('?status=bogus').expect(400);
  });

  it('gets one transaction', async () => {
    const first = (await list('?limit=1').expect(200)).body.data[0];
    const res = await api.get(`/v1/transactions/${first.id}`).set('Authorization', as.erik).expect(200);
    
    expect(TransactionSchema.parse(res.body).id).toBe(first.id);
    
    await api.get(`/v1/transactions/${first.id}`).set('Authorization', as.sara).expect(404);
  });
});
