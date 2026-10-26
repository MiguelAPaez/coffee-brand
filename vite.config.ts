/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// three / r3f / drei are only reached through dynamic import(),
// so Rollup already splits them out of the entry chunk.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    // The lazy 3D chunk (three + r3f + drei) is ~250 KB gzip by design.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
