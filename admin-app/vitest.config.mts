import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      all: true,
      // Phase 4 gate: pure-logic layer only (the roadmap targets "new code", not
      // a global threshold). Thin Convex wrappers (`lib/actions`, `lib/api`) and
      // presentational components are exercised via their integration tests, not
      // this statement gate. Revisit per-file once diff-coverage lands in CI.
      include: [
        'src/lib/errors.ts',
        'src/lib/format.ts',
        'src/lib/mappers.ts',
        'src/lib/motion.ts',
        'src/lib/pagination.ts',
        'src/lib/utils.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
})
