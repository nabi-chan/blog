import { hmacHex, sha256Hex } from '../shared/lib/crypto'
import { apiError, json, readJson } from '../shared/api/index.server'
import type { ApiContext } from '~/shared/api/index.server'
import type { ViewCountsDto } from '../shared/api'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export function kstDay(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

// 그날의 솔트(HMAC(시크릿, 날짜)) + IP + UA 의 해시. 솔트가 매일 바뀌어 날짜를 넘어 추적할 수 없다 (스펙 4.8)
export async function visitorKey(secret: string, day: string, ip: string, userAgent: string): Promise<string> {
  return sha256Hex(`${await hmacHex(secret, day)}|${ip}|${userAgent}`)
}

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|python-requests|curl|wget|httpclient|facebookexternalhit|embedly/i

export function isBotUserAgent(userAgent: string): boolean {
  return userAgent === '' || BOT_PATTERN.test(userAgent)
}

// 사이트 방문도 글과 같은 view_dedupe 로 하루 1회만 센다. 글 slug(YYMMDD…)와 겹치지 않는 키를 쓴다
const SITE_KEY = '*'
const firstVisitToday = 'NOT EXISTS (SELECT 1 FROM view_dedupe WHERE day = ?1 AND slug = ?2 AND visitor = ?3)'

// 오늘 처음 온 방문자일 때만 올린다. 판정 행(view_dedupe)은 이 문장들 뒤에 넣어야 한다
const countVisit = (db: D1Database, key: string, day: string, visitor: string) => [
  db.prepare(`INSERT INTO site_views(id, count) SELECT 1, 1 WHERE ${firstVisitToday} ON CONFLICT(id) DO UPDATE SET count = count + 1`).bind(day, key, visitor),
  db
    .prepare(`INSERT INTO site_daily_views(day, count) SELECT ?1, 1 WHERE ${firstVisitToday} ON CONFLICT(day) DO UPDATE SET count = count + 1`)
    .bind(day, key, visitor),
]
const countPostView = (db: D1Database, slug: string, day: string, visitor: string) =>
  db
    .prepare(`INSERT INTO post_views(slug, count) SELECT ?2, 1 WHERE ${firstVisitToday} ON CONFLICT(slug) DO UPDATE SET count = count + 1`)
    .bind(day, slug, visitor)
const markSeen = (db: D1Database, key: string, day: string, visitor: string) =>
  db.prepare('INSERT OR IGNORE INTO view_dedupe(day, slug, visitor) VALUES (?1, ?2, ?3)').bind(day, key, visitor)

const siteCount = (db: D1Database) => db.prepare('SELECT count FROM site_views WHERE id = 1')
const dailyCount = (db: D1Database, day: string) => db.prepare('SELECT count FROM site_daily_views WHERE day = ?1').bind(day)
const postCount = (db: D1Database, slug: string) => db.prepare('SELECT count FROM post_views WHERE slug = ?1').bind(slug)

const countOf = (result: D1Result<{ count: number }> | undefined) => result?.results[0]?.count ?? 0

// 한 batch(트랜잭션)로 판정·기록·조회를 한다. batch 안에서는 앞 문장의 changes 를 볼 수 없어서
// "오늘 처음 온 방문자"인지는 SQL 의 NOT EXISTS 로 판정한다 (스펙 4.8). 사이트·글 모두 방문자 하루 1회다 [은솔]
export async function recordView(db: D1Database, input: { slug?: string; day: string; visitor: string }): Promise<ViewCountsDto> {
  const { slug, day, visitor } = input
  const site = [...countVisit(db, SITE_KEY, day, visitor), markSeen(db, SITE_KEY, day, visitor), siteCount(db), dailyCount(db, day)]
  if (slug === undefined) {
    const results = await db.batch<{ count: number }>(site)
    return { site: countOf(results[3]), today: countOf(results[4]) }
  }
  const results = await db.batch<{ count: number }>([
    countPostView(db, slug, day, visitor),
    markSeen(db, slug, day, visitor),
    ...site,
    postCount(db, slug),
  ])
  return { site: countOf(results[5]), today: countOf(results[6]), post: countOf(results[7]) }
}

export async function readViews(db: D1Database, day: string, slug?: string): Promise<ViewCountsDto> {
  const [total, today, post] = await db.batch<{ count: number }>([
    siteCount(db),
    dailyCount(db, day),
    ...(slug === undefined ? [] : [postCount(db, slug)]),
  ])
  return slug === undefined ? { site: countOf(total), today: countOf(today) } : { site: countOf(total), today: countOf(today), post: countOf(post) }
}

// 오늘·어제 기록만 남긴다. 날짜가 바뀌는 순간에 걸친 요청도 중복 판정이 되게 하루를 더 둔다
export async function pruneViews(db: D1Database, now: Date): Promise<number> {
  const result = await db.prepare('DELETE FROM view_dedupe WHERE day < ?1').bind(kstDay(new Date(now.getTime() - DAY_MS))).run()
  return result.meta.changes
}

export async function handleRecordView(request: Request, ctx: ApiContext): Promise<Response> {
  const body = await readJson(request)
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return apiError(400, 'invalid_input')
  const slug = (body as { slug?: unknown }).slug
  if (slug !== undefined && typeof slug !== 'string') return apiError(400, 'invalid_input')
  if (slug !== undefined && !ctx.postExists(slug)) return apiError(404, 'not_found')
  const day = kstDay(ctx.now())
  if (isBotUserAgent(ctx.userAgent)) return json(200, await readViews(ctx.db, day, slug))
  const visitor = await visitorKey(ctx.viewSalt, day, ctx.ip, ctx.userAgent)
  return json(200, await recordView(ctx.db, { slug, day, visitor }))
}
