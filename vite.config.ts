import { cloudflare } from '@cloudflare/vite-plugin'
import contentCollections from '@content-collections/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { SEO_PAGES, markdownPagePaths, shouldPrerender } from './src/lib/prerender.ts'
import { ogSitePlugin } from './src/shared/og/index.ts'

export default defineConfig(({ mode }) => ({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    contentCollections(),
    // 사이트 기본 OG 이미지 (Lobby·Posts·404)
    ogSitePlugin(),
    tailwindcss(),
    // 전략·URL 패턴·출력 위치는 project.inlang/paraglide.config.ts 에 있다 (CLI 와 공유)
    paraglideVitePlugin({ project: './project.inlang' }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      // 라우트 자동 탐색은 인덱스 라우트를 '/posts/' 로 만들어 중복 페이지가 생기므로 끄고 링크 크롤링으로만 찾는다
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoStaticPathsDiscovery: false,
        autoSubfolderIndex: false,
        failOnError: true,
        // ?tag=·#헤딩 링크(같은 페이지), /api/·/admin(Worker 가 처리)은 프리렌더하지 않는다
        filter: ({ path }) => shouldPrerender(path),
      },
      // 링크 크롤링으로 닿지 않는 SEO·GEO 산출물과 글별 .md 원문은 직접 넣는다
      pages: [
        { path: '/' },
        { path: '/en' },
        ...[...SEO_PAGES, ...markdownPagePaths('content/posts', { production: mode === 'production' })].map((path) => ({ path })),
      ],
    }),
    viteReact(),
  ],
}))
