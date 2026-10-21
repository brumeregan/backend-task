import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import type { TestProject } from 'vitest/node';
import { seed } from '../../src/db/seed';
import { initModels } from '../../src/models';
import { createDatabase } from '../../src/resources/database';
import { createLogger } from '../../src/resources/logger';
import { setup as setupDatabase } from '../globalSetup';

declare module 'vitest' {
  export interface ProvidedContext {
    baseUrl: string;
  }
}

const BACKEND_DIR = fileURLToPath(new URL('../..', import.meta.url));
const READY_TIMEOUT_MS = 30_000;

const freePort = async () => {
  const server = createServer().listen(0);
  
  await once(server, 'listening');
  
  const { port } = server.address() as { port: number };
  
  server.close();
  
  return port;
};

const waitUntilReady = async (baseUrl: string, exited: () => boolean, output: () => string) => {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  
  while (Date.now() < deadline) {
    if (exited()) {
      throw new Error(`The server exited during startup:\n${output()}`);
    }
    const ok = await fetch(`${baseUrl}/ready`).then((r) => r.ok, () => false);
    if (ok) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  
  throw new Error(`The server was not ready after ${READY_TIMEOUT_MS} ms:\n${output()}`);
};

// The real thing, once per run: the built dist/main.js as its own process, configured only
// through env vars like in a container, on a migrated and seeded database.
// Teardown stops it with SIGTERM and fails the run unless it shuts down cleanly.
export const setup = async (project: TestProject) => {
  const stopDatabase = await setupDatabase(project);
  const databaseConfig = project.getProvidedContext().databaseConfig;

  const database = createDatabase(databaseConfig, createLogger({ level: 'silent' }));
  
  try {
    await seed(initModels(database));
  } finally {
    await database.close();
  }

  const port = await freePort();
  const server = spawn(process.execPath, ['dist/main.js'], {
    cwd: BACKEND_DIR,
    env: {
      PATH: process.env.PATH,
      NODE_ENV: 'development',
      PORT: String(port),
      LOG_LEVEL: 'warn',
      DB_HOST: databaseConfig.host,
      DB_PORT: String(databaseConfig.port),
      DB_NAME: databaseConfig.name,
      DB_USERNAME: databaseConfig.username,
      DB_PASSWORD: databaseConfig.password,
      CORS_ORIGIN: 'http://localhost:3001',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
  server.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
  const exit = once(server, 'exit') as Promise<[number | null, NodeJS.Signals | null]>;

  const baseUrl = `http://localhost:${port}`;
  
  try {
    await waitUntilReady(baseUrl, () => server.exitCode !== null, () => output);
  } catch (error) {
    server.kill('SIGKILL');
    await stopDatabase();
    throw error;
  }
  
  project.provide('baseUrl', baseUrl);

  return async () => {
    server.kill('SIGTERM');
    const [code, signal] = await exit;
    await stopDatabase();
    if (code !== 0) {
      throw new Error(`Expected a graceful shutdown (exit 0), got code ${code} signal ${signal}:\n${output}`);
    }
  };
};
