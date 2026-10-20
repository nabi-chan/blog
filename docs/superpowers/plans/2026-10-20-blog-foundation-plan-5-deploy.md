# 블로그 기반 계획 5: 배포 (보안 헤더 · Actions · 첫 배포 · 리다이렉트) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `nabichan.me` 에 글 0편 상태로 첫 배포를 하고, 그 뒤로는 main push 한 번으로 GitHub Actions 가 배포하게 한다.
- `www.nabichan.me` → apex, `nabi.kim`·`www.nabi.kim` → `https://nabichan.me/` 301
- 댓글·조회수 실검증과 PBKDF2 CPU 실측은 첫 글을 공개할 때 한다(Task 8, 이 계획의 실행 범위 밖)

**Architecture:**
- 코드 작업(Task 1~3)을 먼저 끝내고, Cloudflare 작업(Task 4~7)은 그 위에서 한다.
- 보안 헤더는 한 곳(`src/lib/security-headers.ts`)에서 정한다.
  - 정적 에셋 응답: `public/_headers`. 내용은 테스트가 lib 과 같은지 확인한다.
  - Worker 응답(API, 404, 리다이렉트, 서버 함수): `src/server.ts` 가 감싼다.
- 대시보드 작업과 비밀값 입력은 은솔이 한다. 이로하는 넣을 값과 순서를 준비하고, 결과는 밖에서(curl, dig, wrangler) 확인한다.

**Tech Stack:** 기존 그대로 + GitHub Actions(`actions/checkout`, `pnpm/action-setup`, `actions/setup-node`)

**Spec:** `docs/superpowers/specs/2026-10-20-blog-foundation-design.md`
- 4.11(인프라와 배포, Actions, 첫 배포, nabi.kim), 4.7 의 Access 설정, 4.9 의 AI 크롤러 설정, 6 의 배포 후 완료 조건, 10(배포 때 물어볼 것)을 구현한다.
- 미룬 지적 중 독자가 겪는 것 3건을 처리한다(Task 1).
- 스펙과 달라진 점(은솔 결정, 2026-10-20)
  - 샘플 글을 지웠다. 첫 배포는 글 0편으로 하고, 4.11 의 샘플 글 공개와 6 의 "샘플 글 200"은 첫 글 공개 때로 넘긴다.
  - Access: 이메일 OTP, 세션 24시간, 허용 이메일은 `vars`(커밋, 공개)에 둔다.

## Global Constraints

- **메일 레코드(MX, SPF·DKIM·DMARC 등 TXT)는 건드리지 않는다.** `nabi.kim` 은 웹 레코드만 바꾼다. 바꾸기 전에 레코드 전체를 백업하고, 바꾼 것만 보고한다.
- **비밀값은 출력하지도, 커밋하지도 않는다.**
  - `TURNSTILE_SECRET_KEY` 는 은솔이 `! pnpm exec wrangler secret put TURNSTILE_SECRET_KEY` 로 직접 넣는다.
  - `COMMENT_PEPPER`, `VIEW_SALT_SECRET` 은 `openssl rand -base64 32 | pnpm exec wrangler secret put <NAME>` 으로 넣는다. 값은 화면에 나오지 않는다.
- **Cloudflare API 토큰은 은솔이 만들고, GitHub 시크릿도 은솔이 등록한다**(`! gh secret set ...`).
- 개발 서버가 떠 있으면 빌드하지 않는다(AGENTS.md). 빌드 전에 dev 서버를 끄고, 끝나면 다시 띄운다.
- `database_id` 는 `wrangler d1 create` 로 받아 커밋한다. 자동 생성은 쓰지 않는다(스펙 4.11).
- 커스텀 도메인을 붙이면서 `workers_dev: false`, `preview_urls: false` 로 우회 경로를 막는다.
- 원격 D1 에 확인용으로 남은 행은 검증이 끝나면 지운다.
- Workers 무료 플랜 기준이다. 실제 플랜은 Task 4 에서 확인해 원장에 적는다.
- 커밋은 main 에 바로 하고, 메시지는 한국어로 쓰고, `Co-Authored-By` / `Claude-Session` 두 줄을 붙인다. push 는 Task 7 에서 처음 한다.

## Review Focus

