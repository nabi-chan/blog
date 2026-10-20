// pnpm audit:repo 의 판정 (스펙 5.2). scripts/audit.ts 가 Node 로 바로 불러서 상대 경로만 import 한다
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

// `wrangler d1 migrations list` 표에서 미적용 파일 이름
export function pendingMigrations(listOutput: string): string[] {
  return [...listOutput.matchAll(/│\s*(\S+\.sql)\s*│/g)].map(([, name]) => name)
}
