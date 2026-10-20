import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ATTEMPT_LIMITS, ATTEMPT_WINDOW_SECONDS, isLimited, pruneAttempts, recordFailure } from './attempts.server'
import { createTestDb } from './test-utils'

let db: D1Database
let dispose: () => Promise<void>

beforeAll(async () => {
  ;({ db, dispose } = await createTestDb())
})
afterAll(() => dispose())
beforeEach(async () => {
  await db.prepare('DELETE FROM attempts').run()
})

// 10분 창의 시작 시각. 창 안에서 시간이 흘러도 같은 창이다
const WINDOW_START = new Date(Math.floor(Date.UTC(2026, 9, 20, 3) / 1000 / ATTEMPT_WINDOW_SECONDS) * ATTEMPT_WINDOW_SECONDS * 1000)
const later = (seconds: number) => new Date(WINDOW_START.getTime() + seconds * 1000)

describe('비밀번호 실패 시도 제한', () => {
  it('한도는 방문자 5회, 댓글 10회, 창은 10분이다', () => {
    expect(ATTEMPT_LIMITS).toEqual({ visitor: 5, comment: 10 })
    expect(ATTEMPT_WINDOW_SECONDS).toBe(600)
  })

  it('실패가 한도에 닿으면 제한한다', async () => {
    for (let count = 1; count <= 4; count++) {
      await recordFailure(db, ['v'], later(count))
      expect(await isLimited(db, [{ key: 'v', max: 5 }], later(count))).toBe(false)
    }
    await recordFailure(db, ['v'], later(5))
    expect(await isLimited(db, [{ key: 'v', max: 5 }], later(5))).toBe(true)
  })

  it('다음 창에서는 풀리고, 다시 실패하면 1부터 센다', async () => {
    for (let count = 0; count < 5; count++) await recordFailure(db, ['v'], later(count))
    const next = later(ATTEMPT_WINDOW_SECONDS)
    expect(await isLimited(db, [{ key: 'v', max: 5 }], next)).toBe(false)
    await recordFailure(db, ['v'], next)
    const row = await db.prepare("SELECT count FROM attempts WHERE key = 'v'").first<{ count: number }>()
    expect(row?.count).toBe(1)
  })

  it('키 여러 개 중 하나만 넘어도 제한한다', async () => {
    for (let count = 0; count < 10; count++) await recordFailure(db, ['comment:c1'], later(count))
    const keys = [
      { key: 'visitor:a', max: 5 },
      { key: 'comment:c1', max: 10 },
    ]
    expect(await isLimited(db, keys, later(20))).toBe(true)
  })

  it('한 번의 기록으로 여러 키를 같이 센다', async () => {
    await recordFailure(db, ['visitor:a', 'comment:c1'], later(1))
    const { results } = await db.prepare('SELECT key, count FROM attempts ORDER BY key').all()
    expect(results).toEqual([
      { key: 'comment:c1', count: 1 },
      { key: 'visitor:a', count: 1 },
    ])
  })

  it('pruneAttempts 는 지난 창의 기록만 지운다', async () => {
    await recordFailure(db, ['old'], later(-1))
    await recordFailure(db, ['now'], later(1))
    expect(await pruneAttempts(db, later(2))).toBe(1)
    const { results } = await db.prepare('SELECT key FROM attempts').all()
    expect(results).toEqual([{ key: 'now' }])
  })
})
