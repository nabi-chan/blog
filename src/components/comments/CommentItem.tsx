import { type FormEvent, useState } from 'react'
import { COMMENT_LIMITS } from '~/api/comment-input'
import type { CommentDto } from '~/api/types'
import { formatDateTime } from '~/content/date'
import { m } from '~/i18n/messages'
import { getLocale } from '~/i18n/runtime'
import { createApiClient } from '~/lib/api-client'
import { commentErrorMessage } from '~/lib/comment-errors'
import { Turnstile } from './Turnstile'

const client = createApiClient()

export type PanelMode = 'edit' | 'delete'

type Shared = { owner: boolean; siteKey: string; turnstileActive: boolean }

type ItemProps = Shared & {
  comment: CommentDto
  mode: PanelMode | null
  onMode: (mode: PanelMode | null) => void
  onChanged: () => Promise<void>
}

export function CommentItem({ comment, mode, onMode, onChanged, ...shared }: ItemProps) {
  // 남은 은솔 댓글을 고칠 수 없으니 버튼도 보이지 않는다
  const editable = shared.owner || !comment.isOwner
  return (
    <li className="comment">
      <div className="comment-head">
        <span className="comment-author">{comment.author}</span>
        {comment.isOwner && <span className="comment-badge">{m.comment_owner_badge()}</span>}
        <time dateTime={comment.createdAt}>{formatDateTime(comment.createdAt, getLocale())}</time>
        {comment.updatedAt && <span>{m.comment_edited()}</span>}
      </div>
      {mode !== 'edit' && <p className="comment-body">{comment.body}</p>}
      {mode ? (
        <CommentPanel
          key={mode}
          comment={comment}
          mode={mode}
          {...shared}
          onCancel={() => onMode(null)}
          onDone={async () => {
            onMode(null)
            await onChanged()
          }}
        />
      ) : (
        editable && (
          <div className="comment-actions">
            <button type="button" onClick={() => onMode('edit')}>
              {m.comment_edit()}
            </button>
            <button type="button" onClick={() => onMode('delete')}>
              {m.comment_delete()}
            </button>
          </div>
        )
      )}
    </li>
  )
}

type PanelProps = Shared & { comment: CommentDto; mode: PanelMode; onCancel: () => void; onDone: () => Promise<void> }

// 수정·삭제 확인 패널. 은솔이 아니면 비밀번호와 Turnstile 을 같이 받는다
function CommentPanel({ comment, mode, owner, siteKey, turnstileActive, onCancel, onDone }: PanelProps) {
  const [body, setBody] = useState(comment.body)
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [widgetKey, setWidgetKey] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!owner && !token) {
      setError(m.comment_turnstile_required())
      return
    }
    setPending(true)
    setError(null)
    const secret = owner ? {} : { password, turnstileToken: token ?? '' }
    const result = mode === 'edit' ? await client.editComment(comment.id, { body, ...secret }) : await client.deleteComment(comment.id, secret)
    setPending(false)
    if (!result.ok) {
      setError(commentErrorMessage(result.error))
      if (!owner) {
        setToken(null)
        setWidgetKey((key) => key + 1)
      }
      return
    }
    await onDone()
  }

  return (
    <form className="comment-panel" method="post" onSubmit={submit}>
      {mode === 'edit' ? (
        <label className="comment-field">
          {m.comment_body()}
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={COMMENT_LIMITS.body.max} rows={4} required />
        </label>
      ) : (
        <p className="comment-confirm">{m.comment_delete_confirm()}</p>
      )}
      {!owner && (
        <label className="comment-field">
          {m.comment_password()}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={COMMENT_LIMITS.password.min}
            maxLength={COMMENT_LIMITS.password.max}
            autoComplete="current-password"
            required
          />
        </label>
      )}
      {!owner && <Turnstile key={widgetKey} siteKey={siteKey} active={turnstileActive} onToken={setToken} />}
      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}
      <div className="comment-panel-actions">
        <button className="comment-submit" type="submit" disabled={pending}>
          {mode === 'edit' ? m.comment_save() : m.comment_delete()}
        </button>
        <button className="comment-cancel" type="button" onClick={onCancel}>
          {m.comment_cancel()}
        </button>
      </div>
    </form>
  )
}
