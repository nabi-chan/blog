// 프리뷰(또는 배포) URL 에 요청을 보내 응답을 검사하는 스모크 스크립트
// 사용법: node scripts/smoke.ts <baseUrl>
import { type SmokeCheck, type SmokePost, checkResponse, extractMetaUrls, extractStylesheets, sitemapPosts, sitemapUrls } from '../src/shared/tooling/index.ts'
import { SECURITY_HEADERS } from '../src/shared/lib/security-headers/index.ts'

// 글이 있든 없든 늘 맞아야 하는 것
export const CHECKS: SmokeCheck[] = [
  { path: '/', status: 200, contains: ['<html', 'lang="ko"', 'href="/posts"'] },
  { path: '/en', status: 200, contains: ['lang="en"'] },
  { path: '/posts', status: 200, contains: ['lang="ko"'] },
  { path: '/en/posts', status: 200, contains: ['lang="en"'] },
  { path: '/en/', status: 307, location: '/en' },
  { path: '/fr/posts', status: 404 },
  { path: '/EN/posts', status: 404 },
  { path: '/fr', status: 404 },
  { path: '/does-not-exist', status: 404, count: { '<title': 1 }, contains: ['noindex'] },
  { path: '/en/does-not-exist', status: 404 },
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
  { path: '/api/nope', status: 404 },
  // 조회수 자리는 프리렌더 HTML 에 들어 있다 (숫자는 브라우저가 채움)
  { path: '/', status: 200, contains: ['class="lobby-views meta-list"', '오늘', 'data-state="loading"'] },
  { path: '/en', status: 200, contains: ['Today', 'Total'] },
  // SEO·GEO 산출물 (계획 3)
  { path: '/sitemap.xml', status: 200, contains: ['<urlset'] },
  {
    path: '/robots.txt',
    status: 200,
    contains: ['Disallow: /api/', 'User-agent: ClaudeBot', 'Content-Signal: search=yes, ai-input=yes, ai-train=no', 'Sitemap: https://nabichan.me/sitemap.xml'],
  },
  // Accept 로 Markdown 을 고르면 홈은 llms.txt 를 준다. 브라우저 Accept 는 그대로 HTML 이다
  {
    path: '/',
    headers: { accept: 'text/markdown' },
    status: 200,
    contains: ['# eunsol'],
    notContains: ['<html'],
    responseHeaders: { 'content-type': 'text/markdown; charset=utf-8', 'content-signal': 'search=yes, ai-input=yes, ai-train=no' },
  },
  { path: '/en', headers: { accept: 'text/markdown' }, status: 200, responseHeaders: { 'content-type': 'text/markdown; charset=utf-8' } },
  { path: '/', headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }, status: 200, contains: ['<html'] },
  // 없는 글은 Markdown 으로 물어도 404 다 (TanStack 은 HTML 이 아닌 요청에 406 을 낸다)
  { path: '/261099', headers: { accept: 'text/markdown' }, status: 404 },
  // 없는 주소는 HTML 이 아닌 형식으로 물어도 404 다 (406 이 아니다)
  { path: '/.well-known/api-catalog', headers: { accept: 'application/linkset+json' }, status: 404 },
  { path: '/does-not-exist', headers: { accept: 'application/json' }, status: 404 },
  // 홈은 HTTP Link 헤더로 Markdown 원문·RSS·sitemap 을 알린다 (RFC 8288)
  {
    path: '/',
    headers: { accept: 'text/html' },
    status: 200,
    responseHeaders: { link: '</llms.txt>; rel="alternate"; type="text/markdown", </rss.xml>; rel="alternate"; type="application/rss+xml", </sitemap.xml>; rel="sitemap"' },
  },
  { path: '/rss.xml', status: 200, contains: ['<rss'] },
  { path: '/en/rss.xml', status: 200, contains: ['<rss'] },
  { path: '/llms.txt', status: 200 },
  { path: '/en/llms.txt', status: 200 },
  { path: '/llms-full.txt', status: 200 },
  // 보안 헤더는 정적 응답(_headers), Worker 응답, Worker 404 모두 같은 값이어야 한다
  { path: '/', status: 200, responseHeaders: SECURITY_HEADERS },
  { path: '/api/me', status: 200, responseHeaders: SECURITY_HEADERS },
  { path: '/does-not-exist', status: 404, responseHeaders: SECURITY_HEADERS },
]

