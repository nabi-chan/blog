// 프리뷰(또는 배포) URL 에 요청을 보내 응답을 검사하는 스모크 스크립트
// 사용법: node scripts/smoke.ts <baseUrl>
import { checkResponse, type SmokeCheck } from '../src/lib/smoke.ts'

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
    contains: ['lang="ko"', 'kitchen-sink-ko', 'data-rehype-pretty-code', '<nav'],
  },
  { path: '/en/261020', status: 200, contains: ['lang="en"', 'kitchen-sink-en'] },
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
      'key:value',
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
]

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
