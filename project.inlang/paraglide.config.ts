import { defineConfig } from '@inlang/paraglide-js'

// Paraglide CLI(pnpm i18n:compile, check·test 가 부름)와 vite 플러그인이 같이 읽는 설정이다.
// 한쪽에만 두면 CLI 가 기본값(cookie 전략 등)으로 런타임을 다시 써서 dev 서버와 테스트의 언어 판정이 달라진다
export default defineConfig({
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
})
