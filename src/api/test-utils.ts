import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { getPlatformProxy } from 'wrangler'
import type { ApiContext } from './router'

const MIGRATIONS_DIR = 'migrations'

// migrations/*.sql 을 문장 단위로 나눈다. D1 exec 는 줄마다 끊어 실행해서 여러 줄 CREATE 문이 깨진다
function readMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .flatMap((name) =>
      readFileSync(join(MIGRATIONS_DIR, name), 'utf8')
        .replace(/--.*$/gm, '')
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean),
    )
}

// 테스트마다 메모리에만 있는 실제 D1(workerd)을 띄운다. migrate: false 는 장애 흉내용
export async function createTestDb(options: { migrate?: boolean } = {}) {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ configPath: 'wrangler.jsonc', persist: false })
  const db = proxy.env.DB
  if (options.migrate ?? true) await db.batch(readMigrations().map((statement) => db.prepare(statement)))
  return { db, dispose: () => proxy.dispose() }
}

// 핸들러 테스트용 ApiContext. 기본은 은솔이 아니고, Turnstile 은 통과하고, 글은 261020 하나만 있다
export function testContext(db: D1Database, overrides: Partial<ApiContext> = {}): ApiContext {
  return {
    db,
    now: () => new Date('2026-10-20T03:00:00Z'),
    ip: '203.0.113.7',
    userAgent: 'Mozilla/5.0',
    isOwner: async () => false,
    verifyTurnstile: async () => 'ok',
    postExists: (slug) => slug === '261020',
    pepper: 'test-pepper',
    viewSalt: 'test-salt',
    ownerName: 'eunsol',
    turnstileSiteKey: '1x00000000000000000000AA',
    ...overrides,
  }
}
