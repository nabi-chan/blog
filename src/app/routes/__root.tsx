/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Layout } from '~/widgets/site-layout'
import { NotFound } from '~/pages/not-found'
import { getLocale, localizeHref, m } from '~/shared/i18n'
import { site } from '~/shared/config'
import appCss from '~/app/styles/app.css?url'
import latinFont from '~/app/styles/fonts/eunsol-sans.123.woff2?url'

export const Route = createRootRoute({
  // 제목·설명·OG 는 화면마다 pageHead 로 단다. 여기에 제목을 두면 404 문서에 <title> 이 두 개가 된다
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // 검색엔진 사이트 인증 (site.verification)
      ...(site.verification.naver ? [{ name: 'naver-site-verification', content: site.verification.naver }] : []),
    ],
    links: [
      // 라틴 기본 글자 조각(scripts/fonts/ranges.txt 마지막 줄, 0부터 센 번호 123). 첫 렌더에 거의 항상 쓰인다.
      // ?url 로 받아 fonts.css 와 같은 해시 붙은 주소를 쓴다
      { rel: 'preload', as: 'font', type: 'font/woff2', href: latinFont, crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'alternate', type: 'application/rss+xml', title: site.name, href: localizeHref('/rss.xml') },
    ],
  }),
  notFoundComponent: () => {
    return (
      <>
        <title>{`${m.not_found_title()} | ${site.name}`}</title>
        <meta name="robots" content="noindex" />
        <NotFound />
      </>
    )
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // /posts 의 인라인 스크립트가 페인트 전에 data-category 를 붙이므로 그 차이는 hydration 경고에서 뺀다
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Layout>{children}</Layout>
        <Scripts />
      </body>
    </html>
  )
}
