import { createFileRoute, notFound } from '@tanstack/react-router'
import { useRef } from 'react'
import { TermTooltips } from '~/components/TermTooltips'
import { CommentSection } from '~/components/comments/CommentSection'
import { ViewCount, useViewCounts } from '~/components/ViewCounts'
import { Toc } from '~/components/Toc'
import { WidgetMounter } from '~/components/WidgetMounter'
import { useActiveHeading } from '~/hooks/useActiveHeading'
import { getPostFn } from '~/content/posts.functions'
import { m } from '~/i18n/messages'
import { formatDate } from '~/content/date'
import { getLocale } from '~/i18n/runtime'
import { site } from '~/site'

export const Route = createFileRoute('/$slug')({
  loader: async ({ params }) => {
    const page = await getPostFn({ data: { locale: getLocale(), slug: params.slug } })
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `${loaderData.post.title} | ${site.name}` }] : [],
  }),
  component: Post,
})

function Post() {
  const { post, html, toc, terms, tags } = Route.useLoaderData()
  const body = useRef<HTMLDivElement>(null)
  const locale = getLocale()
  const activeId = useActiveHeading(toc.map((item) => item.id))
  const views = useViewCounts()
  return (
    <main className="post">
      <article>
        <header className="post-header">
          <h1 className="display">{post.title}</h1>
          <p className="post-meta meta-list">
            <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
            {post.updated && (
              <span>
                {m.post_updated()} <time dateTime={post.updated}>{formatDate(post.updated, locale)}</time>
              </span>
            )}
            <ViewCount label={m.view_post_label()} value={views.post?.slug === post.slug ? views.post.count : null} failed={views.failed} />
          </p>
          {tags.length > 0 && (
            <ul className="post-tags">
              {tags.map((tag) => (
                <li key={tag.key}>{tag.label}</li>
              ))}
            </ul>
          )}
        </header>
        <div className="post-columns">
          <div className="post-main">
            <Toc items={toc} title={m.post_toc()} variant="compact" activeId={activeId} />
            {/* 본문은 빌드 시점에 만든 HTML 이다. 프리렌더 HTML 과 hydration 데이터에 같은 문자열이 실린다 */}
            <div ref={body} className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            <TermTooltips container={body} terms={terms} />
            <WidgetMounter container={body} />
            <CommentSection slug={post.slug} />
          </div>
          <aside className="post-aside">
            <Toc items={toc} title={m.post_toc()} variant="side" activeId={activeId} />
          </aside>
        </div>
      </article>
    </main>
  )
}
