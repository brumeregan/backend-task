import { defineConfig } from 'vitest/config';

// Black-box smoke tests against the built server (dist/main.js) as a separate process.
// Run with `pnpm test:e2e`, which builds first.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/e2e/**/*.test.ts'],
    globalSetup: ['test/e2e/globalSetup.ts'],
    hookTimeout: 60_000,
  },
});
