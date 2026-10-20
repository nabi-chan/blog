import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ATTEMPT_WINDOW_SECONDS, recordFailure } from '~/shared/api/index.server'
import { cleanup } from './cleanup'
import { createTestDb } from '~/shared/api/index.testing'
import { recordView } from '~/features/view-count/index.testing'

let db: D1Database
let dispose: () => Promise<void>

beforeAll(async () => {
  ;({ db, dispose } = await createTestDb())
})
afterAll(() => dispose())

describe('cleanup', () => {
  it('지난 조회 중복 기록과 지난 시도 제한 기록을 지우고 지운 수를 돌려준다', async () => {
    const now = new Date('2026-10-20T19:00:00Z')
    await recordView(db, { slug: '261020', day: '2026-10-19', visitor: 'old' })
    await recordView(db, { slug: '261020', day: '2026-10-21', visitor: 'today' })
    await recordFailure(db, ['old'], new Date(now.getTime() - ATTEMPT_WINDOW_SECONDS * 1000))
    await recordFailure(db, ['now'], now)
    // 조회 한 번이 글과 사이트(*) 두 행을 남긴다
    expect(await cleanup(db, now)).toEqual({ views: 2, attempts: 1 })
    const { results } = await db.prepare('SELECT DISTINCT visitor FROM view_dedupe').all()
    expect(results).toEqual([{ visitor: 'today' }])
    expect(await db.prepare('SELECT key FROM attempts').all()).toMatchObject({ results: [{ key: 'now' }] })
  })
})
