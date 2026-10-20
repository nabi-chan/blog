import { createFileRoute } from '@tanstack/react-router'
import { PostList, listPostsFn } from '~/entities/post'
import { TagFilter } from '~/components/TagFilter'
import { TAG_PATTERN, site } from '~/shared/config'
import { getLocale, m } from '~/shared/i18n'
import { pageHead } from '~/seo/head'
import { collectionGraph } from '~/seo/json-ld'
import { absoluteUrl } from '~/seo/url'

// 페인트 전에 ?tag 를 <html data-tag> 로 옮긴다. readTagParam 과 같은 규칙이다
const APPLY_TAG_SCRIPT = `(function(){var t=new URLSearchParams(location.search).get('tag');if(t&&/${TAG_PATTERN.source}/.test(t))document.documentElement.dataset.tag=t})()`

export const Route = createFileRoute('/posts/')({
  validateSearch: (search: Record<string, unknown>): { tag?: string } =>
    typeof search.tag === 'string' ? { tag: search.tag } : {},
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
    return { ...head, scripts: [...head.scripts, { children: APPLY_TAG_SCRIPT }] }
  },
  component: Posts,
})

function Posts() {
  const { posts, tags } = Route.useLoaderData()
  return (
    <main className="posts">
      <h1 className="display">{m.posts_title()}</h1>
      <TagFilter tags={tags} />
      {posts.length === 0 ? <p>{m.posts_empty()}</p> : <PostList posts={posts} locale={getLocale()} groupByYear />}
    </main>
  )
}
