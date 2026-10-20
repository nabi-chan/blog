import { createFileRoute, notFound } from '@tanstack/react-router'
import { Toc } from '~/components/Toc'
import { getPostFn } from '~/content/posts.functions'
import { m } from '~/i18n/messages'
import { getLocale } from '~/i18n/runtime'

export const Route = createFileRoute('/posts/$slug')({
  loader: async ({ params }) => {
    const page = await getPostFn({ data: { locale: getLocale(), slug: params.slug } })
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `${loaderData.post.title} | eunsol` }] : [],
  }),
  component: Post,
})

function Post() {
  const { post, html, toc } = Route.useLoaderData()
  return (
    <main>
      <article>
        <h1>{post.title}</h1>
        <Toc items={toc} title={m.post_toc()} />
        {/* 본문은 빌드 시점에 만든 HTML 이다. 프리렌더 HTML 과 hydration 데이터에 같은 문자열이 실린다 */}
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  )
}
