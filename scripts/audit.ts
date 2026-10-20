// 저장소 점검 (스펙 5.2). 결과는 PASS / WARN / FAIL / INFO 로 내고 .audit-report.json 에 쓴다. FAIL 이 있으면 exit 1
// 사용법: node scripts/audit.ts [--build] [--live [--base-url <url>]]
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { parse } from 'yaml'
import { type ContentPostInput, collectContentProblems, messageKeyDiff, plainTextMarker } from '../src/content/content-checks.ts'
import { splitFrontmatter } from '../src/content/rehash.ts'
import { computeSourceHash } from '../src/content/source-hash.ts'
import { compareStructure, translationStructure } from '../src/content/translation-structure.ts'
import {
  type AuditResult,
  type TranslationState,
  budgetResults,
  changedMigrations,
  diffBase,
  formatResult,
  leakedPostText,
  liveResults,
  pendingMigrations,
  summarize,
  translationResults,
} from '../src/lib/audit.ts'
import { sitemapUrls } from '../src/lib/indexnow.ts'
import { extractMetaUrls } from '../src/lib/smoke.ts'

const args = process.argv.slice(2)
const POSTS_DIR = 'content/posts'
const results: AuditResult[] = []

const run = (command: string, commandArgs: string[]) => spawnSync(command, commandArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const tail = (text: string, lines = 15) =>
  text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-lines)

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

  // 이미 커밋된 마이그레이션은 고치지 않는다. 작업 트리와, 기준점(diffBase)부터 HEAD 까지를 본다
  const upstream = run('git', ['merge-base', 'HEAD', '@{upstream}'])
  const base = diffBase({
    arg: args.includes('--base') ? args[args.indexOf('--base') + 1] : undefined,
    env: process.env.AUDIT_BASE,
    upstream: upstream.status === 0 ? upstream.stdout.trim() : undefined,
    previous: run('git', ['rev-parse', '--verify', '--quiet', 'HEAD~1']).status === 0,
  })
  const working = run('git', ['diff', '--name-status', 'HEAD', '--', 'migrations'])
  const committed = base.ref === null ? undefined : run('git', ['diff', '--name-status', base.ref, 'HEAD', '--', 'migrations'])
  const changed = [...changedMigrations(working.stdout), ...(committed?.status === 0 ? changedMigrations(committed.stdout) : [])]
  results.push(
    changed.length > 0
      ? { id: 'migrations', status: 'FAIL', message: `이미 커밋된 마이그레이션을 고쳤습니다 (새 파일로 추가하세요, 기준: ${base.label})`, details: [...new Set(changed)] }
      : committed?.status === 0
        ? { id: 'migrations', status: 'PASS', message: `마이그레이션은 추가만 (기준: ${base.label})` }
        : { id: 'migrations', status: 'INFO', message: `마이그레이션 수정 검사: ${base.label} — 작업 트리만 확인함` },
  )
}

// 글 목록 (draft 여부와 영어 번역 유무)
function postList(): Array<{ slug: string; draft: boolean; hasEnglish: boolean; bodies: string[] }> {
  if (!existsSync(POSTS_DIR)) return []
  return readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(POSTS_DIR, entry.name, 'index.ko.md')))
    .map((entry) => {
      const ko = splitFrontmatter(readFileSync(join(POSTS_DIR, entry.name, 'index.ko.md'), 'utf8'))
      const enPath = join(POSTS_DIR, entry.name, 'index.en.md')
      const en = existsSync(enPath) ? splitFrontmatter(readFileSync(enPath, 'utf8')).body : undefined
      return {
        slug: entry.name,
        draft: (parse(ko.frontmatter) as { draft?: boolean }).draft === true,
        hasEnglish: en !== undefined,
        bodies: en === undefined ? [ko.body] : [ko.body, en],
      }
    })
}

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]))

