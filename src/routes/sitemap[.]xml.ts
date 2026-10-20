import { createFileRoute } from '@tanstack/react-router'
import { postIndex } from '~/content/posts.server'
import { getLocale } from '~/i18n/runtime'
import { buildSitemap, sitemapEntries } from '~/seo/sitemap'

// 빌드 때 프리렌더해서 정적 파일로 굳는다. 언어와 무관한 파일이라 /en/sitemap.xml 은 없는 경로로 둔다
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        getLocale() === 'ko'
          ? new Response(buildSitemap(sitemapEntries(postIndex)), { headers: { 'content-type': 'application/xml; charset=utf-8' } })
          : new Response('Not Found', { status: 404 }),
    },
  },
})
