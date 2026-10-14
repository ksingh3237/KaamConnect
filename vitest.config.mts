import { defineConfig } from 'vitest/config';

// Unit tests for the pure logic only (no React Native, no network): sign-in mode selection, Firebase error mapping and the
// Firebase sign-in flow with a fake Firebase. Screens are checked by `tsc` and the Expo exports (see FIREBASE-SETUP.md).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/**/*.test.ts', 'utils/**/*.test.ts'],
  },
});
