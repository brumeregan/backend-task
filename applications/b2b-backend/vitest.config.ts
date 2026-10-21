import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['test/e2e/**'],
    // Starts Postgres (Testcontainers, or TEST_DB_HOST) and runs the migrations once per run.
    globalSetup: ['test/globalSetup.ts'],
    // All files share one database and reset it in beforeAll, so they must not overlap.
    fileParallelism: false,
    hookTimeout: 60_000,
  },
});
