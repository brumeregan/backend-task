import { mockUsers } from '@qred/b2b-app-schemas';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { DEV_JWT_SECRET } from '../src/config';
import { seedIds } from './helpers';

// The hardcoded demo tokens must keep matching the dev secret and the seeded users.
// If this fails after changing the secret, the issuer or the seed IDs, re-sign the tokens
// in libraries/b2b-app-schemas/src/mock-auth.ts and api.http.
describe('hardcoded mock tokens', () => {
  const seededIds = { Anna: seedIds.users.anna, Erik: seedIds.users.erik, Sara: seedIds.users.sara };

  it.each(mockUsers)('$name: token is signed with the dev secret for the seeded user', (user) => {
    const payload = jwt.verify(user.token, DEV_JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'qred-mock-auth',
    });
    expect(payload).toMatchObject({ sub: user.userId });
    expect(user.userId).toBe(seededIds[user.name]);
  });
});
