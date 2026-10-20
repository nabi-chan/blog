import { createServerFn } from '@tanstack/react-start'
import type { Locale } from '~/i18n/runtime'
import { queries } from './posts.server'

// 서버 함수 요청 URL 에는 언어 접두사가 없으므로 언어는 항상 입력으로 받는다
export const listPostsFn = createServerFn({ method: 'GET' })
  .validator((data: { locale: Locale }) => data)
  .handler(({ data }) => queries.listPosts(data.locale))

export const getPostFn = createServerFn({ method: 'GET' })
  .validator((data: { locale: Locale; slug: string }) => data)
  .handler(({ data }) => queries.getPostPage(data.locale, data.slug))

export const getLobbyIntroFn = createServerFn({ method: 'GET' })
  .validator((data: { locale: Locale }) => data)
  .handler(({ data }) => queries.getLobbyIntro(data.locale))
