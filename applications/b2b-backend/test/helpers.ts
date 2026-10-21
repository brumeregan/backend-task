import request from 'supertest';
import { inject } from 'vitest';
import { createApp } from '../src/app';
import { createTokens } from '../src/auth/tokens';
import { DEV_JWT_SECRET } from '../src/config';
import { seed, seedIds } from '../src/db/seed';
import { initModels } from '../src/models';
import { createDatabase } from '../src/resources/database';
import { createLogger } from '../src/resources/logger';
import type { Sequelize } from 'sequelize';
import type { Models } from '../src/models';

const JWT_ISSUER = 'qred-mock-auth';

// Every table the app owns. SequelizeMeta (applied migrations) is left alone.
const APP_TABLES = [
  'audit_log',
  'transactions',
  'invoices',
  'spend_limits',
  'cards',
  'accounts',
  'company_memberships',
  'companies',
  'users',
];

// Back to exactly the seed: every test file starts from the same known data.
export const resetDb = async (sequelize: Sequelize, models: Models) => {
  await sequelize.query(`TRUNCATE ${APP_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  await seed(models);
};

// The app in-process (no listen()), on the database migrated by globalSetup.ts.
// Call once per test file in beforeAll, close in afterAll.
export const createTestApp = async () => {
  const logger = createLogger({ level: 'silent' });
  const sequelize = createDatabase(inject('databaseConfig'), logger);
  const models = initModels(sequelize);
  await resetDb(sequelize, models);

  const app = createApp(
    {
      auth: { jwtSecret: DEV_JWT_SECRET, jwtIssuer: JWT_ISSUER },
      port: 0,
      cors: { origin: 'http://localhost:3001' },
    },
    { logger, database: sequelize },
  );

  const db = { sequelize, models, close: () => sequelize.close() };
  return { db, app, api: request(app) };
};

export type TestDb = Awaited<ReturnType<typeof createTestApp>>['db'];
export type TestApi = Awaited<ReturnType<typeof createTestApp>>['api'];

const { signAccessToken } = createTokens({ jwtSecret: DEV_JWT_SECRET, jwtIssuer: JWT_ISSUER });

export const bearer = (userId: string) => `Bearer ${signAccessToken(userId)}`;

export const as = {
  anna: bearer(seedIds.users.anna),
  erik: bearer(seedIds.users.erik),
  sara: bearer(seedIds.users.sara),
};

export { seedIds };
