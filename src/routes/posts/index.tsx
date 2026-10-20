import { createFileRoute } from '@tanstack/react-router'
import { PostList } from '~/components/PostList'
import { TagFilter } from '~/components/TagFilter'
import { TAG_PATTERN } from '~/content/constants'
import { listPostsFn } from '~/content/posts.functions'
import { m } from '~/i18n/messages'
import { getLocale } from '~/i18n/runtime'
import { site } from '~/site'

// 페인트 전에 ?tag 를 <html data-tag> 로 옮긴다. readTagParam 과 같은 규칙이다
const APPLY_TAG_SCRIPT = `(function(){var t=new URLSearchParams(location.search).get('tag');if(t&&/${TAG_PATTERN.source}/.test(t))document.documentElement.dataset.tag=t})()`

export const Route = createFileRoute('/posts/')({
  validateSearch: (search: Record<string, unknown>): { tag?: string } =>
    typeof search.tag === 'string' ? { tag: search.tag } : {},
  loader: () => listPostsFn({ data: { locale: getLocale() } }),
  head: () => ({
    meta: [{ title: `${m.posts_title()} | ${site.name}` }],
    scripts: [{ children: APPLY_TAG_SCRIPT }],
  }),
  component: Posts,
})

function Posts() {
  const { posts, tags } = Route.useLoaderData()
  return (
    <main className="posts">
      <h1>{m.posts_title()}</h1>
      <TagFilter tags={tags} />
      {posts.length === 0 ? <p>{m.posts_empty()}</p> : <PostList posts={posts} locale={getLocale()} groupByYear />}
    </main>
  )
}
