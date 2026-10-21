import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';
import { createMigrator } from '../src/db/migrator';
import { createDatabase } from '../src/resources/database';
import { createLogger } from '../src/resources/logger';
import type { DatabaseConfig } from '../src/resources/database';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseConfig: DatabaseConfig;
  }
}

const TEST_DB_NAME = 'qred_b2b_test';

// TEST_DB_HOST set: use that server (e.g. the compose one), but always a separate test database,
// so the tests never wipe the dev data. Otherwise: a throwaway Postgres container per run.
const useExistingServer = async (): Promise<DatabaseConfig> => {
  const server = {
    host: process.env.TEST_DB_HOST!,
    port: Number(process.env.TEST_DB_PORT ?? 5432),
    username: process.env.TEST_DB_USERNAME ?? 'qred',
    password: process.env.TEST_DB_PASSWORD ?? 'qred',
  };
  
  const admin = new Client({ ...server, user: server.username, database: 'postgres' });
  await admin.connect();
  
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB_NAME]);
    if (!rowCount) {
      await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    }
  } finally {
    await admin.end();
  }

  return { ...server, name: TEST_DB_NAME };
};

const startContainer = async (): Promise<[DatabaseConfig, StartedPostgreSqlContainer]> => {
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase(TEST_DB_NAME)
    .start();
  
  const config = {
    host: container.getHost(),
    port: container.getPort(),
    name: container.getDatabase(),
    username: container.getUsername(),
    password: container.getPassword(),
  };
  
  return [config, container];
};

// Runs once per `vitest run`, in the main process: start the database and migrate it.
// Each test file then connects to it and resets the data (see helpers.ts).
export const setup = async (project: TestProject) => {
  const [databaseConfig, container] = process.env.TEST_DB_HOST
    ? [await useExistingServer(), undefined]
    : await startContainer();

  const database = createDatabase(databaseConfig, createLogger({ level: 'silent' }));
  
  try {
    // From scratch: a reused test database may hold an older schema.
    const migrator = createMigrator(database);
    await migrator.down({ to: 0 });
    await migrator.up();
  } finally {
    await database.close();
  }

  project.provide('databaseConfig', databaseConfig);

  return async () => {
    await container?.stop();
  };
};
