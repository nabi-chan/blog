// 저장소 점검 (스펙 5.2). 결과는 PASS / WARN / FAIL / INFO 로 내고 .audit-report.json 에 쓴다. FAIL 이 있으면 exit 1
// 사용법: node scripts/audit.ts [--build] [--live [--base-url <url>]]
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { type ContentPostInput, collectContentProblems, messageKeyDiff } from '../src/content/content-checks.ts'
import { splitFrontmatter } from '../src/content/rehash.ts'
import { computeSourceHash } from '../src/content/source-hash.ts'
import { compareStructure, translationStructure } from '../src/content/translation-structure.ts'
import { type AuditResult, type TranslationState, changedMigrations, formatResult, pendingMigrations, summarize, translationResults } from '../src/lib/audit.ts'

const args = process.argv.slice(2)
const POSTS_DIR = 'content/posts'
const results: AuditResult[] = []

const run = (command: string, commandArgs: string[]) => spawnSync(command, commandArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const tail = (text: string, lines = 15) => text.trim().split('\n').slice(-lines)

function commandResult(id: string, message: string, command: string, commandArgs: string[]): AuditResult {
  const result = run(command, commandArgs)
  return result.status === 0
    ? { id, status: 'PASS', message }
    : { id, status: 'FAIL', message: `${message} 실패`, details: tail(`${result.stdout}${result.stderr}`) }
}

// ── 기본 검사 ──────────────────────────────────────────────
function baseChecks() {
  results.push(commandResult('typecheck', '타입 검사 (pnpm check)', 'pnpm', ['check']))
  results.push(commandResult('test', '테스트 (pnpm test)', 'pnpm', ['test']))

  // 콘텐츠: 태그·용어·깨진 링크. 낡은 번역과 구조는 아래 번역 검사가 따로 낸다. 스키마·slug 는 pnpm check 의 content-collections build 가 본다
  const slugs = existsSync(POSTS_DIR)
    ? readdirSync(POSTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && existsSync(join(POSTS_DIR, entry.name, 'index.ko.md')))
        .map((entry) => entry.name)
        .sort()
    : []
  const posts = slugs.map((slug) => {
    const ko = splitFrontmatter(readFileSync(join(POSTS_DIR, slug, 'index.ko.md'), 'utf8'))
    const meta = parse(ko.frontmatter) as { title: string; description: string; tags?: string[] }
    const enPath = join(POSTS_DIR, slug, 'index.en.md')
    const en = existsSync(enPath) ? splitFrontmatter(readFileSync(enPath, 'utf8')) : undefined
    const enMeta = en ? (parse(en.frontmatter) as { sourceHash: string; translationStatus: 'machine' | 'reviewed' }) : undefined
    const input: ContentPostInput = {
      slug,
      ko: { title: meta.title, description: meta.description, body: ko.body, tags: meta.tags ?? [] },
      en: en && enMeta ? { body: en.body, sourceHash: enMeta.sourceHash } : undefined,
    }
    return { input, translationStatus: enMeta?.translationStatus }
  })
  const tagKeys = ((parse(readFileSync('content/tags.yaml', 'utf8')) as { tags: Array<{ key: string }> }).tags ?? []).map((tag) => tag.key)
  const termKeys = ((parse(readFileSync('content/glossary.yaml', 'utf8')) as { terms: Array<{ key: string }> }).terms ?? []).map((term) => term.key)
  const content = collectContentProblems({ posts: posts.map((post) => post.input), tagKeys, termKeys }, { translation: false })
  results.push(
    content.length === 0
      ? { id: 'content', status: 'PASS', message: `콘텐츠 (글 ${slugs.length}편)` }
      : { id: 'content', status: 'FAIL', message: '콘텐츠 문제', details: content.flatMap(({ slug, problems }) => problems.map((line) => `${slug}: ${line}`)) },
  )

  results.push(
    ...translationResults(
      posts.map(({ input, translationStatus }) => {
        if (!input.en) return { slug: input.slug, en: 'missing' as TranslationState, structure: [] }
        const stale = computeSourceHash(input.ko) !== input.en.sourceHash
        return {
          slug: input.slug,
          en: (stale ? 'stale' : (translationStatus ?? 'machine')) as TranslationState,
          structure: compareStructure(translationStructure(input.ko.body), translationStructure(input.en.body)),
        }
      }),
    ),
  )

  const messages = (locale: string) => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Record<string, unknown>
  const { onlyKo, onlyEn } = messageKeyDiff(messages('ko'), messages('en'))
  results.push(
    onlyKo.length + onlyEn.length === 0
      ? { id: 'messages', status: 'PASS', message: 'Paraglide 메시지 ko·en 키' }
      : { id: 'messages', status: 'FAIL', message: 'Paraglide 메시지 키가 다릅니다', details: [...onlyKo.map((key) => `ko 에만: ${key}`), ...onlyEn.map((key) => `en 에만: ${key}`)] },
  )

  // 개인 .dev.vars 가 아니라 커밋된 .dev.vars.example 로 만든 타입과 비교해서, 로컬과 CI 가 같은 결론을 낸다
  const types = run('pnpm', ['exec', 'wrangler', 'types', '--strict-vars=false', '--env-file', '.dev.vars.example', '--check'])
  results.push(
    types.status === 0
      ? { id: 'types', status: 'PASS', message: 'wrangler types 와 커밋된 타입' }
      : { id: 'types', status: 'FAIL', message: 'worker-configuration.d.ts 가 낡았습니다 (pnpm cf-typegen)', details: tail(`${types.stdout}${types.stderr}`, 5) },
  )

  // CI 에는 로컬 D1 상태가 없어서 건너뛴다
  if (process.env.CI) {
    results.push({ id: 'd1-local', status: 'INFO', message: '로컬 D1 마이그레이션: CI 라서 건너뜀' })
  } else {
    const list = run('pnpm', ['exec', 'wrangler', 'd1', 'migrations', 'list', 'DB', '--local'])
    const pending = pendingMigrations(`${list.stdout}${list.stderr}`)
    results.push(
      list.status !== 0
        ? { id: 'd1-local', status: 'FAIL', message: '로컬 D1 마이그레이션 목록을 읽지 못했습니다', details: tail(`${list.stdout}${list.stderr}`, 5) }
        : pending.length === 0
          ? { id: 'd1-local', status: 'PASS', message: '로컬 D1 마이그레이션 적용됨' }
          : { id: 'd1-local', status: 'FAIL', message: '로컬 D1 에 적용하지 않은 마이그레이션 (pnpm db:migrate:local)', details: pending },
    )
  }

  // 이미 커밋된 마이그레이션은 고치지 않는다 (작업 트리와 마지막 커밋을 본다)
  const working = run('git', ['diff', '--name-status', 'HEAD', '--', 'migrations'])
  const lastCommit = run('git', ['diff', '--name-status', 'HEAD~1', 'HEAD', '--', 'migrations'])
  const changed = [...changedMigrations(working.stdout), ...(lastCommit.status === 0 ? changedMigrations(lastCommit.stdout) : [])]
  results.push(
    changed.length > 0
      ? { id: 'migrations', status: 'FAIL', message: '이미 커밋된 마이그레이션을 고쳤습니다 (새 파일로 추가하세요)', details: [...new Set(changed)] }
      : lastCommit.status === 0
        ? { id: 'migrations', status: 'PASS', message: '마이그레이션은 추가만' }
        : { id: 'migrations', status: 'INFO', message: '마이그레이션 수정 검사: 이전 커밋이 없어 작업 트리만 확인함' },
  )
}

baseChecks()

const summary = summarize(results)
for (const result of results) console.log(formatResult(result))
console.log(`\nPASS ${summary.counts.PASS} · WARN ${summary.counts.WARN} · FAIL ${summary.counts.FAIL} · INFO ${summary.counts.INFO}`)
writeFileSync('.audit-report.json', `${JSON.stringify({ generatedAt: new Date().toISOString(), args, counts: summary.counts, results }, null, 2)}\n`)
process.exit(summary.exitCode)
