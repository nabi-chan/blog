import { createFileRoute } from '@tanstack/react-router'
import { getLobbyIntroFn, listPostsFn } from '~/entities/post'
import { HomePage } from '~/pages/home'
import { getLocale, m } from '~/shared/i18n'
import { pageHead } from '~/app/seo/head'
import { siteGraph } from '~/app/seo/json-ld'
import { absoluteUrl } from '~/app/seo/url'

export const Route = createFileRoute('/')({
  loader: async () => {
    const locale = getLocale()
    const [list, intro] = await Promise.all([listPostsFn({ data: { locale } }), getLobbyIntroFn({ data: { locale } })])
    return { posts: list.posts, intro }
  },
  head: () => {
    const locale = getLocale()
    return pageHead({
      locale,
      path: '/',
      title: m.site_title(),
      description: m.site_description(),
      type: 'website',
      image: absoluteUrl(`/og/${locale}/site.png`),
      alternates: ['ko', 'en'],
      jsonLd: siteGraph(locale),
    })
  },
  component: () => <HomePage {...Route.useLoaderData()} />,
})
