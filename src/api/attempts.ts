// 비밀번호 실패 시도 제한 (스펙 4.7). Rate Limiting 바인딩은 주기가 10·60초뿐이고 위치별 근사치라 D1 로 센다
export const ATTEMPT_WINDOW_SECONDS = 600
export const ATTEMPT_LIMITS = { visitor: 5, comment: 10 } as const

export type AttemptKey = { key: string; max: number }

const windowOf = (now: Date) => Math.floor(now.getTime() / 1000 / ATTEMPT_WINDOW_SECONDS)

export async function isLimited(db: D1Database, keys: AttemptKey[], now: Date): Promise<boolean> {
  const window = windowOf(now)
  const rows = await db.batch<{ count: number }>(
    keys.map(({ key }) => db.prepare('SELECT count FROM attempts WHERE key = ?1 AND window_start = ?2').bind(key, window)),
  )
  return rows.some((row, index) => (row.results[0]?.count ?? 0) >= keys[index].max)
}

// 같은 창이면 1 을 더하고, 창이 바뀌었으면 1 부터 다시 센다
export async function recordFailure(db: D1Database, keys: string[], now: Date): Promise<void> {
  const window = windowOf(now)
  await db.batch(
    keys.map((key) =>
      db
        .prepare(
          `INSERT INTO attempts(key, window_start, count) VALUES (?1, ?2, 1)
           ON CONFLICT(key) DO UPDATE SET
             count = CASE WHEN attempts.window_start = excluded.window_start THEN attempts.count + 1 ELSE 1 END,
             window_start = excluded.window_start`,
        )
        .bind(key, window),
    ),
  )
}

export async function pruneAttempts(db: D1Database, now: Date): Promise<number> {
  const result = await db.prepare('DELETE FROM attempts WHERE window_start < ?1').bind(windowOf(now)).run()
  return result.meta.changes
}
