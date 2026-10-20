import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from './api-client'

type Call = { url: string; method: string; headers: Record<string, string>; body: string | null }

function fakeFetch(respond: () => Response | Promise<Response>) {
  const calls: Call[] = []
  const fetchFn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({
      url: String(input),
      method: init.method ?? 'GET',
      headers: Object.fromEntries(new Headers(init.headers).entries()),
      body: (init.body as string | undefined) ?? null,
    })
    return respond()
  }) as unknown as typeof fetch
  return { client: createApiClient(fetchFn), calls }
}

const comment = { id: 'c1', author: '방문자', body: '안녕', isOwner: false, createdAt: '2026-10-20T00:00:00.000Z', updatedAt: null }

describe('createApiClient', () => {
  it('me 와 댓글 목록은 GET 이다', async () => {
    const { client, calls } = fakeFetch(() => Response.json({ owner: false, turnstileSiteKey: 'k' }))
    expect(await client.me()).toEqual({ ok: true, data: { owner: false, turnstileSiteKey: 'k' } })
    await client.listComments('261020')
    expect(calls.map(({ url, method }) => [url, method])).toEqual([
      ['/api/me', 'GET'],
      ['/api/posts/261020/comments', 'GET'],
    ])
  })

  it('쓰기는 JSON 으로 보내고 경로 조각을 인코딩한다', async () => {
    const { client, calls } = fakeFetch(() => Response.json({ comment }, { status: 201 }))
    const input = { author: '방문자', body: '안녕', password: 'pass1234', turnstileToken: 'tok' }
    expect(await client.createComment('261020', input)).toEqual({ ok: true, data: { comment } })
    await client.editComment('a/b', { body: '고침', password: 'pass1234', turnstileToken: 'tok' })
    expect(calls[0]).toEqual({
      url: '/api/posts/261020/comments',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    expect(calls[1]).toMatchObject({ url: '/api/comments/a%2Fb', method: 'PATCH' })
  })

  it('삭제는 204 를 data: null 로 돌려준다', async () => {
    const { client, calls } = fakeFetch(() => new Response(null, { status: 204 }))
    expect(await client.deleteComment('c1', {})).toEqual({ ok: true, data: null })
    expect(calls[0]).toMatchObject({ url: '/api/comments/c1', method: 'DELETE', body: '{}' })
  })

  it('오류 응답은 상태와 오류 코드를 돌려준다', async () => {
    const { client } = fakeFetch(() => Response.json({ error: 'wrong_password' }, { status: 403 }))
    expect(await client.deleteComment('c1', { password: 'x', turnstileToken: 't' })).toEqual({ ok: false, status: 403, error: 'wrong_password' })
  })

  it('오류 본문을 읽을 수 없으면 unavailable', async () => {
    const { client } = fakeFetch(() => new Response('<html>Bad Gateway', { status: 502 }))
    expect(await client.listComments('261020')).toEqual({ ok: false, status: 502, error: 'unavailable' })
  })

  it('연결이 안 되면 network', async () => {
    const { client } = fakeFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    expect(await client.me()).toEqual({ ok: false, status: 0, error: 'network' })
  })

  it('fetch 를 넘기지 않으면 부를 때의 전역 fetch 를 쓴다', async () => {
    const global = vi.fn(async () => Response.json({ site: 1 }))
    vi.stubGlobal('fetch', global)
    expect(await createApiClient().recordView()).toEqual({ ok: true, data: { site: 1 } })
    expect(global).toHaveBeenCalledWith('/api/views', expect.objectContaining({ method: 'POST' }))
    vi.unstubAllGlobals()
  })

  it('recordView 는 slug 가 있을 때만 본문에 싣는다', async () => {
    const { client, calls } = fakeFetch(() => Response.json({ site: 3 }))
    expect(await client.recordView()).toEqual({ ok: true, data: { site: 3 } })
    await client.recordView('261020')
    expect(calls.map(({ url, method, body }) => [url, method, body])).toEqual([
      ['/api/views', 'POST', '{}'],
      ['/api/views', 'POST', '{"slug":"261020"}'],
    ])
  })
})