// sitemap 에서 고른 실제 글 하나로 글 페이지와 산출물을 본다.
// 특정 글의 제목이나 쓴 문법에는 기대지 않는다. Markdown 문법별 렌더 결과는 src/entities/post/markdown/render.test.ts 가 본다
function postChecks({ slug, en }: SmokePost, production: boolean): SmokeCheck[] {
  const ko: SmokeCheck[] = [
    { path: '/', status: 200, contains: [`href="/${slug}"`] },
    { path: '/posts', status: 200, contains: ['data-post', 'data-year='] },
    { path: `/posts/${slug}`, status: 404 },
    {
      path: `/${slug}`,
      status: 200,
      count: { '<title': 1 },
      contains: ['lang="ko"', 'application/ld+json', 'rel="canonical"', 'id="comments-title"', 'class="view-count"'],
      notContains: ['/admin?return='],
    },
    { path: `/${slug}/`, status: 307, location: `/${slug}` },
    // 운영에서는 Access 가 먼저 받으므로 되돌림은 preview 에서만 본다
    ...(production ? [] : [{ path: `/admin?return=/${slug}`, status: 302, location: `/${slug}` }]),
    { path: '/rss.xml', status: 200, contains: ['content:encoded', `https://nabichan.me/${slug}`] },
    { path: '/llms.txt', status: 200, contains: [`https://nabichan.me/${slug}.md`] },
    { path: '/llms-full.txt', status: 200, contains: [`URL: https://nabichan.me/${slug}`] },
    { path: `/${slug}.md`, status: 200 },
    { path: `/${slug}`, headers: { accept: 'text/markdown' }, status: 200, notContains: ['<html'], responseHeaders: { 'content-type': 'text/markdown; charset=utf-8' } },
    { path: `/og/ko/${slug}.png`, status: 200 },
  ]
  if (!en) return ko
  return [
    ...ko,
    { path: '/en', status: 200, contains: [`href="/en/${slug}"`] },
    { path: `/${slug}`, status: 200, contains: [`href="/en/${slug}"`] },
    {
      path: `/en/${slug}`,
      status: 200,
      contains: ['lang="en"', `href="/${slug}"`, 'Comments', 'Views'],
      notContains: ['site-footer'],
    },
    { path: '/sitemap.xml', status: 200, contains: ['hreflang="en"'] },
    { path: '/en/rss.xml', status: 200, contains: [`https://nabichan.me/en/${slug}`] },
    { path: '/en/llms.txt', status: 200, contains: [`https://nabichan.me/en/${slug}.md`] },
    { path: '/llms-full.txt', status: 200, contains: [`URL: https://nabichan.me/en/${slug}`] },
    // frontmatter 를 빼고 본문만 낸다. sourceHash 는 번역본 frontmatter 에만 있다
    { path: `/en/${slug}.md`, status: 200, notContains: ['sourceHash:'] },
    { path: `/og/en/${slug}.png`, status: 200 },
  ]
}

// 운영에서는 Access 가 Worker 보다 먼저 /admin 을 받아 로그인으로 보낸다. 되돌림 경로 검사는 Access 가 없는 preview 에서만 한다
const isProduction = (baseUrl: string) => new URL(baseUrl).hostname === 'nabichan.me'

function originChecks(baseUrl: string): SmokeCheck[] {
  if (!isProduction(baseUrl)) return [{ path: '/admin?return=//evil.com', status: 302, location: '/' }]
  return [
    { path: '/admin?return=//evil.com', status: 302, locationIncludes: '.cloudflareaccess.com/cdn-cgi/access/login/' },
    // http 로 온 요청은 경로·쿼리를 지킨 채 https 로 올라가야 한다 (zone 의 Always Use HTTPS)
    { path: 'http://nabichan.me/posts?tag=meta', status: 301, location: 'https://nabichan.me/posts?tag=meta' },
  ]
}

async function main(baseUrl: string) {
  const sitemap = await (await fetch(new URL('/sitemap.xml', baseUrl))).text()
  const posts = sitemapPosts(sitemapUrls(sitemap))
  // 영어판까지 볼 수 있게 번역이 있는 글을 먼저 고른다
  const post = posts.find((entry) => entry.en) ?? posts[0]
  const checks = [...CHECKS, ...originChecks(baseUrl), ...(post ? postChecks(post, isProduction(baseUrl)) : [])]
  console.log(post ? `글 페이지는 /${post.slug} 로 확인` : '글이 없어 글 페이지 검사를 건너뜀')
  const failures: string[] = []
  const request = (check: SmokeCheck) =>
    fetch(new URL(check.path, baseUrl), { method: check.method, headers: check.headers, body: check.body, redirect: 'manual' })
  for (const check of checks) {
    let res = await request(check)
    // preview 가 막 뜬 직후 요청 하나가 500 으로 끝나는 일이 있었다(계획 5, 재현 안 됨). 5xx 는 한 번만 다시 묻고 기록한다
    if (res.status >= 500 && check.status < 500) {
      console.log(`${check.path}: ${res.status} 라서 한 번 다시 요청함`)
      await res.arrayBuffer()
      res = await request(check)
    }
    failures.push(
      ...checkResponse(check, {
        status: res.status,
        location: res.headers.get('location'),
        body: await res.text(),
        headers: res.headers,
      }),
    )
  }
  // 메타·sitemap 에 실린 주소는 리다이렉트 없이 200 이어야 한다 (스펙 4.1)
  const metaPages = ['/', '/en', '/posts', '/en/posts']
  if (post) metaPages.push(`/${post.slug}`, ...(post.en ? [`/en/${post.slug}`] : []))
  const metaUrls = new Set<string>()
  for (const path of metaPages) {
    for (const url of extractMetaUrls(await (await fetch(new URL(path, baseUrl))).text())) metaUrls.add(url)
  }
  for (const [, url] of sitemap.matchAll(/(?:<loc>|href=")(https:\/\/nabichan\.me[^<"]*)/g)) metaUrls.add(url)
  for (const url of metaUrls) {
    const local = new URL(url.replace('https://nabichan.me', ''), baseUrl)
    const res = await fetch(local, { redirect: 'manual' })
    if (res.status !== 200) failures.push(`메타 주소 ${url}: 200 기대, 실제 ${res.status}`)
  }
  console.log(`메타 주소 ${metaUrls.size}개 확인`)
  // 배포된 CSS 가 실제로 내려오는지 본다
  const stylesheets = extractStylesheets(await (await fetch(new URL('/', baseUrl))).text())
  if (stylesheets.length === 0) failures.push('/: stylesheet 링크가 없습니다')
  for (const href of stylesheets) {
    const res = await fetch(new URL(href, baseUrl))
    const type = res.headers.get('content-type') ?? ''
    await res.arrayBuffer()
    if (res.status !== 200 || !type.includes('text/css')) failures.push(`CSS ${href}: 200·text/css 기대, 실제 ${res.status} ${type}`)
  }
  console.log(`CSS ${stylesheets.length}개 확인`)
  const passed = checks.length - new Set(failures.map((f) => f.split(':')[0])).size
  console.log(`${passed}/${checks.length} 통과`)
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