1. **CSP 가 운영 페이지의 하이드레이션, Turnstile, Cloudflare 가 끼워 넣는 스크립트를 막지 않는다.** 콘솔에 CSP 위반이 없어야 한다.
   - Task 2 Step 6(preview), Task 5 Step 6(운영)
2. **정적 에셋 응답과 Worker 응답이 같은 보안 헤더를 단다.** 프리렌더된 `/` 와 Worker 가 만든 `/api/me`·404 가 같아야 한다.
   - Task 2 테스트와 `--live` 판정
3. **`github.event.before` 가 비거나 0 인 실행(첫 push 의 새 브랜치, 수동 실행)도 실패하지 않는다.**
   - Task 3 워크플로 조건, Task 7 Step 5(수동 실행 한 번)
4. **리다이렉트는 경로·쿼리가 붙어도 맞게 가고, 메일 레코드는 백업과 같다.**
   - Task 6 Step 5
5. **`workers.dev` 와 미리보기 URL 로 Access 를 우회할 수 없다.**
   - Task 5 Step 4

---

### Task 1: 남은 링크·검사 지적 처리

계획 4 최종 리뷰에서 넘긴 Minor 중 독자가 겪는 것만 고친다.
- 나머지 둘은 미룬다. 헤딩 안 디렉티브 글자는 문체 가이드가 소제목에 `:term` 을 금지해서 생길 일이 거의 없다. errorComponent `<title>` 은 런타임 오류 화면에서만 보인다. 이유는 원장에 남긴다.

**Files:**
- Modify: `src/markdown/link.ts`, `src/markdown/link.test.ts`
- Modify: `src/content/content-checks.ts`, `src/content/content-checks.test.ts`
- Modify: `scripts/content-check.ts`, `scripts/audit.ts`

**Interfaces:**
- `resolvePostLink(href, locale, enSlugs)` 의 시그니처는 그대로다. 영어로 바꾸는 대상만 좁힌다.
- `ContentPostInput.ko` 에 `draft?: boolean` 을 더한다. `PostSourceInfo` 에도 `draft?: boolean` 을 더한다.

- [ ] **Step 1: 실패하는 테스트 쓰기**

`link.test.ts` 에 아래를 추가한다. `/en` 아래에 실제로 있는 것만 영어로 바꾼다. 있는 것은 `/`, `/posts`, 번역 있는 글과 그 `.md`, `/rss.xml`, `/llms.txt` 다.

```ts
it('영어판이 없는 파일과 정적 에셋은 /en 을 붙이지 않는다', () => {
  const en = new Set(['261020'])
  for (const href of ['/llms-full.txt', '/sitemap.xml', '/robots.txt', '/content-assets/261020/a.png', '/og/ko/261020.png'])
    expect(resolvePostLink(href, 'en', en).href).toBe(href)
  expect(resolvePostLink('/rss.xml', 'en', en).href).toBe('/en/rss.xml')
  expect(resolvePostLink('/llms.txt', 'en', en).href).toBe('/en/llms.txt')
  expect(resolvePostLink('/261020.md', 'en', en).href).toBe('/en/261020.md')
  expect(resolvePostLink('/261021.md', 'en', en)).toEqual({ href: '/261021.md', hrefLang: 'ko', external: false })
  expect(resolvePostLink('/posts?tag=meta', 'en', en).href).toBe('/en/posts?tag=meta')
})
```

`content-checks.test.ts` 에 아래를 추가한다.

```ts
it('공개 글이 초안 글로 링크하면 문제로 낸다. 초안끼리는 괜찮다', () => {
  const site = { posts: new Map([['261020', { ko: new Set<string>() }], ['261021', { ko: new Set<string>(), draft: true }]]) }
  expect(brokenInternalLinks({ slug: '261020', locale: 'ko', markdown: '[a](/261021)' }, site)).toEqual(['/261021 → 초안 글'])
  expect(brokenInternalLinks({ slug: '261022', locale: 'ko', markdown: '[a](/261021)', draft: true }, site)).toEqual([])
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/markdown/link.test.ts src/content/content-checks.test.ts`
Expected: 새 테스트 2개 FAIL. `/en/llms-full.txt` 가 나오고, 초안 링크는 `[]` 로 나온다.

