import { createRouter } from '@tanstack/react-router'
import { deLocalizeUrl, localizeUrl } from '~/shared/i18n'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    // 정규 URL 은 슬래시 없음. 링크도 그 형태로 만든다
    trailingSlash: 'never',
    // URL 의 언어 접두사(/en)는 라우터 밖에서 떼고 붙인다. 라우트는 언어 없이 한 벌만 정의한다
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
  })
}
