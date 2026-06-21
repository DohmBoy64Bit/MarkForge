import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    port: 1420
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_']
})
