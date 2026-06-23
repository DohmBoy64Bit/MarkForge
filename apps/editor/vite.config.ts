import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }

          if (
            id.includes('packages/markdown-engine') ||
            id.includes('node_modules/markdown-it') ||
            id.includes('node_modules/highlight.js') ||
            id.includes('node_modules/katex') ||
            id.includes('node_modules/@vscode/markdown-it-katex') ||
            id.includes('node_modules/dompurify')
          ) {
            return 'markdown-vendor'
          }

          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor'
          }

          if (
            id.includes('node_modules/@codemirror/lang-') ||
            id.includes('node_modules/@lezer')
          ) {
            return 'codemirror-language-vendor'
          }

          if (
            id.includes('node_modules/@codemirror') ||
            id.includes('node_modules/crelt') ||
            id.includes('node_modules/style-mod') ||
            id.includes('node_modules/w3c-keyname')
          ) {
            return 'codemirror-vendor'
          }
        }
      }
    }
  },
  server: {
    strictPort: true,
    port: 1420
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_']
})
