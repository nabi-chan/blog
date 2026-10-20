import { createFileRoute } from '@tanstack/react-router'
import { queries } from '~/entities/post/index.server'
import { getLocale } from '~/shared/i18n'
import { buildLlmsFull } from '~/seo/llms'

// 두 언어 원문을 한 파일에 담는다. /en/llms-full.txt 는 없는 경로로 둔다
export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: () =>
        getLocale() === 'ko'
          ? new Response(buildLlmsFull({ ko: queries.listFeed('ko'), en: queries.listFeed('en') }), {
              headers: { 'content-type': 'text/plain; charset=utf-8' },
            })
          : new Response('Not Found', { status: 404 }),
    },
  },
})
