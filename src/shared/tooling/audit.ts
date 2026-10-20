// pnpm audit:repo 의 판정 (스펙 5.2). scripts/audit.ts 가 Node 로 바로 불러서 상대 경로만 import 한다
import { SECURITY_HEADERS } from '../lib/security-headers/index.ts'

export type AuditStatus = 'PASS' | 'WARN' | 'FAIL' | 'INFO'
export type AuditResult = { id: string; status: AuditStatus; message: string; details?: string[] }

export function summarize(results: AuditResult[]): { counts: Record<AuditStatus, number>; exitCode: 0 | 1 } {
  const counts: Record<AuditStatus, number> = { PASS: 0, WARN: 0, FAIL: 0, INFO: 0 }
  for (const result of results) counts[result.status] += 1
  return { counts, exitCode: counts.FAIL > 0 ? 1 : 0 }
}

export function formatResult(result: AuditResult): string {
  return [`[${result.status}] ${result.message}`, ...(result.details ?? []).map((line) => `  - ${line}`)].join('\n')
}

export type TranslationState = 'missing' | 'stale' | 'machine' | 'reviewed'

// en 없음 INFO, 낡음 FAIL, 구조 불일치 FAIL, machine INFO(은솔 확인 전), reviewed PASS
export function translationResults(posts: Array<{ slug: string; en: TranslationState; structure: string[] }>): AuditResult[] {
  return posts.map(({ slug, en, structure }): AuditResult => {
    const id = `translation:${slug}`
    if (en === 'missing') return { id, status: 'INFO', message: `번역: ${slug} 영어 번역 없음` }
    if (en === 'stale') return { id, status: 'FAIL', message: `번역: ${slug} 낡음 (pnpm content:rehash --post ${slug} 또는 /translate-post)` }
    if (structure.length > 0) return { id, status: 'FAIL', message: `번역: ${slug} 구조 불일치`, details: structure }
    if (en === 'machine') return { id, status: 'INFO', message: `번역: ${slug} 은솔 확인 전(machine)` }
    return { id, status: 'PASS', message: `번역: ${slug}` }
  })
}

// `git diff --name-status` 출력에서 이미 있던 마이그레이션을 고치거나 지우거나 이름을 바꾼 것 (추가만 허용)
export function changedMigrations(nameStatus: string): string[] {
  return nameStatus
    .split('\n')
    .map((line) => line.split('\t'))
    .filter(([status, path]) => /^[MDR]/.test(status ?? '') && path?.startsWith('migrations/'))
    .map(([, path]) => path)
}

// 이미 커밋한 마이그레이션은 고치지 않는다(AGENTS.md). 기준점에 기대지 않고 작업 트리와 전체 이력을 본다.
// 기준점 방식은 수동 실행·force-push 에서 비교 대상이 없어 아무것도 안 보고 통과했다 (계획 5 최종 리뷰)
// history 는 `git log --diff-filter=MDR --name-status --format= -- migrations` 출력, 못 읽었으면 null
export function migrationCheck(input: { working: string; history: string | null }): AuditResult {
  const changed = [...new Set([...changedMigrations(input.working), ...changedMigrations(input.history ?? '')])]
  if (changed.length > 0) return { id: 'migrations', status: 'FAIL', message: '이미 커밋된 마이그레이션을 고쳤습니다 (새 파일로 추가하세요)', details: changed }
  return input.history === null
    ? { id: 'migrations', status: 'INFO', message: '마이그레이션 수정 검사: 전체 이력을 읽지 못해 작업 트리만 확인함' }
    : { id: 'migrations', status: 'PASS', message: '마이그레이션은 추가만 (전체 이력)' }
}