// ── --build ───────────────────────────────────────────────
async function buildChecks() {
  const build = run('pnpm', ['build'])
  if (build.status !== 0) {
    results.push({ id: 'build', status: 'FAIL', message: '클린 빌드 실패', details: tail(`${build.stdout}${build.stderr}`) })
    return
  }
  results.push({ id: 'build', status: 'PASS', message: '클린 빌드' })

  const assets = filesUnder('dist/client/assets').filter((file) => file.endsWith('.js'))
  const clientJsGzipBytes = assets.reduce((sum, file) => sum + gzipSync(readFileSync(file)).length, 0)
  // 소스맵과 preview 용 .dev.vars 사본은 배포되지 않는다
  const workerBytes = filesUnder('dist/server')
    .filter((file) => !file.endsWith('.map') && !file.endsWith('.dev.vars'))
    .reduce((sum, file) => sum + statSync(file).size, 0)
  results.push(...budgetResults({ clientJsGzipBytes, workerBytes }))

  // 본문 유출 검사: 렌더된 HTML 에 그대로 나오는 문장을 고르고, 서버 번들에 실제로 있는 문장만 기준으로 쓴다
  // (서버에서도 못 찾으면 그 기준으로는 유출 여부를 알 수 없다)
  const posts = postList().filter((post) => !post.draft)
  const serverTexts = filesUnder('dist/server').filter((file) => file.endsWith('.js')).map((file) => readFileSync(file, 'utf8'))
  const candidates = posts.flatMap((post) => post.bodies.map((body) => ({ slug: post.slug, marker: plainTextMarker(body) ?? '' })))
  const markers = candidates.filter((entry) => entry.marker && serverTexts.some((text) => text.includes(entry.marker)))
  const unverifiable = [...new Set(candidates.filter((entry) => !markers.includes(entry)).map((entry) => entry.slug))]
  const leaked = leakedPostText(assets.map((file) => readFileSync(file, 'utf8')), markers)
  results.push(
    leaked.length > 0
      ? { id: 'leak', status: 'FAIL', message: '클라이언트 에셋에 글 본문이 실렸습니다', details: [...new Set(leaked)] }
      : unverifiable.length > 0
        ? { id: 'leak', status: 'WARN', message: '본문 유출을 확인할 문장을 찾지 못한 글 (순수 텍스트 문단이 필요)', details: unverifiable }
        : { id: 'leak', status: 'PASS', message: `클라이언트 에셋에 글 본문 없음 (기준 문장 ${markers.length}개)` },
  )

  const expected = [
    'sitemap.xml',
    'robots.txt',
    'rss.xml',
    'en/rss.xml',
    'llms.txt',
    'en/llms.txt',
    'llms-full.txt',
    'og/ko/site.png',
    'og/en/site.png',
    ...posts.flatMap((post) => [
      `${post.slug}.md`,
      `og/ko/${post.slug}.png`,
      ...(post.hasEnglish ? [`en/${post.slug}.md`, `og/en/${post.slug}.png`] : []),
    ]),
  ]
  const missing = expected.filter((file) => !existsSync(join('dist/client', file)))
  results.push(
    missing.length === 0
      ? { id: 'artifacts', status: 'PASS', message: `SEO·GEO 산출물 ${expected.length}개` }
      : { id: 'artifacts', status: 'FAIL', message: '빠진 산출물', details: missing },
  )

  // preview 로 스모크(메타 URL 200 포함)를 돌린다.
  // 4173 이 이미 쓰이고 있으면 새 preview 가 뜨지 못하고 스모크가 낡은 서버를 상대로 돌므로 먼저 막는다
  const PREVIEW_URL = 'http://localhost:4173/'
  const occupied = await fetch(PREVIEW_URL).then(
    () => true,
    () => false,
  )
  if (occupied) {
    results.push({ id: 'smoke', status: 'FAIL', message: '4173 포트가 이미 쓰이고 있습니다. 떠 있는 pnpm preview 를 끄고 다시 실행하세요' })
    return
  }
  const preview = spawn('pnpm', ['preview', '--strictPort'], { detached: true, stdio: 'ignore' })
  let exited = false
  preview.on('exit', () => {
    exited = true
  })
  // preview 와 그 아래 workerd 를 같이 끈다. 이미 끝났으면 무시한다
  const stopPreview = () => {
    try {
      if (preview.pid && !exited) process.kill(-preview.pid)
    } catch {
      // 이미 끝난 프로세스 그룹
    }
  }
  const onInterrupt = () => {
    stopPreview()
    process.exit(130)
  }
  process.once('SIGINT', onInterrupt)
  try {
    let ready = false
    for (let attempt = 0; attempt < 60 && !ready && !exited; attempt += 1) {
      ready = await fetch(PREVIEW_URL).then(
        () => true,
        () => false,
      )
      if (!ready) await new Promise((resolve) => setTimeout(resolve, 500))
    }
    if (!ready) {
      results.push({ id: 'smoke', status: 'FAIL', message: `preview 가 뜨지 않았습니다${exited ? ' (프로세스가 끝남)' : ' (30초 대기)'}` })
      return
    }
    const smoke = run('node', ['scripts/smoke.ts', PREVIEW_URL])
    results.push(
      smoke.status === 0
        ? { id: 'smoke', status: 'PASS', message: `preview 스모크 (${tail(smoke.stdout, 1)[0] ?? ''})` }
        : { id: 'smoke', status: 'FAIL', message: 'preview 스모크 실패', details: tail(`${smoke.stdout}${smoke.stderr}`) },
    )
  } finally {
    process.removeListener('SIGINT', onInterrupt)
    stopPreview()
  }
}

