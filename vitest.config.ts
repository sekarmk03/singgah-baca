import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Browser tests in tests/e2e run through Playwright, not Vitest.
    include: ['src/**/*.test.ts'],
  },
});
