import { InvoiceListResponseSchema, InvoiceSchema } from '@qred/b2b-app-schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createTestApp, seedIds } from './helpers';
import type { TestApi, TestDb } from './helpers';

describe('invoices', () => {
  let db: TestDb;
  let api: TestApi;
  
  beforeAll(async () => {
    ({ db, api } = await createTestApp());
  });
  
  afterAll(async () => {
    await db.close();
  });

  const path = `/v1/companies/${seedIds.companies.companyAb}/invoices`;

  it('lists invoices sorted by due date ascending', async () => {
    const res = await api.get(path).set('Authorization', as.erik).expect(200);
    const { data } = InvoiceListResponseSchema.parse(res.body);
  
    expect(data.map((i) => i.id).sort()).toEqual(
      [seedIds.invoices.companyAbPaid, seedIds.invoices.companyAbOpen].sort(),
    );
  
    const due = data.map((i) => i.dueDate);
  
    expect(due).toEqual([...due].sort());
  });

  it('filters by status', async () => {
    const res = await api.get(`${path}?status=open`).set('Authorization', as.erik).expect(200);
  
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(seedIds.invoices.companyAbOpen);
  
    const bad = await api.get(`${path}?status=nope`).set('Authorization', as.erik).expect(400);
  
    expect(bad.body.errors[0].path).toBe('query.status');
  });

  it('paginates with page and limit', async () => {
    const first = await api.get(`${path}?limit=1`).set('Authorization', as.erik).expect(200);
    const p1 = InvoiceListResponseSchema.parse(first.body);
  
    expect(p1.data).toHaveLength(1);
    expect(p1.page).toEqual({ number: 1, limit: 1, totalCount: 2, totalPages: 2, hasMore: true });

    const second = await api.get(`${path}?limit=1&page=2`).set('Authorization', as.erik).expect(200);
    const p2 = InvoiceListResponseSchema.parse(second.body);
  
    expect(p2.data).toHaveLength(1);
    expect(p2.page).toMatchObject({ number: 2, hasMore: false });
    // No overlap between pages, and the order continues (due date ascending).
    expect(p2.data[0]?.id).not.toBe(p1.data[0]?.id);
    expect(p2.data[0]!.dueDate >= p1.data[0]!.dueDate).toBe(true);

    const beyond = await api.get(`${path}?limit=1&page=3`).set('Authorization', as.erik).expect(200);
  
    expect(beyond.body.data).toEqual([]);
    expect(beyond.body.page).toMatchObject({ number: 3, totalCount: 2, hasMore: false });
  });

  it('uses defaults of page 1 and limit 20', async () => {
    const res = await api.get(path).set('Authorization', as.erik).expect(200);
  
    expect(res.body.page).toEqual({ number: 1, limit: 20, totalCount: 2, totalPages: 1, hasMore: false });
  });

  it('serves the badge: next open invoice with the total of open ones', async () => {
    const res = await api.get(`${path}?status=open&limit=1`).set('Authorization', as.erik).expect(200);
    const body = InvoiceListResponseSchema.parse(res.body);
  
    expect(body.data.map((i) => i.id)).toEqual([seedIds.invoices.companyAbOpen]);
    expect(body.page.totalCount).toBe(1);
  });

  it('rejects invalid page and limit', async () => {
    for (const query of ['page=0', 'page=abc', 'limit=0', 'limit=101', 'limit=1.5']) {
      const res = await api.get(`${path}?${query}`).set('Authorization', as.erik).expect(400);
  
      expect(res.body.errors).toHaveLength(1);
    }
  });

  it('counts only the caller\'s company in totalCount', async () => {
    const res = await api
      .get(`/v1/companies/${seedIds.companies.nordicTrade}/invoices`)
      .set('Authorization', as.sara)
      .expect(200);
  
    expect(res.body.page.totalCount).toBe(2);
  
    await api
      .get(`/v1/companies/${seedIds.companies.companyAb}/invoices?limit=1`)
      .set('Authorization', as.sara)
      .expect(404);
  });

  it('gets one invoice with outstanding = total - paid', async () => {
    const res = await api
      .get(`/v1/invoices/${seedIds.invoices.companyAbOpen}`)
      .set('Authorization', as.anna)
      .expect(200);
  
    const invoice = InvoiceSchema.parse(res.body);
  
    expect(invoice.outstanding.amount).toBe(invoice.total.amount - invoice.paid.amount);
  });

  it('does not show another company\'s invoices', async () => {
    const res = await api
      .get(`/v1/companies/${seedIds.companies.nordicTrade}/invoices`)
      .set('Authorization', as.anna)
      .expect(200);
  
    expect(res.body.data.every((i: { accountId: string }) => i.accountId === seedIds.accounts.nordicTrade)).toBe(true);
  });
});