// `wrangler d1 migrations list` 표에서 미적용 파일 이름.
// 색 코드(FORCE_COLOR 등)를 지우고 읽고, 미적용이 있다는데 이름을 못 읽으면 통과로 두지 않는다
export function pendingMigrations(listOutput: string): string[] {
  const text = listOutput.replace(/\u001b\[[0-9;]*m/g, '')
  const names = [...text.matchAll(/│\s*(\S+\.sql)\s*│/g)].map(([, name]) => name)
  if (names.length === 0 && /Migrations to be applied/i.test(text)) return ['(목록을 읽지 못함 — wrangler 출력을 확인하세요)']
  return names
}

// 예산 (스펙 5.2 --build). 클라이언트 JS 는 계획 4 측정값 128.9KB(gzip)의 1.3배를 10KB 단위로 올린 값이다.
// Worker 는 압축 전 64 MiB 가 모든 플랜의 한도다 (2026-09-04 변경, 스펙 3장). 바꿀 때 AGENTS.md 의 수치도 같이 고친다
export const BUDGETS = { clientJsGzipBytes: 170 * 1024, workerBytes: 64 * 1024 * 1024 } as const

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)}MB`

export function budgetResults(input: { clientJsGzipBytes: number; workerBytes: number }): AuditResult[] {
  const client = input.clientJsGzipBytes
  const worker = input.workerBytes
  return [
    client > BUDGETS.clientJsGzipBytes
      ? { id: 'budget:client', status: 'FAIL', message: `클라이언트 JS ${kb(client)} (gzip) 가 예산 ${kb(BUDGETS.clientJsGzipBytes)} 를 넘습니다` }
      : { id: 'budget:client', status: 'PASS', message: `클라이언트 JS ${kb(client)} (gzip, 예산 ${kb(BUDGETS.clientJsGzipBytes)})` },
    worker > BUDGETS.workerBytes
      ? { id: 'budget:worker', status: 'FAIL', message: `Worker ${mb(worker)} 가 한도 ${mb(BUDGETS.workerBytes)} 를 넘습니다` }
      : worker > BUDGETS.workerBytes / 2
        ? { id: 'budget:worker', status: 'WARN', message: `Worker ${mb(worker)} 가 한도의 절반을 넘었습니다` }
        : { id: 'budget:worker', status: 'PASS', message: `Worker ${mb(worker)} (한도 ${mb(BUDGETS.workerBytes)})` },
  ]
}

// 글 본문은 서버 전용이다. 클라이언트 에셋에 본문 문장이 실린 글 (스펙 5.2 '모든 글이 한 청크에 실렸는지')
export function leakedPostText(assetTexts: string[], posts: Array<{ slug: string; marker: string }>): string[] {
  return posts.filter(({ marker }) => assetTexts.some((text) => text.includes(marker))).map(({ slug }) => slug)
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

// 빠졌거나 값이 다른 보안 헤더. 값은 security-headers.ts 와 글자까지 같아야 한다 (대시보드 규칙이 바꿔도 잡는다)
export function securityHeaderGaps(headers: Headers): string[] {
  return Object.entries(SECURITY_HEADERS).flatMap(([name, value]) => {
    const key = name.toLowerCase()
    const actual = headers.get(key)
    if (actual === null) return [key]
    return actual === value ? [] : [`${key} (값이 다름)`]
  })
}

export type LiveInput = {
  pages: Array<{ path: string; status: number; ttfbMs: number[]; cache: string | null }>
  // 정적 에셋 응답과 Worker 응답을 따로 본다 (헤더를 다는 곳이 다르다)
  headers: Array<{ path: string; headers: Headers }>
  sitemapUrls: string[]
  draftSlugs: string[]
  untranslated: Array<{ slug: string; status: number }>
  metaUrlStatuses: Array<{ url: string; status: number }>
  apiStatus: number
  redirect?: { status: number; location: string | null }
  // http://nabichan.me/ 응답. https 로 올려 보내야 한다
  httpRedirect?: { status: number; location: string | null }
}

// 배포된 사이트 판정 (스펙 5.2 --live)
export function liveResults(input: LiveInput): AuditResult[] {
  const results: AuditResult[] = []
  const badPages = input.pages.filter((page) => page.status !== 200)
  results.push(
    badPages.length === 0
      ? { id: 'live:pages', status: 'PASS', message: `주요 경로 ${input.pages.length}개 200` }
      : { id: 'live:pages', status: 'FAIL', message: '주요 경로 응답이 200 이 아닙니다', details: badPages.map((page) => `${page.path} ${page.status}`) },
  )
  results.push({
    id: 'live:ttfb',
    status: 'INFO',
    message: 'TTFB 중앙값 (5회)',
    details: input.pages.map((page) => `${page.path} ${Math.round(median(page.ttfbMs))}ms (cf-cache-status ${page.cache ?? '없음'})`),
  })
  const gaps = input.headers.flatMap(({ path, headers }) => securityHeaderGaps(headers).map((name) => `${path}: ${name}`))
  results.push(
    gaps.length === 0
      ? { id: 'live:headers', status: 'PASS', message: `보안 헤더 (응답 ${input.headers.length}개)` }
      : { id: 'live:headers', status: 'FAIL', message: '보안 헤더가 빠졌습니다', details: gaps },
  )
  const leaked = input.draftSlugs.filter((slug) => input.sitemapUrls.some((url) => new URL(url).pathname.replace(/^\/en/, '') === `/${slug}`))
  results.push(
    leaked.length === 0
      ? { id: 'live:draft', status: 'PASS', message: 'sitemap 에 draft 없음' }
      : { id: 'live:draft', status: 'FAIL', message: 'sitemap 에 draft 글이 있습니다', details: leaked },
  )
  const notHidden = input.untranslated.filter((post) => post.status !== 404)
  results.push(
    notHidden.length === 0
      ? { id: 'live:untranslated', status: 'PASS', message: `번역 없는 /en/<slug> ${input.untranslated.length}개 404` }
      : { id: 'live:untranslated', status: 'FAIL', message: '번역 없는 /en/<slug> 가 404 가 아닙니다', details: notHidden.map((post) => `/en/${post.slug} ${post.status}`) },
  )
  const badMeta = input.metaUrlStatuses.filter((entry) => entry.status !== 200)
  results.push(
    badMeta.length === 0
      ? { id: 'live:meta-urls', status: 'PASS', message: `메타 URL ${input.metaUrlStatuses.length}개 200` }
      : { id: 'live:meta-urls', status: 'FAIL', message: '리다이렉트되거나 없는 메타 URL', details: badMeta.map((entry) => `${entry.url} ${entry.status}`) },
  )
  results.push(
    input.apiStatus === 200
      ? { id: 'live:api', status: 'PASS', message: 'API 헬스 (/api/me)' }
      : { id: 'live:api', status: 'FAIL', message: `API 헬스 (/api/me) ${input.apiStatus}` },
  )
  if (input.redirect === undefined) {
    results.push({ id: 'live:redirect', status: 'INFO', message: 'nabi.kim 리다이렉트: 기본 대상이 아니라 건너뜀' })
  } else {
    const ok = input.redirect.status === 301 && input.redirect.location === 'https://nabichan.me/'
    results.push(
      ok
        ? { id: 'live:redirect', status: 'PASS', message: 'nabi.kim → https://nabichan.me/ (301)' }
        : { id: 'live:redirect', status: 'FAIL', message: `nabi.kim 리다이렉트가 다릅니다 (${input.redirect.status} → ${input.redirect.location ?? '없음'})` },
    )
  }
  if (input.httpRedirect === undefined) {
    results.push({ id: 'live:https', status: 'INFO', message: 'http → https: 기본 대상이 아니라 건너뜀' })
  } else {
    const { status, location } = input.httpRedirect
    const ok = (status === 301 || status === 308) && (location ?? '').startsWith('https://nabichan.me/')
    results.push(
      ok
        ? { id: 'live:https', status: 'PASS', message: `http → https (${status})` }
        : { id: 'live:https', status: 'FAIL', message: `http 요청이 https 로 넘어가지 않습니다 (${status} → ${location ?? '없음'})` },
    )
  }
  return results
}
