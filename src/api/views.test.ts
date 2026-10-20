import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, testContext } from './test-utils'
import { handleRecordView, isBotUserAgent, kstDay, pruneViews, readViews, recordView, visitorKey } from './views'

let db: D1Database
let dispose: () => Promise<void>

beforeAll(async () => {
  ;({ db, dispose } = await createTestDb())
})
afterAll(() => dispose())
beforeEach(async () => {
  await db.batch([db.prepare('DELETE FROM post_views'), db.prepare('DELETE FROM site_views'), db.prepare('DELETE FROM site_daily_views'), db.prepare('DELETE FROM view_dedupe')])
})

const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'

describe('kstDay', () => {
  it('KST 날짜를 돌려준다', () => {
    expect(kstDay(new Date('2026-10-20T14:59:59Z'))).toBe('2026-10-20')
    expect(kstDay(new Date('2026-10-20T15:00:00Z'))).toBe('2026-10-21')
  })
})

describe('visitorKey', () => {
  it('같은 입력이면 같은 64자 hex 이고, 날짜가 바뀌면 달라지고, IP 가 드러나지 않는다', async () => {
    const a = await visitorKey('secret', '2026-10-20', '203.0.113.7', CHROME)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(await visitorKey('secret', '2026-10-20', '203.0.113.7', CHROME)).toBe(a)
    expect(await visitorKey('secret', '2026-10-21', '203.0.113.7', CHROME)).not.toBe(a)
    expect(await visitorKey('secret', '2026-10-20', '203.0.113.8', CHROME)).not.toBe(a)
    expect(a).not.toContain('203.0.113.7')
  })
})

describe('isBotUserAgent', () => {
  it('봇·도구 UA 와 빈 UA 를 거른다', () => {
    for (const ua of ['', 'Googlebot/2.1', 'Mozilla/5.0 (compatible; bingbot/2.0)', 'curl/8.0', 'Mozilla/5.0 HeadlessChrome/141', 'python-requests/2.32', 'facebookexternalhit/1.1']) {
      expect(isBotUserAgent(ua)).toBe(true)
    }
  })

  it('일반 브라우저는 통과시킨다', () => {
    expect(isBotUserAgent(CHROME)).toBe(false)
    expect(isBotUserAgent(SAFARI)).toBe(false)
  })
})

describe('recordView', () => {
  it('같은 방문자는 글별 수를 하루 한 번만 올리고, 전체·오늘 수는 매번 올린다', async () => {
    expect(await recordView(db, { slug: '261020', day: '2026-10-20', visitor: 'a' })).toEqual({ site: 1, today: 1, post: 1 })
    expect(await recordView(db, { slug: '261020', day: '2026-10-20', visitor: 'a' })).toEqual({ site: 2, today: 2, post: 1 })
    expect(await recordView(db, { slug: '261020', day: '2026-10-20', visitor: 'b' })).toEqual({ site: 3, today: 3, post: 2 })
  })

  it('오늘 수는 KST 날짜가 바뀌면 0 부터 다시 센다', async () => {
    await recordView(db, { slug: '261020', day: '2026-10-20', visitor: 'a' })
    expect(await recordView(db, { slug: '261020', day: '2026-10-21', visitor: 'a' })).toEqual({ site: 2, today: 1, post: 2 })
    const { results } = await db.prepare('SELECT day, count FROM site_daily_views ORDER BY day').all()
    expect(results).toEqual([
      { day: '2026-10-20', count: 1 },
      { day: '2026-10-21', count: 1 },
    ])
  })

  it('글이 아닌 페이지는 전체 수만 올리고 post 키가 없다', async () => {
    const counts = await recordView(db, { day: '2026-10-20', visitor: 'a' })
    expect(counts).toEqual({ site: 1, today: 1 })
    expect('post' in counts).toBe(false)
  })

  it('동시 요청도 하루 1회만 센다', async () => {
    const view = () => recordView(db, { slug: '261020', day: '2026-10-20', visitor: 'a' })
    await Promise.all([view(), view()])
    expect(await readViews(db, '2026-10-20', '261020')).toEqual({ site: 2, today: 2, post: 1 })
  })
})

describe('readViews', () => {
  it('아직 아무도 안 왔으면 0 이다', async () => {
    expect(await readViews(db, '2026-10-20', '261020')).toEqual({ site: 0, today: 0, post: 0 })
    expect(await readViews(db, '2026-10-20')).toEqual({ site: 0, today: 0 })
  })
})

describe('pruneViews', () => {
  it('그제 이전 기록만 지우고 어제·오늘은 남긴다', async () => {
    for (const day of ['2026-10-18', '2026-10-19', '2026-10-20']) await recordView(db, { slug: '261020', day, visitor: 'a' })
    expect(await pruneViews(db, new Date('2026-10-20T03:00:00Z'))).toBe(1)
    const { results } = await db.prepare('SELECT day FROM view_dedupe ORDER BY day').all()
    expect(results).toEqual([{ day: '2026-10-19' }, { day: '2026-10-20' }])
  })
})

describe('handleRecordView', () => {
  const post = (body: unknown) =>
    new Request('https://nabichan.me/api/views', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://nabichan.me' },
      body: JSON.stringify(body),
    })

  it('글별·전체 수를 올려 돌려준다', async () => {
    const res = await handleRecordView(post({ slug: '261020' }), testContext(db, { userAgent: CHROME }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ site: 1, today: 1, post: 1 })
  })

  it('slug 가 없으면 전체 수만 올린다', async () => {
    expect(await (await handleRecordView(post({}), testContext(db, { userAgent: CHROME }))).json()).toEqual({ site: 1, today: 1 })
  })

  it('봇은 세지 않고 지금 수만 돌려준다', async () => {
    await handleRecordView(post({ slug: '261020' }), testContext(db, { userAgent: CHROME }))
    const res = await handleRecordView(post({ slug: '261020' }), testContext(db, { userAgent: 'Googlebot/2.1' }))
    expect(await res.json()).toEqual({ site: 1, today: 1, post: 1 })
  })

  it('없는 글이면 404 이고 아무 수도 올리지 않는다', async () => {
    const res = await handleRecordView(post({ slug: '261099' }), testContext(db, { userAgent: CHROME }))
    expect(res.status).toBe(404)
    expect(await readViews(db, '2026-10-20')).toEqual({ site: 0, today: 0 })
  })

  it('본문이 틀리면 400', async () => {
    for (const body of [{ slug: 3 }, [], 'x']) {
      expect((await handleRecordView(post(body), testContext(db, { userAgent: CHROME }))).status).toBe(400)
    }
  })
})
