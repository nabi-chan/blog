import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleCreateComment, handleDeleteComment, handleEditComment, handleListComments, handleMe } from './comments'
import type { ApiContext } from './router'
import { createTestDb, testContext } from './test-utils'
import type { CommentDto } from './types'

let db: D1Database
let dispose: () => Promise<void>

beforeAll(async () => {
  ;({ db, dispose } = await createTestDb())
})
afterAll(() => dispose())
beforeEach(async () => {
  await db.batch([db.prepare('DELETE FROM comments'), db.prepare('DELETE FROM attempts')])
})

const SITE = 'https://nabichan.me'
const request = (method: string, path: string, body: unknown) =>
  new Request(`${SITE}${path}`, {
    method,
    headers: { 'content-type': 'application/json', origin: SITE },
    body: JSON.stringify(body),
  })

const guest = { author: '방문자', body: '좋은 글이에요', password: 'pass1234', turnstileToken: 'tok' }

async function create(ctx: ApiContext, body: unknown = guest, slug = '261020') {
  const res = await handleCreateComment(request('POST', `/api/posts/${slug}/comments`, body), ctx, slug)
  return { res, comment: res.status === 201 ? ((await res.clone().json()) as { comment: CommentDto }).comment : undefined }
}

const edit = (ctx: ApiContext, id: string, body: unknown) => handleEditComment(request('PATCH', `/api/comments/${id}`, body), ctx, id)
const remove = (ctx: ApiContext, id: string, body: unknown) => handleDeleteComment(request('DELETE', `/api/comments/${id}`, body), ctx, id)
const owner = () => testContext(db, { isOwner: async () => true })

describe('handleCreateComment', () => {
  it('남의 댓글을 쓰고, 응답과 DB 어디에도 평문 비밀번호가 없다', async () => {
    const { res, comment } = await create(testContext(db))
    expect(res.status).toBe(201)
    expect(comment).toMatchObject({ author: '방문자', body: '좋은 글이에요', isOwner: false, updatedAt: null })
    expect(Object.keys(comment ?? {})).not.toContain('password_hash')
    const row = await db.prepare('SELECT * FROM comments').first<Record<string, unknown>>()
    expect(JSON.stringify(row)).not.toContain('pass1234')
    expect(String(row?.password_hash)).toMatch(/^pbkdf2-sha256\$/)
  })

  it('은솔 댓글은 이름이 eunsol 이고 비밀번호 없이 저장된다', async () => {
    const { res, comment } = await create(owner(), { body: '감사합니다' })
    expect(res.status).toBe(201)
    expect(comment).toMatchObject({ author: 'eunsol', isOwner: true })
    const row = await db.prepare('SELECT password_hash, password_salt FROM comments').first()
    expect(row).toEqual({ password_hash: null, password_salt: null })
  })

  it('예약 이름은 403, 은솔은 그 이름을 쓴다', async () => {
    const { res } = await create(testContext(db), { ...guest, author: '은솔' })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'reserved_name' })
    expect((await create(owner(), { author: '은솔', body: 'x' })).res.status).toBe(201)
  })

  it('Turnstile 실패는 403, 장애는 503 이고 저장하지 않는다', async () => {
    const failed = await create(testContext(db, { verifyTurnstile: async () => 'failed' }))
    expect(failed.res.status).toBe(403)
    expect(await failed.res.json()).toEqual({ error: 'turnstile_failed' })
    const down = await create(testContext(db, { verifyTurnstile: async () => 'unavailable' }))
    expect(down.res.status).toBe(503)
    expect(await down.res.json()).toEqual({ error: 'unavailable' })
    expect(await db.prepare('SELECT COUNT(*) AS n FROM comments').first('n')).toBe(0)
  })

  it('없는 글은 404, 입력 오류는 400', async () => {
    expect((await create(testContext(db), guest, '261099')).res.status).toBe(404)
    expect((await create(testContext(db), { ...guest, password: 'abc' })).res.status).toBe(400)
  })

  it('은솔도 Turnstile 을 거치지 않는다', async () => {
    const verifyTurnstile = vi.fn(async () => 'failed' as const)
    expect((await create(testContext(db, { isOwner: async () => true, verifyTurnstile }), { body: 'x' })).res.status).toBe(201)
    expect(verifyTurnstile).not.toHaveBeenCalled()
  })
})

describe('handleListComments', () => {
  it('오래된 순으로 돌려준다', async () => {
    let now = new Date('2026-10-20T01:00:00Z')
    const ctx = testContext(db, { now: () => now })
    await create(ctx, { ...guest, body: '첫째' })
    now = new Date('2026-10-20T02:00:00Z')
    await create(ctx, { ...guest, body: '둘째' })
    const res = await handleListComments(ctx, '261020')
    expect(res.status).toBe(200)
    const { comments } = (await res.json()) as { comments: CommentDto[] }
    expect(comments.map((comment) => comment.body)).toEqual(['첫째', '둘째'])
  })

  it('없는 글은 404', async () => {
    expect((await handleListComments(testContext(db), '261099')).status).toBe(404)
  })
})

