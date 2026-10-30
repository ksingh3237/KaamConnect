import { defineConfig } from 'vitest/config';

// Pure logic only (no React Native renderer): the MSG91 response handling, session client and sector search.
export default defineConfig({
  test: {
    include: ['api/**/*.test.ts', 'utils/**/*.test.ts', 'i18n/**/*.test.ts'],
  },
});
