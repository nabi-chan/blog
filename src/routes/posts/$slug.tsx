import { createFileRoute, notFound } from '@tanstack/react-router'
import { useRef } from 'react'
import { TermTooltips } from '~/components/TermTooltips'
import { Toc } from '~/components/Toc'
import { WidgetMounter } from '~/components/WidgetMounter'
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
  const { post, html, toc, terms } = Route.useLoaderData()
  const body = useRef<HTMLDivElement>(null)
  return (
    <main>
      <article>
        <h1>{post.title}</h1>
        <Toc items={toc} title={m.post_toc()} />
        {/* 본문은 빌드 시점에 만든 HTML 이다. 프리렌더 HTML 과 hydration 데이터에 같은 문자열이 실린다 */}
        <div ref={body} className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        <TermTooltips container={body} terms={terms} />
        <WidgetMounter container={body} />
      </article>
    </main>
  )
}
