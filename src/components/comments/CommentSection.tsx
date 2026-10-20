import { useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CommentDto, MeDto } from '~/api/types'
import { m } from '~/i18n/messages'
import { localizeHref } from '~/i18n/runtime'
import { createApiClient } from '~/lib/api-client'
import { CommentForm } from './CommentForm'
import { CommentItem, type PanelMode } from './CommentItem'

const client = createApiClient()

// 프리렌더 HTML 에는 제목·목록 자리·폼 뼈대만 있고, 댓글과 은솔 여부는 브라우저가 API 로 채운다 (스펙 4.7)
export function CommentSection({ slug }: { slug: string }) {
  const [me, setMe] = useState<MeDto | null>(null)
  const [comments, setComments] = useState<CommentDto[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState<{ id: string; mode: PanelMode } | null>(null)
  const [nearby, setNearby] = useState(false)
  const section = useRef<HTMLElement>(null)
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const reload = useCallback(async () => {
    const result = await client.listComments(slug)
    setFailed(!result.ok)
    if (result.ok) setComments(result.data.comments)
  }, [slug])

  useEffect(() => {
    setComments(null)
    setOpen(null)
    void reload()
  }, [reload])

  useEffect(() => {
    void client.me().then((result) => setMe(result.ok ? result.data : null))
  }, [])

  // Turnstile 스크립트는 댓글 영역이 화면 근처에 왔을 때 불러온다
  useEffect(() => {
    const element = section.current
    if (!element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setNearby(true)
        observer.disconnect()
      },
      { rootMargin: '200px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const owner = me?.owner ?? false
  const shared = { owner, siteKey: me?.turnstileSiteKey ?? '', turnstileActive: nearby }

  return (
    <section ref={section} className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title" className="comments-title">
        {m.comments_title()}
        {comments && comments.length > 0 && <span className="comments-count">{comments.length}</span>}
      </h2>
      <div className="comments-list" aria-live="polite">
        {failed ? (
          <p className="comments-status">{m.comment_error_unavailable()}</p>
        ) : comments === null ? null : comments.length === 0 ? (
          <p className="comments-status">{m.comments_empty()}</p>
        ) : (
          <ol>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                mode={open?.id === comment.id ? open.mode : null}
                onMode={(mode) => setOpen(mode ? { id: comment.id, mode } : null)}
                onChanged={reload}
                {...shared}
              />
            ))}
          </ol>
        )}
      </div>
      <CommentForm slug={slug} {...shared} onCreated={reload} />
      <p className="comments-auth">
        {owner ? (
          <>
            {m.comment_writing_as_owner()} <a href="/cdn-cgi/access/logout">{m.comment_logout()}</a>
          </>
        ) : (
          <a href={`/admin?return=${encodeURIComponent(localizeHref(pathname))}`}>{m.comment_login()}</a>
        )}
      </p>
    </section>
  )
}
