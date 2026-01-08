/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    }),
  ],
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['src'],
    },
    watch: {
      ignored: ['**/dist/**'],
    },
  },
  optimizeDeps: {
    exclude: ['dist'],
    entries: ['src/**/*.ts', '!src/**/*.spec.ts'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setup-vitest.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/setup-vitest.ts', 'src/test.ts'],
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
});
