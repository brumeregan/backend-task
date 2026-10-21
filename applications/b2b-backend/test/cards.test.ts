import { CardListResponseSchema, CardSchema } from '@qred/b2b-app-schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { planTransition } from '../src/services/cardStateMachine';
import { as, createTestApp, seedIds } from './helpers';
import type { TestApi, TestDb } from './helpers';

describe('cards', () => {
  let db: TestDb;
  let api: TestApi;

  beforeAll(async () => {
    ({ db, api } = await createTestApp());
  });
  
  afterAll(async () => {
    await db.close();
  });

  const { cards, companies } = seedIds;
  const audit = (action: string) => db.models.AuditLog.findAll({ where: { action } });

  it('lists the cards of a company', async () => {
    const res = await api
      .get(`/v1/companies/${companies.companyAb}/cards`)
      .set('Authorization', as.anna)
      .expect(200);
    const body = CardListResponseSchema.parse(res.body);
    
    expect(body.data).toHaveLength(3);
    expect(body.data.every((c) => c.companyId === companies.companyAb)).toBe(true);
  });

  it('validates path params', async () => {
    const res = await api.get('/v1/cards/not-a-uuid').set('Authorization', as.anna).expect(400);
    
    expect(res.body.errors[0].path).toBe('params.cardId');
  });

  describe('activate', () => {
    it('activates an inactive card and writes an audit row', async () => {
      const res = await api
        .post(`/v1/cards/${cards.annaInactive}/activate`)
        .set('Authorization', as.anna)
        .expect(200);
      const card = CardSchema.parse(res.body);
      
      expect(card.status).toBe('active');
      expect(card.activatedAt).not.toBeNull();

      const rows = await audit('card.activated');
      
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        actorId: seedIds.users.anna,
        companyId: companies.companyAb,
        targetType: 'card',
        targetId: cards.annaInactive,
        metadata: { from: 'inactive', to: 'active' },
      });
    });

    it('returns 409 when the card is already active', async () => {
      const res = await api
        .post(`/v1/cards/${cards.annaInactive}/activate`)
        .set('Authorization', as.anna)
        .expect(409);
      
      expect(res.body.detail).toMatch(/already active/i);
      expect(await audit('card.activated')).toHaveLength(1);
    });
  });

  describe('freeze / unfreeze', () => {
    it('freezes an active card, and rejects freezing it again', async () => {
      const first = await api
        .post(`/v1/cards/${cards.erikActive}/freeze`)
        .set('Authorization', as.erik)
        .expect(200);
      
      expect(CardSchema.parse(first.body).status).toBe('frozen');
      
      await api.post(`/v1/cards/${cards.erikActive}/freeze`).set('Authorization', as.erik).expect(409);
      const rows = await audit('card.frozen');
      
      expect(rows).toHaveLength(1);
      expect(rows[0]?.metadata).toEqual({ from: 'active', to: 'frozen' });
    });

    it('unfreezes a frozen card, and rejects unfreezing it again', async () => {
      const first = await api
        .post(`/v1/cards/${cards.erikActive}/unfreeze`)
        .set('Authorization', as.erik)
        .expect(200);
      
      expect(CardSchema.parse(first.body).status).toBe('active');
      
      await api.post(`/v1/cards/${cards.erikActive}/unfreeze`).set('Authorization', as.erik).expect(409);
      expect(await audit('card.unfrozen')).toHaveLength(1);
    });

    it('cannot freeze an inactive card', async () => {
      const inactive = await db.models.Card.create({
        accountId: seedIds.accounts.companyAb,
        cardholderUserId: seedIds.users.erik,
        issuerCardId: 'iss_test_inactive',
        last4: '9999',
        expiryMonth: 1,
        expiryYear: 2030,
      });
      
      await api.post(`/v1/cards/${inactive.id}/freeze`).set('Authorization', as.erik).expect(409);
      await api.post(`/v1/cards/${inactive.id}/unfreeze`).set('Authorization', as.erik).expect(409);
    });

    it.each(['blocked', 'expired'] as const)('%s cards cannot change state', async (status) => {
      const card = await db.models.Card.create({
        accountId: seedIds.accounts.companyAb,
        cardholderUserId: seedIds.users.erik,
        issuerCardId: `iss_test_${status}`,
        last4: '7777',
        expiryMonth: 1,
        expiryYear: 2030,
        status,
      });
      const auth = { Authorization: as.erik };
      
      await api.post(`/v1/cards/${card.id}/freeze`).set(auth).expect(409);
      await api.post(`/v1/cards/${card.id}/unfreeze`).set(auth).expect(409);
      await api.post(`/v1/cards/${card.id}/activate`).set(auth).expect(409);
    });
  });
});

describe('card state machine', () => {
  it('has an explicit transition table', () => {
    expect(planTransition('activate', 'inactive')).toEqual({ kind: 'change', to: 'active' });
    expect(planTransition('freeze', 'active')).toEqual({ kind: 'change', to: 'frozen' });
    expect(planTransition('unfreeze', 'frozen')).toEqual({ kind: 'change', to: 'active' });
    expect(planTransition('freeze', 'frozen').kind).toBe('conflict');
    expect(planTransition('unfreeze', 'active').kind).toBe('conflict');
    expect(planTransition('activate', 'active').kind).toBe('conflict');
    expect(planTransition('activate', 'frozen').kind).toBe('conflict');
    expect(planTransition('freeze', 'blocked').kind).toBe('conflict');
  });
});
