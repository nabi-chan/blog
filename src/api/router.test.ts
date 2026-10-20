import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { routeApi } from './router'
import { createTestDb, testContext } from './test-utils'

let db: D1Database
let dispose: () => Promise<void>

beforeAll(async () => {
  ;({ db, dispose } = await createTestDb())
})
afterAll(() => dispose())

const SITE = 'https://nabichan.me'
const call = (path: string, init: RequestInit = {}, database = db) => routeApi(new Request(`${SITE}${path}`, init), testContext(database))
const jsonInit = (method: string, body: unknown, origin: string | null = SITE): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json', ...(origin === null ? {} : { origin }) },
  body: JSON.stringify(body),
})

describe('routeApi', () => {
  it('GET /api/me', async () => {
    const res = await call('/api/me')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ owner: false, turnstileSiteKey: '1x00000000000000000000AA' })
  })

  it('쓰기 요청은 Origin 이 같아야 하고, 다르면 저장하지 않는다', async () => {
    const body = { author: '방문자', body: '안녕', password: 'pass1234', turnstileToken: 'tok' }
    for (const origin of [null, 'https://evil.example']) {
      const res = await call('/api/posts/261020/comments', jsonInit('POST', body, origin))
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ error: 'forbidden_origin' })
    }
    expect(await db.prepare('SELECT COUNT(*) AS n FROM comments').first('n')).toBe(0)
    expect((await call('/api/posts/261020/comments', jsonInit('POST', body))).status).toBe(201)
  })

  it('JSON 이 아닌 본문은 400', async () => {
    const res = await call('/api/posts/261020/comments', {
      method: 'POST',
      headers: { 'content-type': 'text/plain', origin: SITE },
      body: '{}',
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_input' })
  })

  it('경로가 없으면 404, 메서드가 틀리면 405', async () => {
    expect((await call('/api/nope')).status).toBe(404)
    expect((await call('/api/posts/261020')).status).toBe(404)
    const res = await call('/api/comments/x', jsonInit('PUT', {}))
    expect(res.status).toBe(405)
    expect(await res.json()).toEqual({ error: 'invalid_input' })
    expect((await call('/api/me', jsonInit('POST', {}))).status).toBe(405)
  })

  it('PATCH·DELETE 를 댓글 핸들러로 보낸다', async () => {
    expect((await call('/api/comments/nope', jsonInit('PATCH', { body: 'x', password: 'pass1234', turnstileToken: 'tok' }))).status).toBe(404)
    expect((await call('/api/comments/nope', jsonInit('DELETE', { password: 'pass1234', turnstileToken: 'tok' }))).status).toBe(404)
  })

  it('경로 조각은 디코딩하고, 디코딩할 수 없으면 404', async () => {
    expect((await call('/api/posts/%32%36%31%30%32%30/comments')).status).toBe(200)
    expect((await call('/api/posts/%E0/comments')).status).toBe(404)
  })

  it('POST /api/views 는 Origin 이 같아야 한다', async () => {
    expect((await call('/api/views', jsonInit('POST', {}, 'https://evil.example'))).status).toBe(403)
    expect((await call('/api/views', jsonInit('POST', {}))).status).toBe(200)
    expect((await call('/api/views')).status).toBe(405)
  })

  it('조회수도 D1 이 실패하면 0 이 아니라 503 이다', async () => {
    const broken = await createTestDb({ migrate: false })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await call('/api/views', jsonInit('POST', { slug: '261020' }), broken.db)
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'unavailable' })
    error.mockRestore()
    await broken.dispose()
  })

  it('D1 이 실패하면 원인을 남기고 503 을 돌려준다', async () => {
    const broken = await createTestDb({ migrate: false })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await call('/api/posts/261020/comments', {}, broken.db)
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'unavailable' })
    expect(error).toHaveBeenCalled()
    error.mockRestore()
    await broken.dispose()
  })
})
