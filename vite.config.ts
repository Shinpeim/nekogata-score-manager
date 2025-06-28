import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/auth/**'],
        navigateFallback: null,
        // サービスワーカーを常に最新に保つ設定
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // auth以下は完全にキャッシュしない（最優先）
            urlPattern: ({ url }) => url.pathname.startsWith('/auth/'),
            handler: 'NetworkOnly'
          },
          {
            // ドキュメント: ネットワーク優先、タイムアウトなし（失敗時のみキャッシュ使用）
            // auth以下は除外
            urlPattern: ({ request, url }) => 
              request.destination === 'document' && 
              !url.pathname.startsWith('/auth/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'offline-documents',
              // タイムアウトを設定しない = ネットワークが完全に失敗するまで待つ
              plugins: [
                {
                  cacheWillUpdate: async ({ response }) => {
                    // 200 OK のレスポンスのみキャッシュ
                    if (response && response.status === 200) {
                      return response;
                    }
                    return null;
                  }
                }
              ]
            }
          },
          {
            // JS/CSS: ネットワーク優先、タイムアウトなし
            urlPattern: ({ request }) => 
              request.destination === 'script' || 
              request.destination === 'style',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'offline-assets',
              plugins: [
                {
                  cacheWillUpdate: async ({ response }) => {
                    if (response && response.status === 200) {
                      return response;
                    }
                    return null;
                  }
                }
              ]
            }
          },
          {
            // 画像: ネットワーク優先、タイムアウトなし
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'offline-images',
              plugins: [
                {
                  cacheWillUpdate: async ({ response }) => {
                    if (response && response.status === 200) {
                      return response;
                    }
                    return null;
                  }
                }
              ]
            }
          }
        ]
      },
      manifest: {
        name: 'Nekogata Score Manager',
        short_name: 'NekogataScore',
        description: 'コード譜の作成・閲覧・管理ができるアプリケーション',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
