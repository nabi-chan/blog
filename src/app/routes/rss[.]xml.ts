import { createFileRoute } from '@tanstack/react-router'
import { queries } from '~/entities/post/index.server'
import { getLocale, m } from '~/shared/i18n'
import { buildRss } from '~/app/seo/rss'
import { site } from '~/shared/config'

// /rss.xml, /en/rss.xml. 빌드 때 프리렌더해서 정적 파일로 굳는다 (정적 서빙은 확장자로 application/xml 을 붙인다)
export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: () => {
        const locale = getLocale()
        const xml = buildRss({ locale, title: site.name, description: m.site_description(), items: queries.listFeed(locale) })
        return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
      },
    },
  },
})
