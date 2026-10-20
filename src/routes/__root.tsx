/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Layout } from '~/components/Layout'
import { NotFound } from '~/components/NotFound'
import { m } from '~/i18n/messages'
import { getLocale } from '~/i18n/runtime'
import { site } from '~/site'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: site.name },
    ],
    links: [
      // 라틴 기본 글자 조각(scripts/fonts/ranges.txt 마지막 줄, 0부터 센 번호 123). 첫 렌더에 거의 항상 쓰인다
      { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/suit/eunsol-sans.123.woff2', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  notFoundComponent: () => {
    return (
      <>
        <title>{`${m.not_found_title()} | ${site.name}`}</title>
        <NotFound />
      </>
    )
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // /posts 의 인라인 스크립트가 페인트 전에 data-tag 를 붙이므로 그 차이는 hydration 경고에서 뺀다
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
