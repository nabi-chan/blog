import { pruneAttempts } from '../shared/api/index.server'
import { pruneViews } from './views'

// Cron(하루 한 번)이 부른다. 계속 쌓이는 중복 판정·시도 제한 기록을 지운다
export async function cleanup(db: D1Database, now: Date): Promise<{ views: number; attempts: number }> {
  return { views: await pruneViews(db, now), attempts: await pruneAttempts(db, now) }
}