- [ ] **Step 3: 구현**
  - `resolvePostLink`: 위 목록에 든 경로만 `localizePath` 를 거친다. 나머지는 그대로 돌려준다. `/<slug>.md` 는 글과 같은 규칙(번역 없으면 `hrefLang: 'ko'`)을 쓴다.
  - `SiteAnchors` 의 글 항목에 `draft?: boolean` 을 더한다. `brokenInternalLinks` 는 링크하는 글이 초안이 아닐 때만 `→ 초안 글` 을 낸다.
  - `collectContentProblems` 는 `post.ko.draft` 를 `SiteAnchors` 와 `PostSourceInfo` 에 넘긴다.
  - `scripts/content-check.ts` 와 `scripts/audit.ts` 의 글 읽기에서 frontmatter `draft` 를 `ContentPostInput.ko.draft` 로 넘긴다.
  - `scripts/audit.ts` 의 `liveChecks` 는 메타 주소를 모을 때 `paths`(번역 있는 `/en/<slug>` 포함)를 그대로 쓴다. 지금은 따로 만든 목록에 영어 글이 빠져 있다.

- [ ] **Step 4: 통과 확인**

Run: `pnpm test`
Expected: 전체 PASS, 함수 커버리지 100%

- [ ] **Step 5: 커밋**

```bash
git add src/markdown/link.ts src/markdown/link.test.ts src/content/content-checks.ts src/content/content-checks.test.ts scripts/content-check.ts scripts/audit.ts
git commit  # fix: 영어판이 없는 파일 링크에 /en 을 붙이지 않고 초안 글 링크를 잡음
```

### Task 2: 보안 헤더

**Files:**
- Create: `src/lib/security-headers.ts`, `src/lib/security-headers.test.ts`, `public/_headers`
- Modify: `src/server.ts`, `src/lib/audit.ts`, `src/lib/audit.test.ts`, `scripts/audit.ts`

**Interfaces:**
- Produces
  - `SECURITY_HEADERS: Readonly<Record<string, string>>`
  - `withSecurityHeaders(response: Response): Response`
  - `headersFile(): string`
  - `LiveInput.headers: Array<{ path: string; headers: Headers }>` (기존 `Headers` 한 개에서 바꿈)
- `src/lib/audit.ts` 의 이름 목록 `SECURITY_HEADERS` 는 지우고, 새 모듈의 키를 소문자로 쓴다. 이름이 겹친다. Node 스크립트가 부르므로 `./security-headers.ts` 상대 경로로 import 한다.

헤더 값은 아래로 정한다.

| 헤더 | 값 |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |

- `script-src 'unsafe-inline'` 은 TanStack Start 가 페이지마다 넣는 인라인 하이드레이션 스크립트 때문이다. 프리렌더 페이지라 nonce 를 쓸 수 없다. 이 결정은 원장에 남긴다.
- Turnstile 은 `https://challenges.cloudflare.com` 의 스크립트와 iframe 을 쓴다(`src/components/comments/Turnstile.tsx`).

- [ ] **Step 1: 실패하는 테스트 쓰기** (`src/lib/security-headers.test.ts`)

```ts
it('Worker 응답에 보안 헤더를 더하고 상태·기존 헤더는 그대로 둔다', async () => {
  const res = withSecurityHeaders(new Response('없음', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }))
  expect(res.status).toBe(404)
  expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
  expect(res.headers.get('cache-control')).toBe('no-store')
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(res.headers.get(name)).toBe(value)
  expect(await res.text()).toBe('없음')
})

it('리다이렉트 응답도 감싼다', () => {
  const res = withSecurityHeaders(Response.redirect('https://nabichan.me/', 302))
  expect(res.headers.get('location')).toBe('https://nabichan.me/')
  expect(res.headers.get('x-content-type-options')).toBe('nosniff')
})

it('public/_headers 는 lib 에서 만든 내용과 같다', () => {
  expect(headersFile().startsWith('/*\n')).toBe(true)
  expect(readFileSync('public/_headers', 'utf8')).toBe(headersFile())
})
```

`audit.test.ts` 의 live 판정 테스트를 바꾼다. 경로마다 빠진 헤더를 FAIL 로 낸다.