// ── --live ────────────────────────────────────────────────
async function liveChecks() {
  const DEFAULT_BASE = 'https://nabichan.me'
  const base = args.includes('--base-url') ? args[args.indexOf('--base-url') + 1] : DEFAULT_BASE
  const local = (url: string) => new URL(url.replace(DEFAULT_BASE, ''), base)
  const posts = postList().filter((post) => !post.draft)

  const paths = ['/', '/en', '/posts', '/en/posts', ...posts.flatMap((post) => [`/${post.slug}`, ...(post.hasEnglish ? [`/en/${post.slug}`] : [])])]
  const pages = []
  for (const path of paths) {
    const ttfbMs: number[] = []
    let status = 0
    let cache: string | null = null
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const started = performance.now()
      const res = await fetch(new URL(path, base), { redirect: 'manual' })
      ttfbMs.push(performance.now() - started)
      status = res.status
      cache = res.headers.get('cf-cache-status')
      await res.arrayBuffer()
    }
    pages.push({ path, status, ttfbMs, cache })
  }
  const home = await fetch(new URL('/', base))
  const sitemap = await (await fetch(new URL('/sitemap.xml', base))).text()

  const metaUrls = new Set<string>()
  for (const path of ['/', '/en', '/posts', '/en/posts', ...posts.map((post) => `/${post.slug}`)]) {
    for (const url of extractMetaUrls(await (await fetch(new URL(path, base))).text())) metaUrls.add(url)
  }
  const metaUrlStatuses = []
  for (const url of metaUrls) metaUrlStatuses.push({ url, status: (await fetch(local(url), { redirect: 'manual' })).status })

  const untranslated = []
  for (const post of posts.filter((entry) => !entry.hasEnglish)) {
    untranslated.push({ slug: post.slug, status: (await fetch(new URL(`/en/${post.slug}`, base), { redirect: 'manual' })).status })
  }
  const redirect =
    base === DEFAULT_BASE
      ? await fetch('https://nabi.kim/', { redirect: 'manual' }).then((res) => ({ status: res.status, location: res.headers.get('location') }))
      : undefined

  results.push(
    ...liveResults({
      pages,
      headers: home.headers,
      sitemapUrls: sitemapUrls(sitemap),
      draftSlugs: postList()
        .filter((post) => post.draft)
        .map((post) => post.slug),
      untranslated,
      metaUrlStatuses,
      apiStatus: (await fetch(new URL('/api/me', base))).status,
      redirect,
    }),
  )

  // 원격 D1 은 Cloudflare 로그인과 DB 가 있어야 볼 수 있다
  const remote = run('pnpm', ['exec', 'wrangler', 'd1', 'migrations', 'list', 'DB', '--remote'])
  const pending = pendingMigrations(`${remote.stdout}${remote.stderr}`)
  results.push(
    remote.status !== 0
      ? { id: 'd1-remote', status: 'WARN', message: '원격 D1 마이그레이션을 확인하지 못했습니다', details: tail(`${remote.stdout}${remote.stderr}`, 3) }
      : pending.length === 0
        ? { id: 'd1-remote', status: 'PASS', message: '원격 D1 마이그레이션 적용됨' }
        : { id: 'd1-remote', status: 'FAIL', message: '원격 D1 에 적용하지 않은 마이그레이션', details: pending },
  )
}

baseChecks()
if (args.includes('--build')) await buildChecks()
if (args.includes('--live')) await liveChecks()

const summary = summarize(results)
for (const result of results) console.log(formatResult(result))
console.log(`\nPASS ${summary.counts.PASS} · WARN ${summary.counts.WARN} · FAIL ${summary.counts.FAIL} · INFO ${summary.counts.INFO}`)
writeFileSync('.audit-report.json', `${JSON.stringify({ generatedAt: new Date().toISOString(), args, counts: summary.counts, results }, null, 2)}\n`)
process.exit(summary.exitCode)