describe('handleEditComment / handleDeleteComment', () => {
  it('맞는 비밀번호로 고치면 수정 시각이 생기고, 지우면 사라진다', async () => {
    const ctx = testContext(db)
    const { comment } = await create(ctx)
    const res = await edit(ctx, comment!.id, { body: '고친 내용', password: 'pass1234', turnstileToken: 'tok' })
    expect(res.status).toBe(200)
    expect(((await res.json()) as { comment: CommentDto }).comment).toMatchObject({ body: '고친 내용', updatedAt: '2026-10-20T03:00:00.000Z' })
    const deleted = await remove(ctx, comment!.id, { password: 'pass1234', turnstileToken: 'tok' })
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe('')
    expect(await db.prepare('SELECT COUNT(*) AS n FROM comments').first('n')).toBe(0)
  })

  it('틀린 비밀번호는 403 wrong_password 이고 실패가 기록된다', async () => {
    const ctx = testContext(db)
    const { comment } = await create(ctx)
    const res = await remove(ctx, comment!.id, { password: 'wrong-pass', turnstileToken: 'tok' })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'wrong_password' })
    const { results } = await db.prepare('SELECT key, count FROM attempts ORDER BY key').all<{ key: string; count: number }>()
    expect(results.map((row) => row.key)).toEqual([`comment:${comment!.id}`, expect.stringMatching(/^visitor:[0-9a-f]{64}$/)])
    expect(JSON.stringify(results)).not.toContain('203.0.113.7')
  })

  it('남은 은솔 댓글을 고칠 수 없다', async () => {
    const { comment } = await create(owner(), { body: '은솔 댓글' })
    const ctx = testContext(db)
    for (const res of [
      await edit(ctx, comment!.id, { body: 'x', password: 'anything', turnstileToken: 'tok' }),
      await remove(ctx, comment!.id, { password: 'anything', turnstileToken: 'tok' }),
    ]) {
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ error: 'wrong_password' })
    }
  })

  it('제한에 걸리면 맞는 비밀번호도 429', async () => {
    const ctx = testContext(db)
    const { comment } = await create(ctx)
    for (let count = 0; count < 5; count++) await remove(ctx, comment!.id, { password: 'wrong-pass', turnstileToken: 'tok' })
    const res = await remove(ctx, comment!.id, { password: 'pass1234', turnstileToken: 'tok' })
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'too_many_attempts' })
    expect(await db.prepare('SELECT COUNT(*) AS n FROM comments').first('n')).toBe(1)
  })

  it('여러 IP 로 한 댓글에 10번 틀리면 그 댓글은 429', async () => {
    const { comment } = await create(testContext(db))
    for (let count = 0; count < 10; count++) {
      await remove(testContext(db, { ip: `198.51.100.${count}` }), comment!.id, { password: 'wrong-pass', turnstileToken: 'tok' })
    }
    const res = await remove(testContext(db, { ip: '198.51.100.99' }), comment!.id, { password: 'pass1234', turnstileToken: 'tok' })
    expect(res.status).toBe(429)
  })

  it('Turnstile 이 실패하면 비밀번호를 보지 않고 403, 장애면 503', async () => {
    const { comment } = await create(testContext(db))
    const failed = testContext(db, { verifyTurnstile: async () => 'failed' })
    expect((await remove(failed, comment!.id, { password: 'pass1234', turnstileToken: 'tok' })).status).toBe(403)
    const down = testContext(db, { verifyTurnstile: async () => 'unavailable' })
    expect((await edit(down, comment!.id, { body: 'x', password: 'pass1234', turnstileToken: 'tok' })).status).toBe(503)
    expect(await db.prepare('SELECT COUNT(*) AS n FROM attempts').first('n')).toBe(0)
  })

  it('은솔은 남의 댓글을 비밀번호 없이 고치고 지운다', async () => {
    const { comment } = await create(testContext(db))
    expect((await edit(owner(), comment!.id, { body: '은솔이 고침' })).status).toBe(200)
    expect((await remove(owner(), comment!.id, {})).status).toBe(204)
  })

  it('없는 댓글은 404, 입력 오류는 400', async () => {
    expect((await remove(testContext(db), 'nope', { password: 'pass1234', turnstileToken: 'tok' })).status).toBe(404)
    expect((await edit(owner(), 'nope', { body: 'x' })).status).toBe(404)
    expect((await remove(owner(), 'nope', {})).status).toBe(404)
    expect((await edit(testContext(db), 'nope', { body: '' })).status).toBe(400)
    expect((await remove(testContext(db), 'nope', { password: 'abc', turnstileToken: 'tok' })).status).toBe(400)
  })
})

describe('handleMe', () => {
  it('은솔 여부와 Turnstile 사이트 키를 돌려준다', async () => {
    expect(await (await handleMe(testContext(db))).json()).toEqual({ owner: false, turnstileSiteKey: '1x00000000000000000000AA' })
    expect(await (await handleMe(owner())).json()).toMatchObject({ owner: true })
  })
})
