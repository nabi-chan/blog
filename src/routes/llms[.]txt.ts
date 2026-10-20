import { createFileRoute } from '@tanstack/react-router'
import { queries } from '~/entities/post/index.server'
import { getLocale, m } from '~/shared/i18n'
import { buildLlmsTxt } from '~/seo/llms'

// /llms.txt, /en/llms.txt. 빌드 때 프리렌더한다
export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () => {
        const locale = getLocale()
        const text = buildLlmsTxt({ locale, description: m.site_description(), items: queries.listFeed(locale) })
        return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
      },
    },
  },
})
