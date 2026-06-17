import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig({
  resolve: {
    alias: {
      // vitest-chrome ships a CJS main; force Vitest to use the ESM build instead.
      // Use require.resolve so the path resolves correctly in git worktrees where
      // node_modules lives in the main repo root, not the worktree directory.
      'vitest-chrome': require.resolve('vitest-chrome/lib/index.esm.js'),
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
