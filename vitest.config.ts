import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // vitest-chrome ships a CJS main; force Vitest to use the ESM build instead.
      'vitest-chrome': path.resolve(
        'node_modules/vitest-chrome/lib/index.esm.js',
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/scoring/**', 'src/storage/**'],
      exclude: ['src/data/bank/**'],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
