import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDb } from './test-utils'

let db: D1Database
let dispose: () => Promise<void>

beforeAll(async () => {
  ;({ db, dispose } = await createTestDb())
})
afterAll(() => dispose())

const insertComment = (id: string, isOwner: number, hash: string | null, salt: string | null) =>
  db
    .prepare(
      `INSERT INTO comments(id, post_slug, author, body, is_owner, password_hash, password_salt, created_at)
       VALUES (?1, '261020', 'a', 'b', ?2, ?3, ?4, '2026-10-20T00:00:00.000Z')`,
    )
    .bind(id, isOwner, hash, salt)
    .run()

describe('마이그레이션 스키마', () => {
  it('남의 댓글은 비밀번호 해시 없이 들어가지 않는다', async () => {
    await expect(insertComment('c1', 0, null, null)).rejects.toThrow(/CHECK/)
  })

  it('은솔 댓글은 비밀번호 없이 들어간다', async () => {
    await expect(insertComment('c2', 1, null, null)).resolves.toMatchObject({ success: true })
  })

  it('site_views 는 id 1 한 행만 허용한다', async () => {
    await expect(db.prepare('INSERT INTO site_views(id, count) VALUES (2, 0)').run()).rejects.toThrow(/CHECK/)
  })

  it('view_dedupe 는 같은 (day, slug, visitor) 를 한 번만 받는다', async () => {
    const insert = () =>
      db.prepare("INSERT OR IGNORE INTO view_dedupe(day, slug, visitor) VALUES ('2026-10-20', '261020', 'v')").run()
    expect((await insert()).meta.changes).toBe(1)
    expect((await insert()).meta.changes).toBe(0)
  })

  it('attempts 테이블은 key, window_start, count 를 가진다', async () => {
    const { results } = await db.prepare("SELECT name, type, \"notnull\", pk FROM pragma_table_info('attempts')").all()
    expect(results).toEqual([
      { name: 'key', type: 'TEXT', notnull: 1, pk: 1 }, // WITHOUT ROWID 의 기본 키는 NOT NULL 이 된다
      { name: 'window_start', type: 'INTEGER', notnull: 1, pk: 0 },
      { name: 'count', type: 'INTEGER', notnull: 1, pk: 0 },
    ])
  })

  it('댓글 목록용 인덱스가 있다', async () => {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'comments_post_created'").first()
    expect(row).toEqual({ name: 'comments_post_created' })
  })
})
