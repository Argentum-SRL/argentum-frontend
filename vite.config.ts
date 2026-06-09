import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import os from 'node:os'
import path from 'path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const cacheDir = process.env.LOCALAPPDATA
  ? path.resolve(process.env.LOCALAPPDATA, 'argentum-frontend-vite-cache')
  : path.resolve(os.tmpdir(), 'argentum-frontend-vite-cache')

export default defineConfig({
  cacheDir,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'pwa-sw.js',
      workbox: {
        navigateFallbackDenylist: [
          /\/node_modules\/.vite\//,
          /\/@vite\//,
          /\/@id\//,
          /\?v=[a-f0-9]+$/,
        ],
        runtimeCaching: [
          {
            urlPattern: /\/node_modules\/.vite\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/@vite\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/@id\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\?v=[a-f0-9]+$/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    entries: ['src/main.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
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
})