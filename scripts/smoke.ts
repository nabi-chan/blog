// 프리뷰(또는 배포) URL 에 요청을 보내 응답을 검사하는 스모크 스크립트
// 사용법: node scripts/smoke.ts <baseUrl>
import { checkResponse, extractMetaUrls, type SmokeCheck } from '../src/lib/smoke.ts'

export const CHECKS: SmokeCheck[] = [
  { path: '/', status: 200, contains: ['<html', 'lang="ko"', 'href="/261020"'] },
  { path: '/en', status: 200, contains: ['lang="en"', 'href="/en/261020"'] },
  { path: '/posts', status: 200, contains: ['lang="ko"'] },
  { path: '/en/posts', status: 200, contains: ['lang="en"'] },
  { path: '/en/', status: 307, location: '/en' },
  { path: '/fr/posts', status: 404 },
  { path: '/EN/posts', status: 404 },
  { path: '/fr', status: 404 },
  { path: '/posts/261020', status: 404 },
  {
    path: '/261020',
    status: 200,
    contains: ['lang="ko"', '이 블로그를 어떻게 만들었나', 'data-rehype-pretty-code', '<nav'],
  },
  { path: '/en/261020', status: 200, contains: ['lang="en"', 'How I built this blog'] },
  {
    path: '/261020',
    status: 200,
    contains: [
      'data-callout="tip"',
      '<figcaption',
      'src="/content-assets/261020/diagram.',
      '<source type="image/webp"',
      'fetchpriority="high"',
    ],
  },
  { path: '/en/261020', status: 200, contains: ['href="/en/261020#'] },
  {
    path: '/261020',
    status: 200,
    contains: [
      '<details class="details">',
      '<details open class="see-also">',
      'class="bilingual-quote"',
      'data-term-key="prerender"',
      'data-widget="counter-demo"',
      // 알 수 없는 텍스트 디렉티브(:en)는 글자로 남는다
      'ko:en',
    ],
  },
  {
    path: '/en/261020',
    status: 200,
    contains: ['class="quote-original" lang="en"'],
    notContains: ['class="quote-translation"'],
  },
  { path: '/261020/', status: 307, location: '/261020' },
  { path: '/does-not-exist', status: 404 },
  { path: '/en/does-not-exist', status: 404 },
  { path: '/', status: 200, contains: ['href="/posts"'] },
  { path: '/posts', status: 200, contains: ['data-chip="meta"', 'data-year="2026"', 'html[data-tag="meta"]'] },
  { path: '/posts?tag=meta', status: 200, contains: ['data-post'] },
  { path: '/261020', status: 200, contains: ['href="/en/261020"'] },
  { path: '/en/261020', status: 200, contains: ['href="/261020"'] },
  { path: '/261099', status: 404, contains: ['lang="ko"'] },
  { path: '/en/261099', status: 404, contains: ['lang="en"'] },
  // 깨진 퍼센트 인코딩은 Workers 정적 에셋 계층이 Worker 앞에서 400 으로 끊는다 (500 이 아니면 된다)
  { path: '/%E0', status: 400 },
  // 댓글·조회수 API 와 Access 귀환 경로 (계획 2)
  { path: '/api/me', status: 200, contains: ['"owner":false', '"turnstileSiteKey"'] },
  {
    path: '/api/views',
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: '{}',
    status: 403,
    contains: ['forbidden_origin'],
  },
  { path: '/admin?return=//evil.com', status: 302, location: '/' },
  { path: '/admin?return=/261020', status: 302, location: '/261020' },
  { path: '/api/nope', status: 404 },
  // 댓글·조회수 자리는 프리렌더 HTML 에 들어 있다 (숫자·댓글은 브라우저가 채움)
  { path: '/261020', status: 200, contains: ['id="comments-title"', 'class="view-count"'], notContains: ['/admin?return='] },
  { path: '/', status: 200, contains: ['class="lobby-views meta-list"', '오늘', 'data-state="loading"'] },
  { path: '/en', status: 200, contains: ['Today', 'Total'] },
  { path: '/en/261020', status: 200, contains: ['Comments', 'Views'], notContains: ['site-footer'] },
  // SEO·GEO 산출물 (계획 3)
  { path: '/sitemap.xml', status: 200, contains: ['<urlset', '/261020</loc>', 'hreflang="en"'] },
  { path: '/robots.txt', status: 200, contains: ['Disallow: /api/', 'User-agent: ClaudeBot', 'Sitemap: https://nabichan.me/sitemap.xml'] },
  { path: '/rss.xml', status: 200, contains: ['<rss', 'content:encoded', 'https://nabichan.me/261020'] },
  { path: '/en/rss.xml', status: 200, contains: ['https://nabichan.me/en/261020'] },
  { path: '/llms.txt', status: 200, contains: ['https://nabichan.me/261020.md'] },
  { path: '/en/llms.txt', status: 200, contains: ['https://nabichan.me/en/261020.md'] },
  { path: '/llms-full.txt', status: 200, contains: ['URL: https://nabichan.me/261020', 'URL: https://nabichan.me/en/261020'] },
  // frontmatter 가 빠졌는지는 실제 frontmatter 에만 있는 설명 줄로 본다 (본문 코드 예시에도 title: 이 있다)
  { path: '/261020.md', status: 200, contains: ['https://nabichan.me/content-assets/'], notContains: ['description: "TanStack Start와'] },
  { path: '/en/261020.md', status: 200 },
  { path: '/og/ko/261020.png', status: 200 },
  { path: '/261020', status: 200, count: { '<title': 1 }, contains: ['application/ld+json', 'rel="canonical"'] },
  { path: '/does-not-exist', status: 404, count: { '<title': 1 }, contains: ['noindex'] },
]

// 메타·sitemap 에 실린 주소는 리다이렉트 없이 200 이어야 한다 (스펙 4.1)
const META_PAGES = ['/', '/en', '/posts', '/en/posts', '/261020', '/en/261020']

async function main(baseUrl: string) {
  const failures: string[] = []
  for (const check of CHECKS) {
    const res = await fetch(new URL(check.path, baseUrl), {
      method: check.method,
      headers: check.headers,
      body: check.body,
      redirect: 'manual',
    })
    failures.push(
      ...checkResponse(check, {
        status: res.status,
        location: res.headers.get('location'),
        body: await res.text(),
      }),
    )
  }
  const metaUrls = new Set<string>()
  for (const path of META_PAGES) {
    for (const url of extractMetaUrls(await (await fetch(new URL(path, baseUrl))).text())) metaUrls.add(url)
  }
  const sitemap = await (await fetch(new URL('/sitemap.xml', baseUrl))).text()
  for (const [, url] of sitemap.matchAll(/(?:<loc>|href=")(https:\/\/nabichan\.me[^<"]*)/g)) metaUrls.add(url)
  for (const url of metaUrls) {
    const local = new URL(url.replace('https://nabichan.me', ''), baseUrl)
    const res = await fetch(local, { redirect: 'manual' })
    if (res.status !== 200) failures.push(`메타 주소 ${url}: 200 기대, 실제 ${res.status}`)
  }
  console.log(`메타 주소 ${metaUrls.size}개 확인`)
  const passed = CHECKS.length - new Set(failures.map((f) => f.split(':')[0])).size
  console.log(`${passed}/${CHECKS.length} 통과`)
  if (failures.length > 0) {
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }
}

const baseUrl = process.argv[2]
if (!baseUrl) {
  console.error('사용법: node scripts/smoke.ts <baseUrl>')
  process.exit(1)
}
await main(baseUrl)
