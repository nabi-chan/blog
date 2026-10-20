// 바뀐 글 주소를 IndexNow 로 알린다. 기본은 미리보기만 하고, --submit 일 때만 보낸다 (스펙 4.9)
// 사용법: node scripts/indexnow.ts [--all] [--submit] [--base <sha>] [--head <sha>]
// 빌드 뒤에 실행한다. 주소는 dist/client/sitemap.xml 에서 읽어서 draft·삭제된 글은 보내지 않는다
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { changedSlugs, indexNowPayload, selectIndexNowUrls, sitemapUrls } from '../src/lib/indexnow.ts'

const ENDPOINT = 'https://api.indexnow.org/indexnow'

const args = process.argv.slice(2)
const option = (name: string, fallback: string) => {
  const at = args.indexOf(name)
  return at === -1 ? fallback : (args[at + 1] ?? fallback)
}
const all = args.includes('--all')
const submit = args.includes('--submit')

const sitemap = sitemapUrls(readFileSync('dist/client/sitemap.xml', 'utf8'))
const files = all
  ? []
  : execFileSync('git', ['diff', '--name-only', option('--base', 'HEAD~1'), option('--head', 'HEAD'), '--', 'content/posts'], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
const urls = selectIndexNowUrls({ sitemap, slugs: changedSlugs(files), all })
const payload = indexNowPayload(urls)

console.log(`보낼 주소 ${urls.length}개`)
for (const url of urls) console.log(`- ${url}`)
if (urls.length === 0) process.exit(0)
if (!submit) {
  console.log(JSON.stringify(payload, null, 2))
  console.log('미리보기만 했습니다. 실제로 보내려면 --submit 을 붙입니다')
  process.exit(0)
}

const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload) })
if (res.status !== 200 && res.status !== 202) {
  console.error(`IndexNow 응답 ${res.status}: ${await res.text()}`)
  process.exit(1)
}
console.log(`IndexNow 에 ${urls.length}개를 보냈습니다 (${res.status})`)
