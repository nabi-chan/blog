import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { type CommentRow, deleteComment, getComment, insertComment, listComments, toCommentDto, updateCommentBody } from './comments-repo'
import { createTestDb } from '../shared/api/index.testing'

let db: D1Database
let dispose: () => Promise<void>

beforeAll(async () => {
  ;({ db, dispose } = await createTestDb())
})
afterAll(() => dispose())
beforeEach(async () => {
  await db.prepare('DELETE FROM comments').run()
})

const row = (overrides: Partial<CommentRow>): CommentRow => ({
  id: 'c1',
  post_slug: '261020',
  author: '방문자',
  body: '본문',
  is_owner: 0,
  password_hash: 'pbkdf2-sha256$1000$AA==',
  password_salt: 'AA==',
  created_at: '2026-10-20T01:00:00.000Z',
  updated_at: null,
  ...overrides,
})

describe('toCommentDto', () => {
  it('is_owner 를 boolean 으로 바꾸고 해시·솔트·글 slug 는 내보내지 않는다', () => {
    expect(toCommentDto(row({ is_owner: 1, password_hash: null, password_salt: null }))).toEqual({
      id: 'c1',
      author: '방문자',
      body: '본문',
      isOwner: true,
      createdAt: '2026-10-20T01:00:00.000Z',
      updatedAt: null,
    })
  })
})

describe('listComments', () => {
  it('글의 댓글을 오래된 순으로 돌려주고 다른 글 댓글은 섞지 않는다', async () => {
    await insertComment(db, row({ id: 'late', created_at: '2026-10-20T03:00:00.000Z' }))
    await insertComment(db, row({ id: 'early', created_at: '2026-10-20T02:00:00.000Z' }))
    await insertComment(db, row({ id: 'other', post_slug: '261021' }))
    expect((await listComments(db, '261020')).map((comment) => comment.id)).toEqual(['early', 'late'])
  })

  it('같은 시각이면 id 순서다', async () => {
    await insertComment(db, row({ id: 'b' }))
    await insertComment(db, row({ id: 'a' }))
    expect((await listComments(db, '261020')).map((comment) => comment.id)).toEqual(['a', 'b'])
  })
})

describe('getComment', () => {
  it('행 전체를 돌려주고, 없으면 null', async () => {
    await insertComment(db, row({}))
    expect(await getComment(db, 'c1')).toEqual(row({}))
    expect(await getComment(db, 'nope')).toBeNull()
  })
})

describe('updateCommentBody', () => {
  it('본문과 수정 시각을 바꾸고 바뀐 행을 돌려준다', async () => {
    await insertComment(db, row({}))
    const updated = await updateCommentBody(db, 'c1', '고친 본문', '2026-10-20T05:00:00.000Z')
    expect(updated).toEqual(row({ body: '고친 본문', updated_at: '2026-10-20T05:00:00.000Z' }))
  })

  it('없는 id 면 null', async () => {
    expect(await updateCommentBody(db, 'nope', 'x', '2026-10-20T05:00:00.000Z')).toBeNull()
  })
})

describe('deleteComment', () => {
  it('지웠으면 true, 없으면 false', async () => {
    await insertComment(db, row({}))
    expect(await deleteComment(db, 'c1')).toBe(true)
    expect(await deleteComment(db, 'c1')).toBe(false)
    expect(await getComment(db, 'c1')).toBeNull()
  })
})
