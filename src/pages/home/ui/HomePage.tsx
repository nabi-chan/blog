import { Link } from '@tanstack/react-router'
import { useRef } from 'react'
import { type LobbyIntro, type PostMeta, PostList } from '~/entities/post'
import { WidgetMounter } from '~/features/embeds'
import { TermTooltips } from '~/features/term-tooltip'
import { ViewCount, useViewCounts } from '~/features/view-count'
import { site } from '~/shared/config'
import { getLocale, m } from '~/shared/i18n'

const RECENT_COUNT = 5

export function HomePage({ posts, intro }: { posts: PostMeta[]; intro: LobbyIntro | null }) {
  const locale = getLocale()
  const introRef = useRef<HTMLDivElement>(null)
  const views = useViewCounts()
  return (
    <main className="lobby">
      {/* 문서 제목 구조용. 화면에는 헤더의 사이트 이름이 같은 역할을 한다 */}
      <h1 className="sr-only">{site.name}</h1>
      {/* 사이트 오늘·전체 조회수(방문자 하루 1회). 레이블은 프리렌더하고 숫자는 브라우저가 채운다 */}
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
      {/* 최근 글이 다섯 편 이상일 때만 전체 목록으로 보낸다 [은솔] */}
      {posts.length >= RECENT_COUNT && (
        <Link to="/posts" className="lobby-more">
          {m.lobby_view_all()}
        </Link>
      )}
    </main>
  )
}
