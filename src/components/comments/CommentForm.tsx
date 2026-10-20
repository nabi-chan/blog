import { type FormEvent, useEffect, useState } from 'react'
import { COMMENT_LIMITS } from '~/api/comment-input'
import { m } from '~/shared/i18n'
import { createApiClient } from '~/lib/api-client'
import { commentErrorMessage } from '~/lib/comment-errors'
import { Turnstile } from './Turnstile'

const client = createApiClient()

type Props = { slug: string; owner: boolean; siteKey: string; turnstileActive: boolean; onCreated: () => Promise<void> }

export function CommentForm({ slug, owner, siteKey, turnstileActive, onCreated }: Props) {
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [widgetKey, setWidgetKey] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // hydration 전에는 보내지 않는다. 브라우저 기본 제출이 비밀번호를 주소에 싣지 않게 한다
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!owner && !token) {
      setError(m.comment_turnstile_required())
      return
    }
    setPending(true)
    setError(null)
    const result = await client.createComment(slug, owner ? { body } : { author, body, password, turnstileToken: token ?? '' })
    setPending(false)
    if (!owner) {
      setToken(null)
      setWidgetKey((key) => key + 1)
    }
    if (!result.ok) {
      setError(commentErrorMessage(result.error))
      return
    }
    setBody('')
    setPassword('')
    await onCreated()
  }

  return (
    <form className="comment-form" method="post" onSubmit={submit}>
      {!owner && (
        <div className="comment-form-row">
          <label className="comment-field">
            {m.comment_author()}
            <input
              name="author"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              maxLength={COMMENT_LIMITS.author.max}
              autoComplete="nickname"
              required
            />
          </label>
          <label className="comment-field">
            {m.comment_password()}
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={COMMENT_LIMITS.password.min}
              maxLength={COMMENT_LIMITS.password.max}
              autoComplete="new-password"
              required
            />
            <small className="comment-hint">{m.comment_password_hint()}</small>
          </label>
        </div>
      )}
      <label className="comment-field">
        {m.comment_body()}
        <textarea name="body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={COMMENT_LIMITS.body.max} rows={4} required />
      </label>
      {!owner && <Turnstile key={widgetKey} siteKey={siteKey} active={turnstileActive} onToken={setToken} />}
      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}
      <button className="comment-submit" type="submit" disabled={!ready || pending}>
        {m.comment_submit()}
      </button>
    </form>
  )
}
