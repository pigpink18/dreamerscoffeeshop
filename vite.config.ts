import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// base './' giúp chạy được ở bất kỳ đường dẫn nào (GitHub Pages: /ten-repo/)
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Dreamers Coffee – Quán Cà Phê',
        short_name: 'Dreamers Coffee',
        description: 'Game kinh doanh quán cà phê',
        lang: 'vi',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6efe6',
        theme_color: '#6f4e37',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // nhạc nền: tải khi cần rồi lưu cache để chơi offline
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/assets/music/'),
            handler: 'CacheFirst',
            options: { cacheName: 'dreamers-music', expiration: { maxEntries: 20 }, rangeRequests: true },
          },
        ],
      },
    }),
  ],
})
