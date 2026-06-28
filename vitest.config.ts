import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Stub the virtual PWA module so unit tests don't need a real service worker
      'virtual:pwa-register/react': resolve(__dirname, 'src/__tests__/__mocks__/pwa-register.tsx'),
    },
  },
})
