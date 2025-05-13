import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    // Improve test debugging
    reporters: ['verbose'],
    // Ensure proper React testing
    transformMode: {
      web: [/\.[jt]sx$/],
    },
    // Additional options to help with React testing
    deps: {
      inline: [/testing-library/],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});