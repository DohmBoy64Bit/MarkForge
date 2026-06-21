import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['packages/**/*.spec.ts', 'apps/**/*.spec.ts'],
    globals: false
  }
})
