// 번역에 영향이 없는 원문 수정 뒤 영어 번역본의 sourceHash 만 갱신한다
// 사용법: node scripts/content-rehash.ts --post <slug>
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { replaceSourceHash, splitFrontmatter } from '../src/content/rehash.ts'
import { computeSourceHash } from '../src/content/source-hash.ts'

const index = process.argv.indexOf('--post')
const slug = index === -1 ? undefined : process.argv[index + 1]
if (!slug) {
  console.error('사용법: node scripts/content-rehash.ts --post <slug>')
  process.exit(1)
}

const dir = join('content/posts', slug)
const koPath = join(dir, 'index.ko.md')
const enPath = join(dir, 'index.en.md')
if (!existsSync(enPath)) {
  console.error(`${enPath} 가 없습니다`)
  process.exit(1)
}

const { frontmatter, body } = splitFrontmatter(readFileSync(koPath, 'utf8'))
const { title, description } = parse(frontmatter) as { title: string; description: string }
const hash = computeSourceHash({ title, description, body })
writeFileSync(enPath, replaceSourceHash(readFileSync(enPath, 'utf8'), hash))
console.log(`${enPath}: sourceHash 를 ${hash.slice(0, 8)}… 로 갱신했습니다`)
