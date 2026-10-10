import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'node:os'
import path from 'path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const cacheDir = process.env.LOCALAPPDATA
  ? path.resolve(process.env.LOCALAPPDATA, 'argentum-frontend-vite-cache')
  : path.resolve(os.tmpdir(), 'argentum-frontend-vite-cache')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const turnstileSiteKey =
    process.env.TURNSTILE_SITE_KEY ||
    process.env.VITE_TURNSTILE_SITE_KEY ||
    env.TURNSTILE_SITE_KEY ||
    env.VITE_TURNSTILE_SITE_KEY ||
    ''

  return {
    cacheDir,
    envPrefix: ['VITE_', 'TURNSTILE_'],
    define: {
      'import.meta.env.TURNSTILE_SITE_KEY': JSON.stringify(turnstileSiteKey),
      'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify(turnstileSiteKey),
    },
  plugins: [
    react(),
  ],
  optimizeDeps: {
    entries: ['src/main.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@catalogo': path.resolve(rootDir, './src/lib/constants/catalogo_suscripciones.json'),
    },
  },
  server: {
    fs: {
      allow: [rootDir],
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Necesario para que las cookies seteadas por el backend (127.0.0.1:8000)
        // sean aceptadas por el browser como cookies de localhost:5173
        cookieDomainRewrite: 'localhost',
        // Previene que el proxy reescriba Secure en cookies cuando corre en HTTP
        secure: false,
        timeout: 60000,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@radix-ui/react-dialog') ||
                id.includes('@radix-ui/react-dropdown-menu') ||
                id.includes('@radix-ui/react-slot') ||
                id.includes('@radix-ui/react-toast')) {
              return 'vendor-radix';
            }
          }
        },
      },
    },
  },
}
})