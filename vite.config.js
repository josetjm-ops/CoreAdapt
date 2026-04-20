import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-register the service worker so it activates immediately on update
      registerType: 'autoUpdate',
      // Include icon files in the precache
      includeAssets: ['icon-192.png', 'icon-512.png', 'favicon.svg'],
      manifest: {
        name: 'CoreAdapt — Professional Athlete Tech',
        short_name: 'CoreAdapt',
        description: 'Tu cerebro de entrenamiento personal. Tecnología de alto rendimiento para atletas serios.',
        start_url: '/app',
        display: 'standalone',
        background_color: '#131313',
        theme_color: '#131313',
        orientation: 'portrait',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache all assets aggressively for offline support
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache Firebase auth API calls
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
})
