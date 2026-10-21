import { useRef } from 'react'
import type { PostPage as PostPageData } from '~/entities/post'
import { CommentSection } from '~/features/comment'
import { WidgetMounter } from '~/features/embeds'
import { TermTooltips } from '~/features/term-tooltip'
import { ViewCount, useViewCounts } from '~/features/view-count'
import { getLocale, m } from '~/shared/i18n'
import { formatDate } from '~/shared/lib/date'
import { useActiveHeading } from '../lib/useActiveHeading'
import { Toc } from './Toc'

export function PostPage({ page }: { page: PostPageData }) {
  const { post, html, toc, terms, categories } = page
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
            {/* draft 글은 프로덕션 빌드에서 빠지므로 dev 에서만 보인다 (스펙 4.3) */}
            {post.draft && <span className="draft-badge">{m.post_draft()}</span>}
            <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
            {post.updated && (
              <span>
                {m.post_updated()} <time dateTime={post.updated}>{formatDate(post.updated, locale)}</time>
              </span>
            )}
            <ViewCount label={m.view_post_label()} value={views.post?.slug === post.slug ? views.post.count : null} failed={views.failed} />
          </p>
          {categories.length > 0 && (
            <ul className="post-categories">
              {categories.map((category) => (
                <li key={category.key}>{category.label}</li>
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
