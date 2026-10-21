import { join } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@qred/b2b-app-schemas'],
  // Self-contained server for the Docker image; tracing from the repo root picks up workspace packages.
  output: 'standalone',
  outputFileTracingRoot: join(__dirname, '../../'),
};

export default nextConfig;
