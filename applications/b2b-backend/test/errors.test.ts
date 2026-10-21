import express from 'express';
import request from 'supertest';
import { ProblemDetailsSchema, UserSchema } from '@qred/b2b-app-schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createTestApp } from './helpers';
import { errorHandler } from '../src/middleware/errorHandler';
import { sendValidated } from '../src/middleware/sendValidated';
import type { Logger } from '../src/resources/logger';
import type { TestApi, TestDb } from './helpers';

describe('errors', () => {
  let db: TestDb;
  let api: TestApi;
  
  beforeAll(async () => {
    ({ db, api } = await createTestApp());
  });
  
  afterAll(async () => {
    await db.close();
  });

  it('answers unknown routes with a 404 problem', async () => {
    const res = await api.get('/nope').expect(404);
    
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    
    const body = ProblemDetailsSchema.parse(res.body);
    
    expect(body).toMatchObject({ status: 404, type: 'not-found' });
    expect(body.requestId).toBeTruthy();
  });

  it('answers malformed JSON with 400', async () => {
    const res = await api
      .post('/v1/cards/d0000000-0000-4000-8000-000000000001/activate')
      .set('Authorization', as.anna)
      .set('Content-Type', 'application/json')
      .send('{"note": ')
      .expect(400);
    
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.detail).toMatch(/malformed json/i);
  });

  it('rejects oversized bodies', async () => {
    const res = await api
      .post('/v1/cards/d0000000-0000-4000-8000-000000000001/activate')
      .set('Authorization', as.anna)
      .send({ note: 'x'.repeat(20_000) })
      .expect(413);
    
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  });

  it('reports validation errors with paths', async () => {
    const res = await api
      .get('/v1/companies/not-a-uuid/cards')
      .set('Authorization', as.anna)
      .expect(400);
    
    expect(res.body.errors).toEqual([{ path: 'params.companyId', message: expect.any(String) }]);
  });

  it('echoes a valid x-request-id and generates one otherwise', async () => {
    const res = await api.get('/health').set('x-request-id', 'client-req-12345').expect(200);
    
    expect(res.headers['x-request-id']).toBe('client-req-12345');
    
    const generated = await api.get('/health').set('x-request-id', '!!bad id!!').expect(200);
    
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    
    const problem = await api.get('/v1/user').set('x-request-id', 'client-req-67890').expect(401);
    
    expect(problem.body.requestId).toBe('client-req-67890');
  });

  it('serves health and readiness without auth, and no API docs', async () => {
    await api.get('/health').expect(200, { status: 'ok' });
    await api.get('/ready').expect(200, { status: 'ok' });
    await api.get('/openapi.json').expect(404);
    await api.get('/docs/').expect(404);
  });

  it('sets security headers', async () => {
    const res = await api.get('/health');
    
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['ratelimit']).toBeDefined();
  });
});

describe('response contract violations', () => {
  const logged: unknown[] = [];
  const logger = { error: (...args: unknown[]) => logged.push(args) } as unknown as Logger;
  const api = request(
    express()
      .get('/drift', () => {
        // A server bug: the payload does not match the schema it is sent under.
        sendValidated({} as never, UserSchema, { id: 'not-a-uuid', firstName: 'Anna' } as never);
      })
      .use(errorHandler({ logger })),
  );

  it('answer 500, not 400, without leaking schema details', async () => {
    const res = await api.get('/drift').expect(500);
    const body = ProblemDetailsSchema.parse(res.body);
    
    expect(body).toMatchObject({ status: 500, type: 'internal-error', title: 'Internal Server Error' });
    expect(res.body).not.toHaveProperty('errors');
    expect(res.body).not.toHaveProperty('detail');
    expect(JSON.stringify(res.body)).not.toMatch(/firstName|contract/);
  });

  it('are logged with the failing paths and no values', () => {
    const message = String((logged[0] as [{ err: Error }])[0].err.message);
    
    expect(message).toMatch(/contract schema: .*id/);
    expect(message).not.toContain('Anna');
  });
});