```ts
expect(liveResults({ ...live, headers: [{ path: '/', headers: full }, { path: '/api/me', headers: new Headers() }] }).find((r) => r.id === 'live:headers'))
  .toMatchObject({ status: 'FAIL', details: expect.arrayContaining(['/api/me: content-security-policy']) })
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/lib/security-headers.test.ts src/lib/audit.test.ts`
Expected: 모듈과 `public/_headers` 가 없어 FAIL. live 판정은 WARN 이라 FAIL.

- [ ] **Step 3: 구현**
  - `withSecurityHeaders`: `new Response(res.body, res)` 로 복사한 뒤 헤더를 `set` 한다. `Response.redirect` 는 헤더가 불변이라 복사가 꼭 필요하다.
  - `headersFile()`: `/*` 한 줄 다음에 `  Name: value` 줄들을 쓰고 개행으로 끝낸다. `public/_headers` 는 이 출력 그대로 커밋한다.
  - `src/server.ts`: `fetch` 의 모든 반환값을 `withSecurityHeaders` 로 감싼다. 404, `/admin` 리다이렉트, API, TanStack 핸들러가 다 해당한다. `scheduled` 는 그대로 둔다.
  - `liveResults`: 경로마다 `securityHeaderGaps` 를 돌려 `"<path>: <header>"` 로 모은다. 빠진 게 있으면 FAIL 이다.
  - `scripts/audit.ts`: `/`(정적 에셋)와 `/api/me`(Worker) 두 응답의 헤더를 넘긴다.

- [ ] **Step 4: 통과 확인**

Run: `pnpm test`
Expected: 전체 PASS, 함수 커버리지 100%

- [ ] **Step 5: preview 에서 헤더 확인** (dev 서버를 끄고 혼자 실행)

Run: `pnpm build && pnpm preview --strictPort` 를 백그라운드로 띄운다. 그다음 `curl -sI http://localhost:4173/` 와 `curl -sI http://localhost:4173/api/me` 를 실행한다.
Expected: 두 응답 모두 네 헤더가 있다.
- preview 가 `_headers` 를 적용하지 않아 `/` 에만 없을 수 있다. 그렇다면 원장에 `Ruling` 으로 적고, 정적 응답 확인은 Task 5 Step 5 로 넘긴다. `/api/me` 에는 반드시 있어야 한다.

- [ ] **Step 6: 브라우저에서 CSP 위반 확인**
  - Task 1 처럼 임시 글(`content/posts/261019/index.ko.md`)을 하나 넣고 다시 빌드한 뒤 preview 를 띄운다.
  - chrome-devtools 로 `/`, `/en`, `/posts`, `/261019` 를 열고 콘솔에 CSP 위반이 없는지 본다.
  - 글 페이지에서는 댓글 칸까지 스크롤해 Turnstile 테스트 위젯이 뜨는지 본다.
  - 확인한 뒤 임시 글과 `dist` 를 지운다.

Expected: 위반 0건, Turnstile 위젯이 보임

- [ ] **Step 7: 커밋**

```bash
git add src/lib/security-headers.ts src/lib/security-headers.test.ts public/_headers src/server.ts src/lib/audit.ts src/lib/audit.test.ts scripts/audit.ts
git commit  # feat: 정적 응답과 Worker 응답에 같은 보안 헤더(CSP 포함)를 담
```

### Task 3: 배포 워크플로와 배포 스모크

**Files:**
- Modify: `src/lib/smoke.ts`, `src/lib/smoke.test.ts`, `scripts/smoke.ts`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `extractStylesheets(html: string): string[]`. `<link rel="stylesheet">` 의 `href` 를 문서 순서대로 돌려준다.
- Consumes
  - `pnpm audit:repo --build [--base <sha>]` (계획 4)
  - `pnpm indexnow --submit --base <sha> --head <sha>` (계획 3)

- [ ] **Step 1: 실패하는 테스트 쓰기** (`smoke.test.ts`)

```ts
it('stylesheet 링크의 주소만 고른다', () => {
  const html = '<link rel="preload" href="/fonts/a.woff2"/><link rel="stylesheet" href="/assets/app-abc.css"/><link href="/assets/b.css" rel="stylesheet">'
  expect(extractStylesheets(html)).toEqual(['/assets/app-abc.css', '/assets/b.css'])
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/lib/smoke.test.ts`
Expected: FAIL (`extractStylesheets is not a function`)

