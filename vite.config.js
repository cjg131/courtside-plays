import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Courtside Plays — Vite config with PWA so coaches can install it on their phone
// and use it on the sideline without reliable internet.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Courtside Plays',
        short_name: 'Plays',
        description: 'Interactive basketball play visualizer',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  server: {
    port: 5175,
    host: true,
  },
  build: {
    // Default to out-of-Dropbox so repeated builds don't fight Dropbox file locks.
    // Override with --outDir if you actually want dist/ under the repo.
    outDir: process.env.CP_OUT_DIR || '/tmp/cp-build',
    emptyOutDir: true,
    sourcemap: true,
  },
});
