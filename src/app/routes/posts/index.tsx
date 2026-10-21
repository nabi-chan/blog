import { createFileRoute } from '@tanstack/react-router'
import { listPostsFn } from '~/entities/post'
import { PostsPage } from '~/pages/posts'
import { KEY_PATTERN, site } from '~/shared/config'
import { getLocale, m } from '~/shared/i18n'
import { pageHead } from '~/app/seo/head'
import { collectionGraph } from '~/app/seo/json-ld'
import { absoluteUrl } from '~/app/seo/url'

// 페인트 전에 ?category 를 <html data-category> 로 옮긴다. readCategoryParam 과 같은 규칙이다
const APPLY_CATEGORY_SCRIPT = `(function(){var t=new URLSearchParams(location.search).get('category');if(t&&/${KEY_PATTERN.source}/.test(t))document.documentElement.dataset.category=t})()`

export const Route = createFileRoute('/posts/')({
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search.category === 'string' ? { category: search.category } : {},
  loader: () => listPostsFn({ data: { locale: getLocale() } }),
  head: ({ loaderData }) => {
    const locale = getLocale()
    const head = pageHead({
      locale,
      path: '/posts',
      title: `${m.posts_title()} | ${site.name}`,
      description: m.site_description(),
      type: 'website',
      image: absoluteUrl(`/og/${locale}/site.png`),
      alternates: ['ko', 'en'],
      jsonLd: collectionGraph({
        locale,
        title: m.posts_title(),
        posts: (loaderData?.posts ?? []).map((post) => ({ slug: post.slug, title: post.title })),
      }),
    })
    return { ...head, scripts: [...head.scripts, { children: APPLY_CATEGORY_SCRIPT }] }
  },
  component: () => <PostsPage {...Route.useLoaderData()} />,
})
