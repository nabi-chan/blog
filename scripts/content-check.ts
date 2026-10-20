// 글 단위 콘텐츠 검사. 커맨드(write-post·translate-post)와 audit:repo 가 쓴다
// 사용법: node scripts/content-check.ts [--post <slug>] [--no-build]
// 보는 것: 번역 구조, 빠진 태그 표시 이름·용어, 깨진 내부 링크, 낡은 번역, 그리고 content-collections build(스키마·slug)
// 볼드 깨짐·맞춤법은 경고만 하고 실패로 치지 않는다
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { type ContentPostInput, collectContentProblems, collectContentWarnings } from '../src/content/content-checks.ts'
import { splitFrontmatter } from '../src/content/rehash.ts'

const POSTS_DIR = 'content/posts'
const args = process.argv.slice(2)
const only = args.includes('--post') ? args[args.indexOf('--post') + 1] : undefined

function readPost(slug: string): ContentPostInput {
  const ko = splitFrontmatter(readFileSync(join(POSTS_DIR, slug, 'index.ko.md'), 'utf8'))
  const meta = parse(ko.frontmatter) as { title: string; description: string; tags?: string[]; draft?: boolean }
  const enPath = join(POSTS_DIR, slug, 'index.en.md')
  const en = existsSync(enPath) ? splitFrontmatter(readFileSync(enPath, 'utf8')) : undefined
  return {
    slug,
    ko: { title: meta.title, description: meta.description, body: ko.body, tags: meta.tags ?? [], draft: meta.draft === true },
    en: en && { body: en.body, sourceHash: (parse(en.frontmatter) as { sourceHash: string }).sourceHash },
  }
}

// 링크 검사를 위해 모든 글을 읽고, 결과는 --post 로 고른 글만 보여 준다
const slugs = existsSync(POSTS_DIR)
  ? readdirSync(POSTS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(POSTS_DIR, entry.name, 'index.ko.md')))
      .map((entry) => entry.name)
      .sort()
  : []
if (only !== undefined && !slugs.includes(only)) {
  console.error(`${only}: content/posts/${only}/index.ko.md 가 없습니다`)
  process.exit(1)
}
const tagKeys = ((parse(readFileSync('content/tags.yaml', 'utf8')) as { tags: Array<{ key: string }> }).tags ?? []).map((tag) => tag.key)
const termKeys = ((parse(readFileSync('content/glossary.yaml', 'utf8')) as { terms: Array<{ key: string }> }).terms ?? []).map((term) => term.key)
const posts = slugs.map(readPost)
const results = collectContentProblems({ posts, tagKeys, termKeys }).filter((result) => only === undefined || result.slug === only)
const warnings = collectContentWarnings(posts).filter((result) => only === undefined || result.slug === only)

let failed = false
for (const { slug, problems } of results) {
  failed = true
  console.log(`${slug}`)
  for (const problem of problems) console.log(`  - ${problem}`)
}
for (const { slug, warnings: lines } of warnings) {
  console.log(`${slug} (경고)`)
  for (const line of lines) console.log(`  - ${line}`)
}

// 스키마·slug·하루 한 편은 Content Collections 가 판정한다. 낡은 번역은 위에서 따로 본다.
// dev 모드로 빌드한다. 프로덕션 모드면 띄워 둔 dev 서버의 생성물을 draft 가 빠진 형태로 덮어쓴다
if (!args.includes('--no-build')) {
  try {
    execFileSync('pnpm', ['exec', 'content-collections', 'build'], { stdio: 'pipe' })
  } catch (error) {
    failed = true
    const output = error as { stdout?: Buffer; stderr?: Buffer }
    console.log('content-collections build 실패')
    console.log(`${output.stdout?.toString() ?? ''}${output.stderr?.toString() ?? ''}`.trim())
  }
}

if (failed) process.exit(1)
console.log(`콘텐츠 검사 통과 (${only ?? `글 ${slugs.length}편`})`)