- [ ] **Step 3: 구현**
  - `extractStylesheets`: `extractMetaUrls` 와 같은 태그·속성 파싱을 쓴다.
  - `scripts/smoke.ts`: `/` 의 stylesheet 마다 GET 한다. 200 이 아니거나 `content-type` 에 `text/css` 가 없으면 실패로 센다. 스펙 4.11 6단계의 "배포된 CSS 존재"다.

- [ ] **Step 4: 통과 확인**

Run: `pnpm test`
Expected: 전체 PASS

- [ ] **Step 5: 워크플로 쓰기** (`.github/workflows/deploy.yml`)
  - 액션 메이저 버전은 쓰기 직전에 확인한다: `gh api repos/<owner>/<repo>/releases/latest --jq .tag_name`
  - 대상은 `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` 다.

```yaml
name: deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
concurrency:
  group: deploy
  cancel-in-progress: false
permissions:
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      # push 직전 커밋. 수동 실행이면 비어 있고, 새 브랜치면 0 이 40개다
      BEFORE: ${{ github.event.before }}
    steps:
      - uses: actions/checkout@<확인한 메이저>
        with:
          fetch-depth: 0 # 바뀐 글·마이그레이션을 이전 커밋과 비교한다
      - uses: pnpm/action-setup@<확인한 메이저> # 버전은 package.json packageManager
      - uses: actions/setup-node@<확인한 메이저>
        with:
          node-version: 26
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: 점검 (게이트)
        run: |
          if [[ -z "$BEFORE" || "$BEFORE" =~ ^0+$ ]]; then pnpm audit:repo --build; else pnpm audit:repo --build --base "$BEFORE"; fi
      - name: 원격 D1 마이그레이션
        run: pnpm exec wrangler d1 migrations apply DB --remote
      - name: 배포
        run: pnpm exec wrangler deploy
      - name: 배포 스모크
        run: pnpm smoke https://nabichan.me
      - name: 바뀐 글 IndexNow
        if: github.event_name == 'push'
        run: |
          if [[ "$BEFORE" =~ ^0+$ ]]; then echo "이전 커밋이 없어 건너뜀"; exit 0; fi
          pnpm indexnow --submit --base "$BEFORE" --head "$GITHUB_SHA"
```

- [ ] **Step 6: 워크플로 문법 확인**

Run: `node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/deploy.yml','utf8'))" && echo ok`
Expected: `ok`. 실제 실행 확인은 Task 7 에서 한다.

- [ ] **Step 7: 커밋**

```bash
git add src/lib/smoke.ts src/lib/smoke.test.ts scripts/smoke.ts .github/workflows/deploy.yml
git commit  # feat: main push 배포 워크플로와 배포된 CSS 를 보는 스모크
```

### Task 4: Cloudflare 리소스 준비

[은솔] 표시가 붙은 단계는 은솔이 대시보드에서 한다. 이로하는 넣을 값을 먼저 정리해 보여 준다.

**Files:**
- Modify: `wrangler.jsonc`

- [ ] **Step 1: 계정과 zone 확인**
  - Run: `pnpm exec wrangler whoami`
    - Expected: 은솔 계정으로 로그인돼 있다. 계정 ID 와 플랜(무료/유료)을 원장에 적는다.
    - 로그인이 안 돼 있으면 은솔에게 `! pnpm exec wrangler login` 을 부탁한다.
  - Run: `dig NS nabichan.me +short; dig NS nabi.kim +short`
    - Expected: 둘 다 `*.ns.cloudflare.com`

- [ ] **Step 2: D1 만들기**

Run: `pnpm exec wrangler d1 create eunsol-blog`
- 나온 `database_id` 를 `wrangler.jsonc` 의 `d1_databases[0]` 에 넣는다.
- 이어서 `pnpm exec wrangler d1 migrations apply DB --remote` 를 실행하고, `pnpm exec wrangler d1 migrations list DB --remote` 로 확인한다.

Expected: 미적용 마이그레이션 없음

- [ ] **Step 3: [은솔] Turnstile 위젯**
  - 대시보드 → Turnstile → 위젯 추가
    - 이름: `nabichan.me`
    - 호스트 이름: `nabichan.me`
    - 모드: Managed
  - 사이트 키(공개 값)를 이로하에게 준다. 시크릿 키는 Task 5 Step 3 에서 은솔이 직접 넣는다.

