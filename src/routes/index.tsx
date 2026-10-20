import { Link, createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { PostList } from '~/components/PostList'
import { ViewCount, useViewCounts } from '~/components/ViewCounts'
import { TermTooltips } from '~/components/TermTooltips'
import { WidgetMounter } from '~/components/WidgetMounter'
import { getLobbyIntroFn, listPostsFn } from '~/content/posts.functions'
import { m } from '~/i18n/messages'
import { getLocale } from '~/i18n/runtime'

const RECENT_COUNT = 5

export const Route = createFileRoute('/')({
  loader: async () => {
    const locale = getLocale()
    const [list, intro] = await Promise.all([listPostsFn({ data: { locale } }), getLobbyIntroFn({ data: { locale } })])
    return { posts: list.posts, intro }
  },
  component: Lobby,
})

function Lobby() {
  const { posts, intro } = Route.useLoaderData()
  const locale = getLocale()
  const introRef = useRef<HTMLDivElement>(null)
  const views = useViewCounts()
  return (
    <main className="lobby">
      {/* 사이트 PV. 레이블은 프리렌더하고 숫자는 브라우저가 채운다 */}
      <p className="lobby-views meta-list">
        <ViewCount label={m.lobby_views_today()} value={views.today} failed={views.failed} />
        <ViewCount label={m.lobby_views_total()} value={views.site} failed={views.failed} />
      </p>
      {intro && (
        <>
          {/* content/lobby/index.{ko,en}.md 를 빌드할 때 만든 HTML */}
          <div ref={introRef} className="prose lobby-intro" dangerouslySetInnerHTML={{ __html: intro.html }} />
          <TermTooltips container={introRef} terms={intro.terms} />
          <WidgetMounter container={introRef} />
        </>
      )}
      <section>
        <h2 className="section-title">{m.lobby_recent_posts()}</h2>
        {posts.length === 0 ? (
          <p>{m.posts_empty()}</p>
        ) : (
          <PostList posts={posts.slice(0, RECENT_COUNT)} locale={locale} />
        )}
      </section>
      <Link to="/posts" className="lobby-more">
        {m.lobby_view_all()}
      </Link>
    </main>
  )
}
