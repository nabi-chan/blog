import { cloudflare } from '@cloudflare/vite-plugin'
import contentCollections from '@content-collections/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    contentCollections(),
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      outputStructure: 'message-modules',
      // 쿠키·브라우저 언어는 보지 않는다. 언어는 URL 로만 정해진다 (자동 리다이렉트 없음)
      strategy: ['url', 'baseLocale'],
      urlPatterns: [
        {
          pattern: '/:path(.*)?',
          localized: [
            ['en', '/en/:path(.*)?'],
            ['ko', '/:path(.*)?'],
          ],
        },
      ],
    }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      // 라우트 자동 탐색은 인덱스 라우트를 '/posts/' 로 만들어 중복 페이지가 생기므로 끄고 링크 크롤링으로만 찾는다
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoStaticPathsDiscovery: false,
        autoSubfolderIndex: false,
        failOnError: true,
      },
      pages: [{ path: '/' }, { path: '/en' }],
    }),
    viteReact(),
  ],
})