- [ ] **Step 4: [은솔] Cloudflare Access**
  - Zero Trust 팀이 없으면 무료 플랜으로 만든다. 팀 이름은 은솔이 정한다.
  - 로그인 방식: One-time PIN(이메일 OTP)
  - 애플리케이션: Self-hosted
    - 도메인: `nabichan.me`, 경로: `admin`
    - 세션 시간: 24시간
    - 쿠키 경로 속성: 끔(기본값). SameSite: Lax
  - 정책: Allow, Emails = 은솔이 정한 허용 이메일 한 개
  - 팀 도메인(`<team>.cloudflareaccess.com`)과 애플리케이션 AUD 태그를 이로하에게 준다.

- [ ] **Step 5: `wrangler.jsonc` 를 운영 값으로**
  - `vars`
    - `TURNSTILE_SITE_KEY`: Step 3 사이트 키
    - `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`: Step 4 값
    - `OWNER_EMAIL`: 은솔에게 받은 허용 이메일. 은솔 결정대로 vars 에 커밋해서 공개된다.
  - `"routes": [{ "pattern": "nabichan.me", "custom_domain": true }]`
  - `"workers_dev": false`, `"preview_urls": false`
  - 로컬은 `.dev.vars` 가 `vars` 를 덮으니 dev·preview 는 계속 테스트 키로 돈다. 이게 맞는지 `pnpm dev` 후 `/api/me` 의 `turnstileSiteKey` 가 `1x00000000000000000000AA` 인지 본다.

- [ ] **Step 6: 확인**

Run: `pnpm cf-typegen && pnpm check && pnpm audit:repo`
Expected: 타입 파일 diff 없음, FAIL 0

- [ ] **Step 7: 커밋**

```bash
git add wrangler.jsonc
git commit  # chore: 운영 D1·Turnstile·Access 값과 커스텀 도메인을 wrangler 설정에 넣음
```

### Task 5: 첫 배포와 확인

- [ ] **Step 1: 혼자 빌드**
  - dev 서버를 끈다.
  - Run: `pnpm audit:repo --build`
  - Expected: FAIL 0

- [ ] **Step 2: 배포**

Run: `pnpm exec wrangler deploy`
Expected: `nabichan.me` 커스텀 도메인이 붙었다는 출력이 나온다. `workers.dev` 주소는 없다.

- [ ] **Step 3: 시크릿 넣기**
  - 이로하:
    - `openssl rand -base64 32 | pnpm exec wrangler secret put COMMENT_PEPPER`
    - `VIEW_SALT_SECRET` 도 같은 방법으로 넣는다.
  - [은솔]: `! pnpm exec wrangler secret put TURNSTILE_SECRET_KEY`
  - Run: `pnpm exec wrangler secret list`
  - Expected: 이름 세 개만 보이고 값은 보이지 않는다.

- [ ] **Step 4: 우회 경로 확인**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://eunsol-blog.<계정 workers.dev 서브도메인>.workers.dev/`
Expected: 200 이 아니다. 서브도메인은 대시보드 Workers 개요나 `wrangler whoami` 로 확인한다.

- [ ] **Step 5: 운영 스모크와 헤더**
  - Run: `pnpm smoke https://nabichan.me`
    - Expected: 모두 통과. 글 0편이라 글 페이지 검사는 건너뛴다.
  - Run: `curl -sI https://nabichan.me/ ; curl -sI https://nabichan.me/api/me`
    - Expected: 두 응답 모두 보안 헤더 네 개가 있다.

- [ ] **Step 6: 브라우저 확인 (chrome-devtools)**
  - `https://nabichan.me/`, `/en`, `/posts` 를 연다.
  - 콘솔에 CSP 위반이 없어야 한다. Cloudflare 가 끼워 넣은 스크립트(예: Web Analytics, 이메일 보호)가 막히면 그 출처만 CSP 에 더한다. Task 2 lib 과 `_headers` 를 같이 고치고 테스트를 돌린다.
  - 오늘·전체 조회수 숫자가 뜬다.

- [ ] **Step 7: [은솔] Access 로그인 확인**
  - 은솔이 `https://nabichan.me/admin?return=/en` 을 열고 이메일 OTP 로 로그인한다.
  - `/en` 으로 돌아오는지, 그 브라우저에서 `/api/me` 가 `"owner":true` 인지 본다.
  - 마지막으로 `/cdn-cgi/access/logout` 이 열리는지 본다.
  - 한계: 로그아웃해도 세션 24시간이 끝날 때까지 API 쪽 은솔 판정은 남는다(스펙 4.7). 은솔에게 다시 알린다.

