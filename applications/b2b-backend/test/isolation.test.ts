import jwt from 'jsonwebtoken';
import { UserCompaniesResponseSchema } from '@qred/b2b-app-schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEV_JWT_SECRET } from '../src/config';
import { as, createTestApp, seedIds } from './helpers';
import type { TestApi, TestDb } from './helpers';
import type { Test } from 'supertest';



describe('tenant isolation', () => {
  let db: TestDb;
  let api: TestApi;
  
  beforeAll(async () => {
    ({ db, api } = await createTestApp());
  });
  
  afterAll(async () => {
    await db.close();
  });

  const { companies, cards, users } = seedIds;
  const anyTransaction = async () => (await db.models.Transaction.findOne({ where: { cardId: cards.erikActive } }))!.id;

  it('lists the companies a user belongs to', async () => {
    const anna = await api.get('/v1/user/companies').set('Authorization', as.anna).expect(200);
    const sara = await api.get('/v1/user/companies').set('Authorization', as.sara).expect(200);
    const erik = await api.get('/v1/user/companies').set('Authorization', as.erik).expect(200);
    
    expect(UserCompaniesResponseSchema.parse(anna.body).data).toHaveLength(2);
    expect(UserCompaniesResponseSchema.parse(sara.body).data).toHaveLength(1);
    
    const erikIds = erik.body.data.map((c: { id: string }) => c.id);
    
    expect(erikIds).toEqual([companies.companyAb]);
    expect(erikIds).not.toContain(companies.nordicTrade);
  });

  describe('sara (Nordic Trade only) cannot reach Company AB', () => {
    it('returns 404 for company-scoped lists', async () => {
      for (const path of ['cards', 'transactions', 'invoices']) {
        const res = await api
          .get(`/v1/companies/${companies.companyAb}/${path}`)
          .set('Authorization', as.sara);
        expect(res.status, path).toBe(404);
        expect(res.type).toBe('application/problem+json');
      }
    });

    it('returns 404 for every card action on anna/erik cards', async () => {
      const sara = (req: Test) => req.set('Authorization', as.sara);
      const results: string[] = [];
      for (const id of [cards.annaInactive, cards.erikActive, cards.erikFrozen]) {
        const calls: [string, () => Test][] = [
          ['GET card', () => api.get(`/v1/cards/${id}`)],
          ['GET limit', () => api.get(`/v1/cards/${id}/spend-limit`)],
          ['PUT limit', () => api.put(`/v1/cards/${id}/spend-limit`).send({ amount: 1000, period: 'monthly' })],
          ['activate', () => api.post(`/v1/cards/${id}/activate`)],
          ['freeze', () => api.post(`/v1/cards/${id}/freeze`)],
          ['unfreeze', () => api.post(`/v1/cards/${id}/unfreeze`)],
        ];
        for (const [name, call] of calls) {
          const res = await sara(call());
          if (res.status !== 404) {
            results.push(`${name} ${id} -> ${res.status}`);
          }
        }
      }
      expect(results).toEqual([]);
    });

    it('left the cards untouched', async () => {
      const annaCard = await db.models.Card.findByPk(cards.annaInactive);
      const erikCard = await db.models.Card.findByPk(cards.erikActive);
      expect(annaCard?.status).toBe('inactive');
      expect(erikCard?.status).toBe('active');
      expect(await db.models.AuditLog.count()).toBe(0);
    });

    it('returns 404 for a Company AB transaction and invoice', async () => {
      await api
        .get(`/v1/transactions/${await anyTransaction()}`)
        .set('Authorization', as.sara)
        .expect(404);
      await api
        .get(`/v1/invoices/${seedIds.invoices.companyAbOpen}`)
        .set('Authorization', as.sara)
        .expect(404);
    });
  });

  it('erik cannot see Nordic Trade data', async () => {
    await api
      .get(`/v1/companies/${companies.nordicTrade}/cards`)
      .set('Authorization', as.erik)
      .expect(404);
    await api.get(`/v1/cards/${cards.saraActive}`).set('Authorization', as.erik).expect(404);
  });

  it('members can read their own data', async () => {
    await api.get(`/v1/cards/${cards.erikActive}`).set('Authorization', as.anna).expect(200);
    await api.get(`/v1/transactions/${await anyTransaction()}`).set('Authorization', as.erik).expect(200);
    await api.get(`/v1/invoices/${seedIds.invoices.companyAbOpen}`).set('Authorization', as.anna).expect(200);
  });

  describe('authentication', () => {
    const path = '/v1/user';
    
    it('rejects a missing token', async () => {
      const res = await api.get(path).expect(401);
      expect(res.type).toBe('application/problem+json');
    });
    
    it('rejects a malformed token', async () => {
      await api.get(path).set('Authorization', 'Bearer not-a-jwt').expect(401);
      await api.get(path).set('Authorization', 'Basic abc').expect(401);
    });
    
    it('rejects a token signed with the wrong secret', async () => {
      const token = jwt.sign({}, 'another-secret', {
        algorithm: 'HS256',
        subject: users.anna,
        issuer: 'qred-mock-auth',
      });
      await api.get(path).set('Authorization', `Bearer ${token}`).expect(401);
    });
    
    it('answers 404 on /user for a valid token whose user does not exist', async () => {
      const token = jwt.sign({}, DEV_JWT_SECRET, {
        algorithm: 'HS256',
        subject: 'a0000000-0000-4000-8000-0000000000ff',
        issuer: 'qred-mock-auth',
      });
      await api.get(path).set('Authorization', `Bearer ${token}`).expect(404);
    });
    
    it('does not expose tax_number on /user', async () => {
      const res = await api.get(path).set('Authorization', as.anna).expect(200);
      expect(JSON.stringify(res.body)).not.toMatch(/19900101/);
    });
  });
});
