import {
  CardListResponseSchema,
  InvoiceListResponseSchema,
  mockUsers,
  ProblemDetailsSchema,
  SpendLimitSchema,
  TransactionListResponseSchema,
  UserCompaniesResponseSchema,
} from '@qred/b2b-app-schemas';
import { describe, expect, inject, it } from 'vitest';
import { seedIds } from '../../src/db/seed';

// Black-box: plain HTTP against the spawned server, with the same hardcoded tokens the web
// demo and api.http use. Read-only, so the order of the tests does not matter.
const baseUrl = inject('baseUrl');
const tokenOf = (name: 'Anna' | 'Erik' | 'Sara') => mockUsers.find((u) => u.name === name)!.token;

const get = (path: string, user?: 'Anna' | 'Erik' | 'Sara', headers: Record<string, string> = {}) =>
  fetch(`${baseUrl}${path}`, {
    headers: { ...headers, ...(user ? { Authorization: `Bearer ${tokenOf(user)}` } : {}) },
  });

const { companyAb } = seedIds.companies;

describe('the running server', () => {
  it('is live and ready', async () => {
    expect((await get('/health')).status).toBe(200);
    expect(await (await get('/ready')).json()).toEqual({ status: 'ok' });
  });

  it('serves the whole card view for Erik', async () => {
    const companies = UserCompaniesResponseSchema.parse(await (await get('/v1/user/companies', 'Erik')).json());
    expect(companies.data.map((c) => c.legalName)).toEqual(['Company AB']);

    const base = `/v1/companies/${companyAb}`;
    const [cardsRes, txRes, invoicesRes] = await Promise.all([
      get(`${base}/cards`, 'Erik'),
      get(`${base}/transactions?limit=3`, 'Erik'),
      get(`${base}/invoices?status=open&limit=1`, 'Erik'),
    ]);
    const cards = CardListResponseSchema.parse(await cardsRes.json());
    const transactions = TransactionListResponseSchema.parse(await txRes.json());
    const invoices = InvoiceListResponseSchema.parse(await invoicesRes.json());

    expect(transactions.data).toHaveLength(3);
    expect(transactions.page.totalCount).toBeGreaterThan(3);
    expect(transactions.page.hasMore).toBe(true);
    expect(invoices.data).toHaveLength(1);

    const active = cards.data.find((card) => card.status === 'active')!;
    const limitRes = await get(`/v1/cards/${active.id}/spend-limit`, 'Erik');
    const limit = SpendLimitSchema.parse(await limitRes.json());
    
    expect(limit.remaining.formattedAmount).toMatch(/ SEK$/);
  });

  it('keeps Sara out of Company AB with a 404 problem', async () => {
    const res = await get(`/v1/companies/${companyAb}/cards`, 'Sara');
    
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/problem\+json/);
  });

  it('answers 401 and unknown routes as problem+json', async () => {
    const unauthorized = await get('/v1/user');
    
    expect(unauthorized.status).toBe(401);
    expect(ProblemDetailsSchema.parse(await unauthorized.json()).type).toBe('unauthorized');
    expect((await get('/v1/nope', 'Anna')).status).toBe(404);
  });

  it('sets security, CORS and request id headers', async () => {
    const res = await get('/v1/user', 'Anna', {
      Origin: 'http://localhost:3001',
      'x-request-id': 'e2e-request-0001',
    });
    
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3001');
    expect(res.headers.get('x-request-id')).toBe('e2e-request-0001');
    expect(res.headers.get('x-powered-by')).toBeNull();
  });
});