- [ ] **Step 8: AI 크롤러 설정 확인**
  - Run: `curl -s https://nabichan.me/robots.txt | head -5`
    - Expected: 첫 줄부터 이 저장소의 robots 내용이다. Cloudflare managed robots 가 앞에 붙지 않는다.
  - Run: `curl -s -o /dev/null -w "%{http_code}\n" -A "GPTBot/1.2" https://nabichan.me/`
    - Expected: 200
  - 둘 중 하나라도 어긋나면 [은솔] 대시보드 → AI Crawl Control 에서 차단과 managed robots.txt 를 끈다.

- [ ] **Step 9: 원격 D1 확인용 행 지우기**
  - Run: `pnpm exec wrangler d1 execute DB --remote --command "SELECT (SELECT count(*) FROM comments), (SELECT count(*) FROM post_views), (SELECT count(*) FROM site_views), (SELECT count(*) FROM site_daily_views), (SELECT count(*) FROM view_dedupe), (SELECT count(*) FROM attempts)"`
  - 0 이 아닌 테이블만 `DELETE FROM <table>` 로 비우고 같은 SELECT 로 다시 본다.

Expected: 전부 0

### Task 6: `www.nabichan.me`·`nabi.kim` 리다이렉트

DNS 와 리다이렉트 규칙은 은솔이 만든 **임시 토큰**으로 이로하가 바꾼다.
- 권한: 두 zone 한정 Zone Read, DNS Edit, Single Redirect(Dynamic Redirect) Edit
- 은솔이 토큰을 `~/.agent-temp/cf-deploy/token`(권한 600)에 저장한다. 이로하는 `$(cat …)` 로만 읽고 출력하지 않는다.
- 이 Task 가 끝나면 은솔이 토큰을 폐기하고, 이로하는 파일을 지운다.

- [ ] **Step 1: 백업**
  - API 로 두 zone 의 DNS 레코드 전체를 `~/.agent-temp/cf-deploy/<zone>-records-before.json` 에 저장한다.
  - 공개 조회도 같이 남긴다: `dig +short MX nabi.kim; dig +short TXT nabi.kim; dig +short TXT _dmarc.nabi.kim`
  - 레코드 목록(이름·종류·프록시 여부)을 은솔에게 보여 준다. 바꿀 웹 레코드만 표시해 확인받는다.

- [ ] **Step 2: 웹 레코드**
  - `nabi.kim`, `www.nabi.kim`, `www.nabichan.me` 에 프록시된 웹 레코드가 있어야 리다이렉트 규칙이 걸린다.
    - 없으면 `AAAA 100::`(프록시)를 만든다.
    - 다른 곳을 가리키는 A/AAAA/CNAME 이 있으면 그 레코드만 `AAAA 100::`(프록시)로 바꾼다.
  - MX·TXT 는 손대지 않는다.

- [ ] **Step 3: Single Redirect 규칙**
  - zone `nabi.kim`: `(http.host in {"nabi.kim" "www.nabi.kim"})` → `https://nabichan.me/` 301. 경로와 쿼리는 버린다(스펙 4.11).
  - zone `nabichan.me`: `(http.host eq "www.nabichan.me")` → `concat("https://nabichan.me", http.request.uri.path)` 301. 쿼리는 유지한다.

- [ ] **Step 4: 리다이렉트 확인**

```sh
curl -sI "https://nabi.kim/old/path?x=1" | grep -iE "^(HTTP|location)"
curl -sI https://www.nabi.kim/ | grep -iE "^(HTTP|location)"
curl -sI "https://www.nabichan.me/posts?tag=meta" | grep -iE "^(HTTP|location)"
```

Expected:
- 앞의 둘은 `301`, `location: https://nabichan.me/`
- 마지막은 `301`, `location: https://nabichan.me/posts?tag=meta`

- [ ] **Step 5: 메일 레코드가 그대로인지**
  - API 로 레코드를 다시 받는다(`...-records-after.json`).
  - 백업과 비교해 MX·TXT 레코드가 한 줄도 다르지 않은지 본다. Step 1 의 `dig` 결과도 같아야 한다.
  - 바뀐 레코드 목록만 은솔에게 보고한다.

- [ ] **Step 6: `--live` 점검**

Run: `pnpm audit:repo --live`
Expected: FAIL 0. 남은 WARN 은 원장에 적는다.

- [ ] **Step 7: 정리**
  - [은솔] 임시 토큰을 폐기한다.
  - 이로하는 `~/.agent-temp/cf-deploy/token` 을 지운다.
  - 백업 JSON 은 `temp.local/deploy/` 로 옮겨 둔다(gitignore).

### Task 7: GitHub Actions 로 넘기기

- [ ] **Step 1: [은솔] CI 토큰과 시크릿**
  - 토큰 권한: "Edit Cloudflare Workers" 템플릿 + Account D1 Edit. 은솔 계정과 zone `nabichan.me` 로 한정한다.
  - `! gh secret set CLOUDFLARE_API_TOKEN`
  - `! gh secret set CLOUDFLARE_ACCOUNT_ID`
  - Run: `gh secret list`
  - Expected: 두 이름이 보인다.

- [ ] **Step 2: AGENTS.md 에 배포 절 추가**
  - 배포 방식: main push → Actions. 단계는 audit → 마이그레이션 → deploy → 스모크 → IndexNow.
  - 시크릿 이름(Worker 3개, GitHub 2개)과 각각 누가 관리하는지
  - Access 세션 24시간과 로그아웃 한계
  - "첫 글 공개 때 한 번 할 일": Task 8 의 체크리스트를 그대로 옮긴다.

- [ ] **Step 3: 커밋하고 push**

```bash
git add AGENTS.md
git commit  # docs: 배포 방식과 첫 글 공개 체크리스트를 AGENTS.md 에 남김
git push origin main
```

- [ ] **Step 4: 실행 확인**

Run: `gh run watch --exit-status $(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: success.
- audit PASS
- 마이그레이션은 바뀐 것 없음
- deploy 와 스모크 통과
- IndexNow 는 보낼 글 0개

- [ ] **Step 5: 수동 실행 한 번** (Review Focus 3)

Run: `gh workflow run deploy.yml` 다음 Step 4 와 같은 watch
Expected: success. `BEFORE` 가 비어 있어도 audit 이 기본 기준점으로 돌고, IndexNow 단계는 `push` 가 아니라 건너뛴다.

### Task 8: 첫 글 공개 때 검증 (첫 공개 글이 main 에 들어간 뒤 실행)

이 계획을 실행할 때는 하지 않는다. Task 7 Step 2 에서 AGENTS.md 에 옮긴 체크리스트를 첫 글 공개 때 한 번 실행한다.

- [ ] **Step 1: Actions 배포 확인**
  - 첫 글 push 의 실행이 success 다.
  - IndexNow 가 그 글의 ko(+en) 주소를 보냈다.
  - `pnpm smoke https://nabichan.me` 가 글 페이지 검사까지 통과한다.

- [ ] **Step 2: 댓글 실검증 (실제 Turnstile)**
  - 작성, 수정, 삭제
  - 틀린 비밀번호는 403, 반복하면 429
  - 예약 이름 거절
  - 은솔이 Access 로그인 상태로 쓴 댓글에 배지가 붙는다.

- [ ] **Step 3: PBKDF2 CPU 실측**
  - Workers Logs(observability)에서 댓글 작성(`POST /api/posts/<slug>/comments`) 호출의 CPU 시간을 본다.
  - 무료 플랜이고 CPU 시간이 10ms 를 넘거나 1102 오류가 나면 `PASSWORD_ITERATIONS`(지금 50,000)를 낮춘다. 테스트 기대값부터 바꾸고 배포한다. 해시에 반복 횟수가 저장돼 있어 예전 댓글은 그대로 검증된다.

- [ ] **Step 4: 조회수**
  - 같은 브라우저로 새로고침해도 글 조회수는 하루 1회만 오른다.
  - 오늘·전체도 같다.

- [ ] **Step 5: 확인용 행 지우기**
  - Task 5 Step 9 와 같은 SELECT 와 DELETE 로 0 으로 되돌린다.
  - 은솔이 실제로 남길 댓글이 있으면 먼저 은솔에게 묻는다.
