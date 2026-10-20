# 블로그 기반 계획 1: 코어 (스파이크 · 콘텐츠 · Markdown · 다국어 · 화면 · 폰트) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/`, `/posts`, `/posts/$slug`(그리고 `/en/...`)가 Markdown 글을 두 언어로 프리렌더해서 Cloudflare Workers(workerd preview)에서 띄운다.

**Architecture:**
- TanStack Start 를 `@cloudflare/vite-plugin` 위에서 돌리고, 글·목록 페이지는 빌드할 때 프리렌더한다.
- Content Collections `transform` 이 Markdown 을 빌드 시점에 HTML 로 만든다(unified). 생성물은 서버 전용이고 라우트는 서버 함수로 데이터를 받는다.
- UI 문자열과 현재 언어는 Paraglide 가 맡는다. URL 접두사는 TanStack Router `rewrite` 로 처리한다.

**Tech Stack:** Node 26, pnpm 12, TanStack Start ≥1.169, Vite 8, @cloudflare/vite-plugin ^1, Tailwind 4.3 + typography, Content Collections 0.15, unified(remark/rehype, remark-directive) + rehype-pretty-code + shiki, sharp(빌드 전용), Paraglide JS 2(정확한 버전 고정), lucide-react 1, vitest

**Spec:** `docs/superpowers/specs/2026-10-20-blog-foundation-design.md`
- 이 계획은 스펙 7장 순서 1~2 와 3 일부(다국어)를 구현한다.
- 나머지는 이 계획이 끝난 뒤 따로 쓴다: 댓글·조회수(계획 2), SEO/GEO 산출물(계획 3), 커맨드·샘플 글 본문(계획 4), 배포(계획 5).

## Global Constraints

### 버전

| 대상 | 버전·조건 |
|---|---|
| Node | `26` |
| pnpm | `12.14.0` (`packageManager`, `engines`, `mise.toml` 에 고정) |
| TanStack Start | `≥1.169`. 서버 함수 입력 검증은 `.validator()` 다. `.inputValidator()` 는 없다 |
| Vite | `8.x` |
| `@vitejs/plugin-react` | `6.x` |
| `@cloudflare/vite-plugin` | `^1`. v2 베타는 금지 |
| wrangler | `≥4.107` |
| `@inlang/paraglide-js` | `^` 없이 정확한 버전으로 고정 |
| `lucide-react` | `1.x` |

### 런타임 번들

- Worker 와 클라이언트 번들에 Markdown 파서(unified, micromark)와 Shiki 가 없어야 한다.
- 클라이언트 번들에는 글 본문이나 Content Collections 데이터도 없어야 한다.

### 데이터 접근

- Content Collections 생성물은 서버 전용이다. 생성 파일에 `import '@tanstack/react-start/server-only'` 를 붙인다.
- 라우트는 서버 함수로만 글 데이터를 받는다.
- 서버 함수에는 언어를 **항상 입력으로 넘긴다.** 서버 함수 안에서 `getLocale()` 을 쓰지 않는다.

### URL

- canonical URL 은 **슬래시 없음**이다. `/posts/<slug>` 같은 정규 URL 이 리다이렉트되면 안 된다.

### 콘텐츠

- 원본 HTML 태그는 출력에 나오지 않는다. remark-rehype 에서 `allowDangerousHtml` 을 쓰지 않는다.
- frontmatter 날짜는 KST 로 해석한다.
  - 허용 형식: `YYYY-MM-DD`, `YYYY-MM-DD HH:mm`, `YYYY-MM-DD HH:mm:ss`
  - 화면에 표시할 때는 `timeZone: 'Asia/Seoul'` 을 쓴다.
- 영어 번역본의 `sourceHash` 가 원문 해시(본문 + title + description)와 다르면 **프로덕션 빌드가 실패해야 한다.**
- draft 글은 프로덕션 빌드의 목록, 상세, 프리렌더에서 빠지고 dev 에서는 보인다.

### 테스트 규칙 [은솔: 각 lib 함수마다 vitest]

- **lib 모듈의 export 함수는 전부 vitest 테스트를 가진다.**
  - 대상 디렉터리: `src/content`, `src/markdown`, `src/lib`, `src/widgets`
  - 테스트 파일: 같은 위치의 `<모듈>.test.ts`
  - remark/rehype 플러그인은 플러그인마다 자기 테스트 파일에서 그 플러그인만 넣은 최소 파이프라인으로 검증한다(`src/markdown/test-utils.ts` 의 `runPlugins`). `renderMarkdown` 통합 테스트는 `render.test.ts` 에 따로 둔다.
- **스크립트(`scripts/*.ts`)와 컴포넌트는 얇게 둔다.**
  - 판단 로직은 lib 모듈의 순수 함수로 빼서 테스트한다.
  - 예: 스모크 판정, rehash 문자열 처리, 퍼센트 인코딩 판정, 툴팁 위치 계산, 태그 필터 CSS 생성
- **커버리지로 강제한다.** `@vitest/coverage-v8` 를 쓰고 `pnpm test` 는 `vitest run --coverage` 다.
  - `coverage.include`: 위 네 디렉터리의 `*.ts`, `*.tsx`
  - `coverage.exclude`: `**/*.test.ts`, `src/markdown/test-utils.ts`, Content Collections 생성물을 연결만 하는 `src/content/posts.server.ts`, 서버 함수 선언만 있는 `src/content/posts.functions.ts`, 위젯 컴포넌트 본체 `src/widgets/*.tsx`
  - `coverage.thresholds`: `{ functions: 100, lines: 90 }`
  - 임계값을 넘지 못하면 `pnpm test` 가 실패한다.

### import 규칙

- `content-collections.ts` 가 불러오는 모듈(`src/content/*`, `src/markdown/*`, `src/widgets/names.ts`)끼리는 상대 경로 import 만 쓴다. 이 모듈들은 React 를 import 하지 않는다.
- 이 모듈들에서 `~/` 별칭은 `import type` 으로만 쓴다.
- 앱 코드는 Paraglide 를 직접 import 하지 않고 `~/i18n/runtime`, `~/i18n/messages` 를 거친다. 스파이크에서 막혀 직접 구현으로 되돌릴 때 이 두 파일만 바꾸면 되게 하려는 것이다.

### 작업 규칙

- 개발 서버가 떠 있을 때 `pnpm build` 를 돌리지 않는다.
- 코드 주석과 커밋 메시지는 한국어로 쓴다.
- 커밋은 main 에 직접 한다. 메시지 끝에 다음 두 줄을 붙인다.
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RzL49ncQEeheb9KHNoMXPM
  ```
- "프리뷰" 는 다음 순서로 돌린다.
  1. `pnpm build`
  2. `pnpm preview --port 4173` 을 백그라운드로 띄운다.
  3. `http://localhost:4173/` 이 응답할 때까지 기다린다.
  4. `pnpm smoke http://localhost:4173` 을 돌린다.
  5. 끝나면 프리뷰를 종료한다.

## Review Focus

1. **`/posts?tag=x` 새로고침**
   - 위험: 프리렌더 HTML 은 필터가 없는 목록이다. React 렌더 결과가 쿼리에 따라 달라지면 hydration 불일치나 화면 번쩍임이 생긴다.
   - 기대: 렌더 결과는 쿼리와 무관하고, 필터는 CSS 속성으로만 적용된다. (Task 7)
2. **같은 제목의 헤딩, 인라인 코드가 든 헤딩, 한글 헤딩**
   - 기대: TOC 링크와 본문 헤딩 id 가 정확히 일치하고, 중복은 `-1` 로 구분된다. (Task 4)
3. **원문이 draft 인데 영어 번역본이 있는 글**
   - 기대: 프로덕션에서 영어 쪽도 숨겨진다. (Task 3)
4. **비정규 URL: `/en/`, `/posts/<slug>/`, `/EN/posts`, `/fr/posts`**
   - 기대: 정규 URL 은 200 이다. 슬래시가 붙은 변형은 정규 URL 로 한 번 리다이렉트된다. 없는 언어 접두사는 404 다. (Task 2, 4)
5. **깨진 퍼센트 인코딩 `/posts/%E0`**
   - 기대: 500 이 아니라 404 다. (Task 2)

---

## 파일 구조

```
mise.toml, package.json, pnpm-workspace.yaml, .gitignore, tsconfig.json
vite.config.ts                  # content-collections → tailwind → paraglide → cloudflare → tanstackStart → react
vitest.config.ts                # 플러그인 없이 순수 함수만
wrangler.jsonc, worker-configuration.d.ts (wrangler types 결과, 커밋)
project.inlang/settings.json, messages/ko.json, messages/en.json
content-collections.ts          # koPosts, enPosts, tagLabels + server-only writer hook
content/tags.yaml
content/posts/how-this-blog-is-built/{index.ko.md,index.en.md,diagram.svg}
scripts/smoke.ts, scripts/content-rehash.ts
scripts/fonts/ranges.txt, scripts/fonts/build_suit.py
public/fonts/suit/*.woff2, public/fonts/suit/OFL.txt
public/content-assets/           # 생성물 (gitignore)
src/server.ts                   # 퍼센트 인코딩 가드 + paraglideMiddleware + TanStack handler
src/client.tsx                  # hydrateRoot + onRecoverableError 기록
src/router.tsx                  # rewrite: deLocalizeUrl / localizeUrl
src/site.ts
src/i18n/runtime.ts, src/i18n/messages.ts
src/content/constants.ts, date.ts, source-hash.ts, resolve-en-post.ts, post-index.ts
src/content/posts.server.ts, src/content/posts.functions.ts
src/markdown/render.ts, link.ts, assets.ts, rehype-toc.ts, remark-callouts.ts, rehype-figure.ts, rehype-local-images.ts, rehype-links.ts
src/markdown/remark-directive-guard.ts, remark-details.ts, remark-see-also.ts, remark-quote.ts, remark-term.ts, remark-widget.ts
content/glossary.yaml
src/widgets/names.ts, registry.ts, counter-demo.tsx
src/components/TermTooltips.tsx, WidgetMounter.tsx
src/components/Layout.tsx, PostList.tsx, TagFilter.tsx, LanguageSwitch.tsx, NotFound.tsx, Toc.tsx
src/routes/__root.tsx, index.tsx, posts/index.tsx, posts/$slug.tsx
src/styles/app.css, src/styles/fonts.css (생성물), src/styles/prose.css
```

---

### Task 1: 프로젝트 골격과 Workers 프리뷰

**Files:**
- Create: `mise.toml`, `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `wrangler.jsonc`, `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/styles/app.css`, `src/lib/smoke.ts`, `scripts/smoke.ts`
- Test: `src/lib/smoke.test.ts`
- Generated + commit: `src/routeTree.gen.ts`, `worker-configuration.d.ts`

**Interfaces:**
- Produces
  ```ts
  // src/lib/smoke.ts
  export type SmokeCheck = { path: string; status: number; contains?: string[]; notContains?: string[]; location?: string }
  export function checkResponse(check: SmokeCheck, res: { status: number; location: string | null; body: string }): string[]
  // 어긋난 점을 한국어 문장으로 돌려준다. 빈 배열이면 통과

  // scripts/smoke.ts (얇은 CLI)
  export const CHECKS: SmokeCheck[]
  // 사용법: node scripts/smoke.ts <baseUrl>
  // 요청은 redirect: 'manual' 로 보내고 checkResponse 결과를 모아 출력한다. 실패가 있으면 exit 1
  // 이후 태스크는 CHECKS 에 항목만 추가한다
  ```

- [ ] **Step 1: 버전을 고정한다**
  - `mise.toml`: `[tools] node = "26"`, `pnpm = "12.14.0"`
  - `package.json`: `"type": "module"`, `"packageManager": "pnpm@12.14.0"`, `"engines": { "node": ">=26" }`

- [ ] **Step 2: 의존성을 설치한다**
  - TanStack 공식 `examples/react/start-basic-cloudflare` 의 `package.json` 구성을 따른다. `typescript` 는 `npm:@typescript/typescript6` alias, `@typescript/native` 는 TS7 이다.

    ```bash
    pnpm add @tanstack/react-start @tanstack/react-router react react-dom lucide-react
    pnpm add -D vite @vitejs/plugin-react @cloudflare/vite-plugin@^1 wrangler tailwindcss @tailwindcss/vite @tailwindcss/typography @types/react @types/react-dom @types/node vitest
    ```

  - `pnpm approve-builds` 로 `workerd`·`esbuild` 를 승인한다. 결과는 `pnpm-workspace.yaml` 의 `allowBuilds` 에 남는다.

- [ ] **Step 3: 설정 파일을 쓴다**

  `wrangler.jsonc`:

  ```jsonc
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "eunsol-blog",
    "main": "@tanstack/react-start/server-entry",   // Task 2 에서 ./src/server.ts 로 바꾼다
    "compatibility_date": "2026-10-20",
    "compatibility_flags": ["nodejs_compat"],
    "observability": { "enabled": true },
    "assets": { "html_handling": "auto-trailing-slash" }
  }
  ```

  - `vite.config.ts`: 공식 cloudflare 예제 그대로 쓴다.
    - `resolve: { tsconfigPaths: true }`
    - 플러그인 순서: `tailwindcss()`, `cloudflare({ viteEnvironment: { name: 'ssr' } })`, `tanstackStart()`, `viteReact()`
  - `tsconfig.json`: 예제 설정에 다음을 더한다.
    - `"paths": { "~/*": ["./src/*"] }`
    - `"allowImportingTsExtensions": true`
    - `"types": ["./worker-configuration.d.ts", "node", "vite/client"]`
  - `.gitignore`: `node_modules`, `dist`, `.wrangler`, `.content-collections`, `src/paraglide`, `public/content-assets`, `.dev.vars`, `.audit-report.json`, `project.inlang/cache`
  - `src/styles/app.css`: `@import "tailwindcss"; @plugin "@tailwindcss/typography";`
  - `__root.tsx` 에서 이 CSS 를 `?url` 로 불러 `head.links` 에 넣는다.

- [ ] **Step 4: 스크립트를 넣는다**

  ```json
  "dev": "vite dev", "build": "vite build", "preview": "vite preview",
  "cf-typegen": "wrangler types", "check": "tsc --noEmit", "test": "vitest run",
  "smoke": "node scripts/smoke.ts"
  ```

  - `"test": "vitest run --coverage"` 로 둔다.
  - `pnpm add -D @vitest/coverage-v8`
  - `vitest.config.ts`: `resolve.tsconfigPaths` 만 켜고 플러그인은 넣지 않는다. 커버리지 설정은 Global Constraints 의 테스트 규칙대로 쓴다.

- [ ] **Step 5: `checkResponse` 를 TDD 로 만들고 스모크 CLI 를 연결한다**
  - 실패하는 테스트

    ```ts
    // src/lib/smoke.test.ts
    expect(checkResponse({ path: '/', status: 200 }, { status: 200, location: null, body: '' })).toEqual([])
    expect(checkResponse({ path: '/', status: 200 }, { status: 404, location: null, body: '' })).toEqual(['/: 상태 코드 200 기대, 실제 404'])
    expect(checkResponse({ path: '/', status: 200, contains: ['lang="ko"'] }, { status: 200, location: null, body: '<html lang="en">' }))
      .toEqual(['/: "lang="ko"" 가 없습니다'])
    expect(checkResponse({ path: '/', status: 200, notContains: ['secret'] }, { status: 200, location: null, body: 'secret' }))
      .toEqual(['/: "secret" 가 있으면 안 됩니다'])
    expect(checkResponse({ path: '/en/', status: 307, location: '/en' }, { status: 308, location: 'http://x/en', body: '' })).toEqual([])   // 3xx 끼리는 같다고 본다
    expect(checkResponse({ path: '/en/', status: 307, location: '/en' }, { status: 307, location: '/fr', body: '' }))
      .toEqual(['/en/: Location 이 "/en" 으로 끝나야 합니다 (실제 /fr)'])
    ```

  - `pnpm test` 로 FAIL 을 확인한 뒤 구현하고, 다시 돌려 PASS 를 확인한다.
  - `scripts/smoke.ts` 의 첫 항목: `{ path: '/', status: 200, contains: ['<html'] }`

- [ ] **Step 6: 확인한다**
  - 실행: `pnpm cf-typegen` 다음 프리뷰
  - 기대: `1/1 통과`

- [ ] **Step 7: 커밋한다**

  ```bash
  git add -A && git commit -m "chore: TanStack Start + Cloudflare Workers 골격 구성"
  ```

### Task 2: Paraglide 다국어 라우팅 (스파이크 ①)

**Files:**
- Create: `project.inlang/settings.json`, `messages/ko.json`, `messages/en.json`, `src/server.ts`, `src/lib/url-guard.ts`, `src/i18n/runtime.ts`, `src/i18n/messages.ts`, `src/routes/posts/index.tsx`(임시 본문)
- Test: `src/lib/url-guard.test.ts`
- Modify: `vite.config.ts`, `wrangler.jsonc`(`main` → `./src/server.ts`), `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `package.json`, `scripts/smoke.ts`

**Interfaces:**
- Produces
  - `~/i18n/runtime` 재수출: `type Locale = 'ko' | 'en'`, `locales`, `baseLocale`, `getLocale(): Locale`, `localizeHref(href: string, opts?: { locale?: Locale }): string`, `deLocalizeUrl`, `localizeUrl`
  - `~/i18n/messages` 재수출: `m`
  - 메시지 키 (ko/en 둘 다): `site_name`, `nav_posts`, `lobby_intro`(자리표시), `lobby_recent_posts`, `lobby_view_all`, `posts_title`, `posts_all_tags`, `posts_empty`, `post_updated`, `post_toc`, `post_read_in_other_language`, `not_found_title`, `not_found_description`, `not_found_back_home`, `footer_license`

- [ ] **Step 1: Paraglide 를 설치하고 inlang 프로젝트를 만든다**
  - 설치: `pnpm add -D @inlang/paraglide-js@<npm view 로 확인한 최신 정확 버전>`
  - `project.inlang/settings.json` 은 TanStack `start-i18n-paraglide` 예제 형식을 따른다.
    - `baseLocale: "ko"`, `locales: ["ko", "en"]`
    - `pathPattern: "./messages/{locale}.json"`
  - 메시지 키를 ko/en 으로 채운다.

- [ ] **Step 2: vite 플러그인을 추가한다 (`tanstackStart` 보다 앞)**

  ```ts
  paraglideVitePlugin({
    project: './project.inlang',
    outdir: './src/paraglide',
    outputStructure: 'message-modules',
    strategy: ['url', 'baseLocale'],
    urlPatterns: [
      { pattern: '/:path(.*)?', localized: [['en', '/en/:path(.*)?'], ['ko', '/:path(.*)?']] },
    ],
  })
  ```

  - `package.json` 에 `"i18n:compile": "paraglide-js compile --project ./project.inlang --outdir ./src/paraglide"` 를 추가한다.
  - `check` 와 `test` 앞에 `pnpm i18n:compile &&` 를 붙인다.

- [ ] **Step 3: 라우터, 서버 엔트리, 루트를 연결한다**
  - `src/router.tsx`: `rewrite: { input: ({ url }) => deLocalizeUrl(url), output: ({ url }) => localizeUrl(url) }`
  - `src/lib/url-guard.ts`: `export function isMalformedPath(pathname: string): boolean`. `decodeURIComponent` 가 `URIError` 를 던지면 true 다.
    - 먼저 실패하는 테스트를 쓰고(FAIL 확인), 구현한 뒤 PASS 를 확인한다.

      ```ts
      expect(isMalformedPath('/posts/%E0')).toBe(true)
      expect(isMalformedPath('/posts/%')).toBe(true)
      expect(isMalformedPath('/posts/%ED%95%9C')).toBe(false)   // '한'
      expect(isMalformedPath('/posts/hello')).toBe(false)
      ```

  - `src/server.ts`: default export `{ fetch(req: Request): Promise<Response> }`
    1. `isMalformedPath(new URL(req.url).pathname)` 가 true 면 `new Response('Not Found', { status: 404 })` 를 돌려준다.
    2. 아니면 `paraglideMiddleware(req, () => handler.fetch(req))` 를 돌려준다.
  - `__root.tsx`: `<html lang={getLocale()}>`. `notFoundComponent` 는 임시 문구로 둔다(Task 7 에서 교체).
  - `index.tsx` 는 `m.lobby_intro()` 와 `/posts` 링크를, `posts/index.tsx` 는 `m.posts_title()` 을 그린다.

- [ ] **Step 4: 프리렌더를 켠다**

  ```ts
  tanstackStart({
    prerender: { enabled: true, crawlLinks: true, autoSubfolderIndex: false, failOnError: true },
    pages: [{ path: '/' }, { path: '/en' }],
  })
  ```

- [ ] **Step 5: 스모크 항목을 추가한다 (Review Focus 4, 5)**

  ```ts
  { path: '/', status: 200, contains: ['lang="ko"'] },
  { path: '/en', status: 200, contains: ['lang="en"'] },
  { path: '/posts', status: 200, contains: ['lang="ko"'] },
  { path: '/en/posts', status: 200, contains: ['lang="en"'] },
  { path: '/en/', status: 307, location: '/en' },   // 3xx 이면 통과로 본다. 실제 코드에 맞춰 status 를 고친다
  { path: '/fr/posts', status: 404 },
  { path: '/EN/posts', status: 404 },
  { path: '/posts/%E0', status: 404 },
  ```

- [ ] **Step 6: 확인한다**
  - `pnpm build` 뒤 `dist` 클라이언트 출력에 다음 파일이 있어야 한다: `index.html`, `en.html`, `posts.html`, `en/posts.html`
  - 프리뷰를 돌린다. 기대: 전 항목 통과

- [ ] **Step 7: 스파이크 ①을 판정한다**
  - 판정 기준: 다음 중 하나라도 실패하면 스펙 4.5 탈출 규칙을 적용한다.
    1. 프리렌더된 `/en/*` 이 `lang="en"` 인가
    2. 프리뷰 Worker 에서 `getLocale()` 이 요청마다 맞는가
    3. `/en` 에서 클라이언트로 이동한 `/en/posts` 의 링크에 `/en` 접두사가 유지되는가
  - 탈출 규칙 적용 방법
    1. `src/i18n/runtime.ts` 와 `src/i18n/messages.ts` 를 직접 구현으로 바꾼다. 같은 export 이름을 유지하고, 메시지 JSON 을 import 한다.
    2. Paraglide 플러그인과 의존성을 제거한다.
    3. 은솔에게 이유를 한 줄로 알린다.

- [ ] **Step 8: 커밋한다**

  ```bash
  git add -A && git commit -m "feat: Paraglide 기반 ko/en 라우팅과 프리렌더 구성"
  ```

### Task 3: 콘텐츠 모델과 서버 전용 데이터 접근

**Files:**
- Create:
  - `content-collections.ts`, `content/tags.yaml`
  - `content/posts/how-this-blog-is-built/index.ko.md`, `index.en.md`
  - `src/content/constants.ts`, `date.ts`, `source-hash.ts`, `resolve-en-post.ts`, `post-index.ts`, `post-queries.ts`, `rehash.ts`, `posts.server.ts`, `posts.functions.ts`
  - `scripts/content-rehash.ts`
- Test: `src/content/date.test.ts`, `source-hash.test.ts`, `resolve-en-post.test.ts`, `post-index.test.ts`, `post-queries.test.ts`, `rehash.test.ts`
- Modify: `vite.config.ts`(`contentCollections()` 맨 앞), `tsconfig.json`(`"content-collections": ["./.content-collections/generated"]`), `package.json`, `src/routes/index.tsx`, `scripts/smoke.ts`

**Interfaces:**
- Produces
  ```ts
  // constants.ts
  export const DESCRIPTION_MAX = 160
  export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  export const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  // date.ts
  export function parseKstDate(input: string): string   // → "YYYY-MM-DDTHH:mm:ss+09:00", 틀리면 throw
  export function formatDate(iso: string, locale: Locale): string
  export function kstYear(iso: string): number

  // source-hash.ts (Node 전용, node:crypto)
  export function computeSourceHash(input: { title: string; description: string; body: string }): string   // sha256 hex

  // post-index.ts
  export type PostMeta = { slug: string; locale: Locale; title: string; description: string;
    date: string; updated?: string; tags: string[]; draft: boolean }
  export type PostIndex = {
    list(locale: Locale): PostMeta[]                 // date 내림차순
    get(locale: Locale, slug: string): PostMeta | undefined
    locales(slug: string): Locale[]                  // ['ko'] 또는 ['ko','en']
  }
  export function createPostIndex(ko: PostMeta[], en: PostMeta[]): PostIndex   // 메서드는 this 를 쓰지 않는 클로저
  export function groupByYear(posts: PostMeta[]): Array<{ year: number; posts: PostMeta[] }>   // 연도 내림차순
  export function collectTags(posts: PostMeta[]): string[]   // 빈도 내림차순, 같으면 키 오름차순

  // resolve-en-post.ts
  export type KoSource = { slug: string; title: string; description: string; content: string;
    date: string; updated?: string; tags: string[]; draft: boolean }
  export type EnSource = { slug: string; title: string; description: string; sourceHash: string;
    translationStatus: 'machine' | 'reviewed' }
  export function resolveEnPost(en: EnSource, ko: KoSource | undefined, opts: { production: boolean }):
    { kind: 'ok'; post: PostMeta & { translationStatus: 'machine' | 'reviewed' } } | { kind: 'skip' }

  // post-queries.ts (순수, 서버 함수가 쓰는 조회 로직)
  export type TagRef = { key: string; label: string }
  export type TagLabels = Array<{ key: string; ko: string; en: string }>
  export function tagRefs(keys: string[], locale: Locale, labels: TagLabels): TagRef[]   // 표에 없는 키는 label = key
  export type PostQueries = {
    listPosts(locale: Locale): { posts: PostMeta[]; tags: TagRef[] }
  }
  export function createPostQueries(input: { index: PostIndex; tagLabels: TagLabels }): PostQueries
  // Task 4·6 에서 getPostPage 를 더한다

  // rehash.ts (순수)
  export function splitFrontmatter(raw: string): { frontmatter: string; body: string }   // frontmatter 가 없으면 throw
  export function replaceSourceHash(enRaw: string, hash: string): string                 // sourceHash: 줄이 없으면 throw

  // posts.server.ts — 연결만 한다 (커버리지 제외)
  export const queries: PostQueries   // createPostQueries({ index: createPostIndex(ko, en), tagLabels: allTagLabels[0].tags })

  // posts.functions.ts (서버 함수, 커버리지 제외)
  export const listPostsFn: (opts: { data: { locale: Locale } }) => Promise<{ posts: PostMeta[]; tags: TagRef[] }>
  ```
- Content Collections 이름: `koPosts` → `allKoPosts`, `enPosts` → `allEnPosts`, `tagLabels` → `allTagLabels`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

  ```ts
  // date.test.ts
  expect(parseKstDate('2026-05-06')).toBe('2026-05-06T00:00:00+09:00')
  expect(parseKstDate('2026-05-06 20:55')).toBe('2026-05-06T20:55:00+09:00')
  expect(parseKstDate('2026-05-06 20:55:00')).toBe('2026-05-06T20:55:00+09:00')
  for (const bad of ['2026-13-01', '2026-02-30', '2026-05-06T20:55', '06/05/2026']) expect(() => parseKstDate(bad)).toThrow()
  expect(formatDate('2026-01-01T00:30:00+09:00', 'ko')).toBe('2026년 1월 1일')
  expect(formatDate('2026-01-01T00:30:00+09:00', 'en')).toBe('January 1, 2026')
  expect(kstYear('2026-01-01T00:30:00+09:00')).toBe(2026)

  // source-hash.test.ts
  const base = { title: '제목', description: '설명', body: '본문\n둘째 줄' }
  expect(computeSourceHash(base)).toMatch(/^[0-9a-f]{64}$/)
  expect(computeSourceHash({ ...base, body: '본문\r\n둘째 줄' })).toBe(computeSourceHash(base))
  expect(computeSourceHash({ ...base, body: '\n본문\n둘째 줄\n\n' })).toBe(computeSourceHash(base))
  expect(computeSourceHash({ ...base, title: '제목2' })).not.toBe(computeSourceHash(base))
  expect(computeSourceHash({ ...base, description: '설명2' })).not.toBe(computeSourceHash(base))

  // resolve-en-post.test.ts — slug 'hello' 인 ko 픽스처와, 그 해시로 만든 en 픽스처
  expect(() => resolveEnPost(en, undefined, { production: true })).toThrow(/원문이 없습니다/)
  expect(() => resolveEnPost({ ...en, sourceHash: 'x'.repeat(64) }, ko, { production: true }))
    .toThrow(/낡았습니다.*content:rehash --post hello/)
  expect(resolveEnPost(en, { ...ko, draft: true }, { production: true })).toEqual({ kind: 'skip' })
  expect(resolveEnPost(en, { ...ko, draft: true }, { production: false })).toMatchObject({ kind: 'ok', post: { draft: true } })
  expect(resolveEnPost(en, ko, { production: true })).toMatchObject({ kind: 'ok', post: { locale: 'en', date: ko.date, tags: ko.tags } })

  // post-index.test.ts
  // 픽스처: both(2026-03, tags a,b, en 있음), ko-only(2026-05, tags b), old(2025-12, tags a)
  expect(idx.list('ko').map(p => p.slug)).toEqual(['ko-only', 'both', 'old'])
  expect(idx.list('en').map(p => p.slug)).toEqual(['both'])
  expect(idx.get('en', 'ko-only')).toBeUndefined()
  expect(idx.locales('both')).toEqual(['ko', 'en'])
  expect(idx.locales('ko-only')).toEqual(['ko'])
  expect(groupByYear(idx.list('ko')).map(g => [g.year, g.posts.length])).toEqual([[2026, 2], [2025, 1]])
  expect(collectTags(idx.list('ko'))).toEqual(['a', 'b'])

  // post-queries.test.ts — labels = [{ key: 'a', ko: '에이', en: 'A' }]
  expect(tagRefs(['a', 'b'], 'ko', labels)).toEqual([{ key: 'a', label: '에이' }, { key: 'b', label: 'b' }])
  expect(tagRefs(['a'], 'en', labels)).toEqual([{ key: 'a', label: 'A' }])
  const q = createPostQueries({ index: idx, tagLabels: labels })
  expect(q.listPosts('en')).toEqual({ posts: idx.list('en'), tags: [{ key: 'a', label: 'A' }, { key: 'b', label: 'b' }] })

  // rehash.test.ts
  const raw = '---\ntitle: "t"\ndescription: "d"\n---\n\n본문\n'
  expect(splitFrontmatter(raw)).toEqual({ frontmatter: 'title: "t"\ndescription: "d"', body: '\n본문\n' })
  expect(() => splitFrontmatter('본문만')).toThrow()
  const enRaw = '---\ntitle: "t"\nsourceHash: "old"\ntranslationStatus: machine\n---\nbody'
  expect(replaceSourceHash(enRaw, 'a'.repeat(64))).toBe(enRaw.replace('"old"', `"${'a'.repeat(64)}"`))
  expect(() => replaceSourceHash('---\ntitle: "t"\n---\n', 'x')).toThrow(/sourceHash/)
  ```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**
  - 실행: `pnpm test`
  - 기대: 여섯 파일이 모듈 없음으로 FAIL

- [ ] **Step 3: 여섯 모듈을 구현한다**
  - `date.ts`
    - 정규식으로 분해한 뒤 `Date.UTC` 로 역검산해서 2월 30일 같은 날짜를 거른다.
    - `formatDate` 는 `Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', { dateStyle: 'long', timeZone: 'Asia/Seoul' })` 를 쓴다.
  - `source-hash.ts`: 해시 입력은 `${title}\n${description}\n${body}` 이다. body 는 CRLF 를 LF 로 바꾸고 trim 한다.
  - `resolve-en-post.ts` 오류 메시지
    - 원문이 없을 때: `` `${slug}: 한국어 원문이 없습니다` ``
    - 해시가 다를 때: `` `${slug}: 영어 번역본이 낡았습니다. /translate-post 로 갱신하거나 번역에 영향이 없으면 pnpm content:rehash --post ${slug}` ``

- [ ] **Step 4: 테스트가 통과하는지 확인한다**
  - 실행: `pnpm test`
  - 기대: 전부 PASS

- [ ] **Step 5: `content-collections.ts` 를 구현한다**
  - **`koPosts`**
    - directory `content/posts`, include `*/index.ko.md`, parser `frontmatter`
    - schema
      - `title: z.string().min(1)`
      - `description: z.string().min(1).max(DESCRIPTION_MAX)`
      - `date: z.string()`, `updated: z.string().optional()`
      - `tags: z.array(z.string().regex(TAG_PATTERN)).default([])`
      - `draft: z.boolean().default(false)`
    - transform
      1. slug 는 `_meta.directory` 로 정한다. `SLUG_PATTERN` 에 맞지 않으면 throw 한다.
      2. `draft && process.env.NODE_ENV === 'production'` 이면 `skip('draft')` 를 돌려준다.
      3. 날짜는 `parseKstDate` 로 바꾼다.
      4. `sourceHash` 를 계산한다.
      5. 출력에는 `content` 를 넣지 않는다. 원문 Markdown 은 계획 3(SEO/GEO)에서 필요할 때 추가한다.
  - **`enPosts`**
    - include `*/index.en.md`
    - schema
      - `title`, `description` 은 ko 와 같다.
      - `sourceHash: z.string().regex(/^[0-9a-f]{64}$/)`
      - `translationStatus: z.enum(['machine','reviewed'])`
    - transform
      1. `context.documents(koPosts)` 에서 같은 slug 의 원문을 찾는다. 변환 전 문서라 `content` 가 들어 있다.
      2. 그 원문으로 `resolveEnPost` 를 호출한다.
      3. 결과가 skip 이면 `skip()` 을 돌려준다.
  - **`tagLabels`**
    - directory `content`, include `tags.yaml`, parser `yaml`
    - schema `{ tags: z.array(z.object({ key: z.string().regex(TAG_PATTERN), ko: z.string(), en: z.string() })) }`
  - **writer hook**: 타입 정의 파일이 아닌 생성 파일 맨 앞에 `import '@tanstack/react-start/server-only';` 를 붙인다. Content Collections 공식 `tanstack-start-cf-mdx` 샘플의 `serverOnlyHook` 과 같은 방식이다.

- [ ] **Step 6: 서버 함수, 샘플 글, Lobby 를 연결한다**
  - `posts.server.ts`
    - `allKoPosts` 와 `allEnPosts` 를 `PostMeta` 로 매핑한다.
    - 그 결과로 `createPostQueries` 를 만들어 `queries` 로 내보낸다.
  - `posts.functions.ts`
    - `listPostsFn = createServerFn({ method: 'GET' }).validator((d: { locale: Locale }) => d).handler(({ data }) => queries.listPosts(data.locale))`
  - 샘플 글
    - `how-this-blog-is-built/index.ko.md`: frontmatter `date: "2026-10-20 12:00"`, `tags: ["meta"]`. 본문에 표지 문자열 `kitchen-sink-ko` 를 넣는다.
    - `index.en.md`: `kitchen-sink-en` 을 넣는다.
  - `content/tags.yaml` 에 `meta` 의 라벨을 넣는다(ko "블로그", en "Blog").
  - Lobby: `loader: () => listPostsFn({ data: { locale: getLocale() } })` 로 받은 글 제목을 링크 목록으로 그린다. 링크는 `<Link to="/posts/$slug">` 다.

- [ ] **Step 7: `scripts/content-rehash.ts` 를 구현하고 en 해시를 채운다**
  - 사용법: `node scripts/content-rehash.ts --post <slug>`
  - 판단 로직은 `rehash.ts` 에 두고, 스크립트는 파일 입출력만 한다.
  - 동작
    1. ko 파일을 `splitFrontmatter` 로 나눈다. 구분 정규식은 `^---\n([\s\S]*?)\n---\n?` 이다.
    2. `yaml` 로 title 과 description 을 읽는다.
    3. `computeSourceHash` 로 해시를 계산한다.
    4. en 파일에 `replaceSourceHash` 를 적용해 저장한다.
  - en 파일이 없으면 exit 1 이다.
  - 준비
    - `pnpm add -D yaml`
    - `package.json` 에 `"content:rehash": "node scripts/content-rehash.ts"` 를 추가한다.
  - 실행: `pnpm content:rehash --post how-this-blog-is-built`

- [ ] **Step 8: 빌드 실패와 draft 동작을 확인한다 (Review Focus 3)**
  1. `content/posts/tmp-stale/` 에 ko/en 을 만들고, en 의 `sourceHash` 를 틀린 값으로 둔다.
     - 실행: `pnpm build; echo $?`
     - 기대: 0 이 아닌 값, 그리고 출력에 `영어 번역본이 낡았습니다`
  2. `pnpm content:rehash --post tmp-stale` 다음 `pnpm build` 를 다시 돌린다.
     - 기대: 0
  3. ko 에 `draft: true` 를 넣고 다시 빌드한다.
     - 실행: `grep -rl "tmp-stale" dist/ --include=*.html`
     - 기대: 출력 없음
  4. 임시 디렉터리를 지운다.

- [ ] **Step 9: 클라이언트 번들 누출을 확인한다**
  - 실행: `pnpm build && grep -rl "kitchen-sink" dist/client --include=*.js`
  - 기대: 출력 없음. HTML 에는 있어도 되지만 JS 에는 없어야 한다.
  - 스모크 항목을 추가하고 프리뷰를 돌린다.

    ```ts
    { path: '/', status: 200, contains: ['href="/posts/how-this-blog-is-built"'] },
    { path: '/en', status: 200, contains: ['href="/en/posts/how-this-blog-is-built"'] },
    ```

- [ ] **Step 10: 커밋한다**

  ```bash
  git add -A && git commit -m "feat: 글 콘텐츠 모델·번역 최신성 검사·서버 전용 데이터 접근 추가"
  ```

### Task 4: Markdown 렌더링과 글 상세 (스파이크 ②)

**Files:**
- Create: `src/markdown/render.ts`, `src/markdown/rehype-toc.ts`, `src/markdown/test-utils.ts`, `src/client.tsx`, `src/components/Toc.tsx`, `src/routes/posts/$slug.tsx`
- Test: `src/markdown/render.test.ts`, `src/markdown/rehype-toc.test.ts`, `src/content/post-queries.test.ts`(추가)
- Modify: `content-collections.ts`, `src/content/post-queries.ts`, `src/content/posts.server.ts`, `src/content/posts.functions.ts`, 샘플 글 두 개, `scripts/smoke.ts`

**Interfaces:**
- Consumes: Task 3 의 `createPostQueries`, `PostMeta`, `TagRef`, `Locale`
- Produces
  ```ts
  // render.ts
  export type TocItem = { depth: 2 | 3; id: string; text: string }
  export type RenderOptions = { filePath: string; slug: string; locale: Locale; enSlugs: ReadonlySet<string> }
  export type Asset =
    | { kind: 'copy'; from: string; to: string }
    | { kind: 'webp'; from: string; to: string; width: number }
  export type RenderResult = { html: string; toc: TocItem[]; assets: Asset[] }   // Task 4 에서는 항상 []
  export async function renderMarkdown(markdown: string, opts: RenderOptions): Promise<RenderResult>

  export function rehypeToc(): Transformer   // h2/h3 → file.data.toc

  // test-utils.ts (커버리지 제외)
  export async function runPlugins(markdown: string, opts?: {
    remark?: PluggableList; rehype?: PluggableList; path?: string
  }): Promise<{ html: string; data: VFile['data'] }>
  // 파이프라인: remark-parse → remark-gfm({ singleTilde: false }) → remark-directive → ...remark
  //   → remark-rehype → ...rehype → rehype-stringify
  // 플러그인 단위 테스트는 모두 이걸 쓴다

  // post-queries.ts 확장
  export type PostBody = { html: string; toc: TocItem[] }
  export type PostPage = { post: PostMeta; available: Locale[]; tags: TagRef[]; html: string; toc: TocItem[] }
  // createPostQueries 입력에 bodies: ReadonlyMap<`${Locale}/${string}`, PostBody> 를 더한다
  // PostQueries 에 getPostPage(locale: Locale, slug: string): PostPage | null 을 더한다

  // posts.functions.ts
  export const getPostFn: (opts: { data: { locale: Locale; slug: string } }) => Promise<PostPage | null>
  // 내부: queries.getPostPage(data.locale, data.slug)
  ```
  - `window.__recoverableErrors: string[]`: `src/client.tsx` 의 `hydrateRoot(..., { onRecoverableError })` 가 쌓는다.
- 파이프라인 순서 (Task 5·6 이 `[Task N]` 자리에 끼운다)
  1. remark-parse
  2. `[remark-gfm, { singleTilde: false }]`: `10~20분` 같은 한국어 범위 표기가 취소선이 되지 않게 한다. 취소선은 `~~` 만 쓴다
  3. `[Task 6] remarkDirective, remarkDirectiveGuard, remarkDetails, remarkSeeAlso, remarkQuote, remarkTerm, remarkWidget`
  4. `[Task 5] remarkCallouts`
  5. remark-rehype (원본 HTML 비허용)
  6. rehype-slug
  7. `rehypeToc`
  8. `[Task 5] rehypeLocalImages`, `rehypeFigure`, `rehypeLinks`
  9. rehype-pretty-code
  10. `[rehype-autolink-headings, { behavior: 'wrap' }]`: 제목 전체를 링크로 감싼다 [은솔]
  11. rehype-stringify

- [ ] **Step 1: 실패하는 테스트를 쓴다 (Review Focus 2)**

  ```ts
  const opts = { filePath: '/tmp/x/index.ko.md', slug: 'x', locale: 'ko', enSlugs: new Set<string>() } as const
  const r = await renderMarkdown('## 소개\n\n### `code` 예시\n\n## 소개\n\n#### 깊은 제목\n\n```ts\nconst a = 1\n```', opts)
  expect(r.toc).toEqual([
    { depth: 2, id: '소개', text: '소개' },
    { depth: 3, id: 'code-예시', text: 'code 예시' },
    { depth: 2, id: '소개-1', text: '소개' },
  ])
  expect(r.html).toContain('<h2 id="소개"><a href="#소개">소개</a></h2>')   // autolink wrap
  expect(r.html).toContain('<h3 id="code-예시">')
  expect(r.html).toContain('<h2 id="소개-1">')
  expect(r.html).toMatch(/<h4 id="[^"]+">/)
  expect(r.html).toContain('data-rehype-pretty-code')

  const tilde = await renderMarkdown('10~20분, 30~40분. ~~지움~~', opts)
  expect(tilde.html).toContain('10~20분, 30~40분.')
  expect(tilde.html).toContain('<del>지움</del>')

  const raw = await renderMarkdown('안녕 <script>alert(1)</script> <b>굵게</b>\n\n<div>블록</div>', opts)
  expect(raw.html).not.toContain('<script')
  expect(raw.html).not.toContain('<b>')
  expect(raw.html).not.toContain('<div>')

  // rehype-toc.test.ts — runPlugins(md, { rehype: [rehypeSlug, rehypeToc] })
  const { data } = await runPlugins('# 제목\n\n## 둘\n\n### 셋\n\n#### 넷', { rehype: [rehypeSlug, rehypeToc] })
  expect(data.toc).toEqual([{ depth: 2, id: '둘', text: '둘' }, { depth: 3, id: '셋', text: '셋' }])   // h1, h4 제외
  const empty = await runPlugins('본문만', { rehype: [rehypeSlug, rehypeToc] })
  expect(empty.data.toc).toEqual([])

  // post-queries.test.ts (추가) — bodies 에 'ko/both', 'en/both', 'ko/ko-only' 가 있다
  expect(q.getPostPage('en', 'both')).toMatchObject({ post: { slug: 'both', locale: 'en' }, available: ['ko', 'en'], html: '<p>en</p>' })
  expect(q.getPostPage('en', 'ko-only')).toBeNull()
  expect(q.getPostPage('ko', 'nope')).toBeNull()
  expect(() => createPostQueries({ index: idx, tagLabels: labels, bodies: new Map() }).getPostPage('ko', 'both'))
    .toThrow(/본문이 없습니다/)   // 메타는 있는데 본문이 없으면 데이터 오류
  ```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**
  - 실행: `pnpm test src/markdown src/content/post-queries.test.ts`
  - 기대: FAIL

- [ ] **Step 3: `renderMarkdown`, `rehypeToc`, `runPlugins`, `getPostPage` 를 구현한다**
  - 의존성: `pnpm add -D unified remark-parse remark-gfm remark-rehype rehype-slug rehype-autolink-headings rehype-pretty-code shiki rehype-stringify hast-util-to-string unist-util-visit`
  - `rehypeToc`
    - h2/h3 의 `{ depth, id, text: toString(node) }` 를 `file.data.toc` 에 모은다.
    - autolink 보다 **앞에서** 돌아야 앵커 내용이 text 에 섞이지 않는다.
  - shiki 테마는 우선 `github-light` 로 두고, Task 8 에서 무채색으로 바꾼다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**
  - 실행: `pnpm test`
  - 기대: 전부 PASS

- [ ] **Step 5: 컬렉션과 서버 함수에 연결한다**
  - 두 컬렉션의 transform 에서 `context.cache({ markdown: content, slug, locale, enSlugs: [...enSlugs].sort() }, () => renderMarkdown(...))` 를 부른다.
    - `enSlugs` 는 `context.documents(enPosts)` 또는 `collection.documents()` 의 `_meta.directory` 로 만든다.
    - en 컬렉션 안에서는 같은 컬렉션 문서를 `collection.documents()` 로 가져온다.
  - 출력에 `html`, `toc` 를 넣는다.
  - `assets` 복사는 Task 5 에서 한다.
  - `posts.server.ts` 는 두 컬렉션 문서에서 `bodies` 맵을 만들어 `createPostQueries` 에 넘긴다.
  - `getPostFn` 은 `queries.getPostPage` 를 그대로 부른다.

- [ ] **Step 6: 글 라우트와 클라이언트 엔트리를 만든다**
  - `posts/$slug.tsx`
    - loader: `const page = await getPostFn({ data: { locale: getLocale(), slug: params.slug } }); if (!page) throw notFound(); return page`
    - component: 제목, `<Toc items={toc} />`, `<div className="prose" dangerouslySetInnerHTML={{ __html: html }} />`
  - `src/client.tsx`: TanStack Start 커스텀 클라이언트 엔트리 형식을 따른다. `hydrateRoot(document, <StartClient />, { onRecoverableError })` 로 오류를 `window.__recoverableErrors` 에 쌓는다.
  - 샘플 글 본문 (ko/en 둘 다)
    - `##` 2개, `###` 1개, `ts` 코드 블록 1개를 넣는다.
    - ko 를 고친 뒤 `pnpm content:rehash --post how-this-blog-is-built` 를 실행한다.

- [ ] **Step 7: 확인한다**
  - 스모크 항목을 추가한다.

    ```ts
    { path: '/posts/how-this-blog-is-built', status: 200, contains: ['lang="ko"', 'kitchen-sink-ko', 'data-rehype-pretty-code', '<nav'] },
    { path: '/en/posts/how-this-blog-is-built', status: 200, contains: ['lang="en"', 'kitchen-sink-en'] },
    { path: '/posts/how-this-blog-is-built/', status: 307, location: '/posts/how-this-blog-is-built' },  // 3xx 이면 통과
    { path: '/posts/does-not-exist', status: 404 },
    { path: '/en/posts/does-not-exist', status: 404 },
    ```

  - 실행: `pnpm build` 다음 아래 명령을 차례로 돌린다.

    ```bash
    grep -rlE "createHighlighter|micromark|kitchen-sink" dist/client --include=*.js
    grep -rlE "createHighlighter|micromark" dist --include=*.js
    ```

  - 기대: 두 명령 모두 출력 없음. 런타임에 파서·하이라이터가 없어야 하고, 클라이언트에 본문이 없어야 한다.
  - 프리뷰를 돌린다. 기대: 전 항목 통과

- [ ] **Step 8: 브라우저로 확인한다 (chrome-devtools MCP)**
  1. 프리뷰 `/posts/how-this-blog-is-built` 를 새로 연다.
     - 기대: `window.__recoverableErrors?.length ?? 0` 이 `0`
  2. `/` 를 새로 연 뒤 글 링크를 클릭해 화면 안에서 이동한다.
     - 기대: 본문이 보이고, 그때 `/_serverFn` 요청이 1개 생긴다.
  3. 스파이크 ②를 판정한다.
     - hydration 오류가 0 이 아니거나 서버 함수가 Worker 에서 실패하면 멈춘다.
     - 은솔에게 보고하고 방향을 다시 잡는다(스펙 7.1).

- [ ] **Step 9: 커밋한다**

  ```bash
  git add -A && git commit -m "feat: 빌드 타임 Markdown 렌더링과 글 상세 추가"
  ```

### Task 5: 본문 기능 (Callout · Figure · 글 옆 이미지 · 링크)

**Files:**
- Create
  - `src/markdown/remark-callouts.ts`, `rehype-figure.ts`, `rehype-local-images.ts`, `rehype-links.ts`, `link.ts`, `assets.ts`
  - `content/posts/how-this-blog-is-built/diagram.svg`, `screenshot.png`
- Test
  - 플러그인별: `src/markdown/link.test.ts`, `remark-callouts.test.ts`, `rehype-figure.test.ts`, `rehype-local-images.test.ts`, `rehype-links.test.ts`, `assets.test.ts`
  - 통합: `render.test.ts` 에 추가
- Modify: `src/markdown/render.ts`, `src/content/constants.ts`, `content-collections.ts`(assets 쓰기), `package.json`(build), 샘플 글 두 개, `scripts/smoke.ts`

**Interfaces:**
- Consumes: Task 4 의 `RenderOptions`, `RenderResult`
- Produces
  ```ts
  // link.ts
  export function localizePath(path: string, locale: Locale): string
  // ko → 그대로, en → '/en' + path ('/' 는 '/en')
  // Task 2 의 urlPatterns 와 같은 규칙이다

  export function resolvePostLink(href: string, locale: Locale, enSlugs: ReadonlySet<string>):
    { href: string; hrefLang?: Locale; external: boolean }

  // 플러그인: unified Plugin 시그니처
  export function remarkCallouts(opts: { locale: Locale }): Transformer
  export function rehypeFigure(): Transformer
  export function rehypeLocalImages(opts: { filePath: string; slug: string }): Transformer
  // 복사할 목록은 file.data.assets 에 담는다

  // constants.ts 에 추가
  export const PROSE_MAX_WIDTH = 720        // 본문 최대 폭(px). Task 8 디자인도 이 값을 쓴다
  export const IMAGE_VARIANT_WIDTHS = [720, 1440]

  // src/markdown/assets.ts (Node 전용, Task 4 의 Asset 사용)
  export async function writeAssets(assets: Asset[]): Promise<void>
  // copy 는 copyFile, webp 는 sharp(from).resize({ width }).webp({ quality: 82 })
  // sharp 는 함수 안에서 await import 한다
  // 대상 파일이 이미 있으면 건너뛴다. 이름에 내용 해시가 있어서 안전하다

  // rehype-local-images.ts 에서 export
  export function svgSize(source: string): { width?: number; height?: number }
  // 루트 <svg> 태그의 width/height, 없으면 viewBox 에서 읽는다
  export function rehypeLinks(opts: { locale: Locale; enSlugs: ReadonlySet<string> }): Transformer
  ```
- 마크업
  - Callout: `<aside class="callout" data-callout="note|tip|important|warning|caution" role="note"><p class="callout-title">라벨</p>…</aside>`
  - 라벨

    | 종류 | ko | en |
    |---|---|---|
    | note | 참고 | Note |
    | tip | 팁 | Tip |
    | important | 중요 | Important |
    | warning | 주의 | Warning |
    | caution | 경고 | Caution |

  - 아이콘은 Task 8 에서 CSS(`mask-image`, lucide SVG)로 넣는다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

  ```ts
  // link.test.ts — enSlugs = new Set(['both'])
  expect(resolvePostLink('/posts/both', 'en', enSlugs)).toEqual({ href: '/en/posts/both', external: false })
  expect(resolvePostLink('/posts/both#s', 'en', enSlugs)).toEqual({ href: '/en/posts/both#s', external: false })
  expect(resolvePostLink('/posts/ko-only', 'en', enSlugs)).toEqual({ href: '/posts/ko-only', hrefLang: 'ko', external: false })
  expect(resolvePostLink('/posts/both', 'ko', enSlugs)).toEqual({ href: '/posts/both', external: false })
  expect(resolvePostLink('/posts', 'en', enSlugs)).toEqual({ href: '/en/posts', external: false })
  expect(resolvePostLink('/', 'en', enSlugs)).toEqual({ href: '/en', external: false })
  expect(resolvePostLink('https://example.com', 'en', enSlugs)).toEqual({ href: 'https://example.com', external: true })
  expect(resolvePostLink('#top', 'en', enSlugs)).toEqual({ href: '#top', external: false })

  expect(localizePath('/', 'en')).toBe('/en')
  expect(localizePath('/posts', 'en')).toBe('/en/posts')
  expect(localizePath('/posts', 'ko')).toBe('/posts')

  // remark-callouts.test.ts — runPlugins(md, { remark: [[remarkCallouts, { locale }]] })
  // '> [!NOTE]\n> x' (ko) → '<aside class="callout" data-callout="note" role="note"><p class="callout-title">참고</p>'
  // '> [!warning]\n> x' (en, 소문자) → 'data-callout="warning"' 와 '<p class="callout-title">Warning</p>'
  // '> [!FOO]\n> x' → '<blockquote>' 그대로, '[!FOO]' 남음
  // '> 그냥 인용' → '<blockquote>' 그대로

  // rehype-figure.test.ts — runPlugins(md, { rehype: [rehypeFigure] })
  // '![a](https://x.example/y.png "캡션")' → '<figure><img src="https://x.example/y.png" alt="a"><figcaption>캡션</figcaption></figure>' (img 의 title 제거)
  // '문장 ![a](https://x.example/y.png "캡션")' → '<figure' 없음
  // '![a](https://x.example/y.png)' (title 없음) → '<figure' 없음
  // 앞에 img 를 picture 로 감싸는 작은 테스트용 rehype 플러그인을 두면 → '<figure><picture>…</picture><figcaption>캡션</figcaption></figure>'

  // rehype-links.test.ts — runPlugins(md, { rehype: [[rehypeLinks, { locale, enSlugs }]] })
  // en: '[a](/posts/both)' → 'href="/en/posts/both"', '[b](/posts/ko-only)' → 'href="/posts/ko-only" hreflang="ko"'
  // '[c](https://example.com)' → 'target="_blank" rel="noopener"', '[d](#top)' → 'href="#top"' 이고 target 없음
  // ko: '[a](/posts/both)' → 'href="/posts/both"' 이고 hreflang 없음

  // rehype-local-images.test.ts — 아래 통합 테스트의 이미지 관련 단언(경로·해시·크기·picture·loading·fetchpriority·?w·alt 경고·없는 파일·
  //   크기 못 읽는 SVG)과 svgSize 단언을 runPlugins(md, { rehype: [[rehypeLocalImages, { filePath, slug: 'x' }]], path: filePath }) 로 옮겨 둔다

  // assets.test.ts — 임시 디렉터리에 sharp 로 1600x10 PNG src.png 를 만든다
  await writeAssets([
    { kind: 'copy', from: src, to: join(out, 'a.png') },
    { kind: 'webp', from: src, to: join(out, 'a.720w.webp'), width: 720 },
  ])
  expect(existsSync(join(out, 'a.png'))).toBe(true)
  expect((await sharp(join(out, 'a.720w.webp')).metadata()).width).toBe(720)
  const before = statSync(join(out, 'a.720w.webp')).mtimeMs
  await writeAssets([{ kind: 'webp', from: src, to: join(out, 'a.720w.webp'), width: 720 }])
  expect(statSync(join(out, 'a.720w.webp')).mtimeMs).toBe(before)   // 이미 있으면 건너뜀

  // render.test.ts (통합) — 임시 디렉터리에 1x1 PNG(base64)로 a.png 를 쓰고, filePath 는 그 디렉터리의 index.ko.md
  const r = await renderMarkdown([
    '> [!TIP]', '> 내용', '',
    '> 그냥 인용', '',
    '> [!FOO]', '> 모르는 종류', '',
    '![그림](./a.png "캡션")', '',
    '문장 안 ![작은](./a.png) 이미지', '',
    '![외부](https://example.com/x.png)', '',
    '[다른 글](/posts/both) [외부](https://example.com)',
  ].join('\n'), { filePath, slug: 'x', locale: 'en', enSlugs: new Set(['both']) })
  expect(r.html).toContain('<aside class="callout" data-callout="tip" role="note"><p class="callout-title">Tip</p>')
  expect(r.html).toContain('<blockquote>\n<p>그냥 인용</p>')
  expect(r.html).toContain('[!FOO]')                                   // 모르는 종류는 일반 인용으로 남음
  // PNG 원본 폭이 1 이므로 WebP 사본은 1w 하나만 생긴다
  expect(r.html).toMatch(/<figure><picture><source type="image\/webp" srcset="\/content-assets\/x\/a\.[0-9a-f]{8}\.1w\.webp 1w" sizes="\(max-width: 752px\) calc\(100vw - 32px\), 720px"><img src="\/content-assets\/x\/a\.[0-9a-f]{8}\.png" alt="그림" width="1" height="1" loading="eager" fetchpriority="high" decoding="async"><\/picture><figcaption>캡션<\/figcaption><\/figure>/)
  expect(r.html).toMatch(/문장 안 <picture>.*<img src="\/content-assets\/x\/a\.[0-9a-f]{8}\.png" alt="작은" width="1" height="1" loading="lazy" fetchpriority="low"/)
  expect(r.html).toContain('src="https://example.com/x.png"')
  expect(r.html).toContain('href="/en/posts/both"')
  expect(r.html).toMatch(/href="https:\/\/example\.com" target="_blank" rel="noopener"/)
  expect(r.assets).toEqual(expect.arrayContaining([
    { kind: 'copy', from: join(dir, 'a.png'), to: expect.stringMatching(/public\/content-assets\/x\/a\.[0-9a-f]{8}\.png$/) },
    { kind: 'webp', from: join(dir, 'a.png'), to: expect.stringMatching(/a\.[0-9a-f]{8}\.1w\.webp$/), width: 1 },
  ]))
  await expect(renderMarkdown('![x](./missing.png)', { ...opts, filePath })).rejects.toThrow(/missing\.png.*찾을 수 없습니다/)

  // 폭 제한 ?w= — 쿼리는 파일 경로 해석에서 빠지고 style 이 붙는다
  const capped = await renderMarkdown('![작게](./a.png?w=400)', { ...opts, filePath })
  expect(capped.html).toContain('style="max-width:min(400px, 100%);height:auto;"')
  expect(capped.html).not.toContain('?w=400')

  // alt 누락 경고 (실패 아님)
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  await renderMarkdown('![](./a.png)', { ...opts, filePath })
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('alt'))

  // SVG 크기 (draw.io 처럼 루트 태그에 긴 content 속성이 있는 경우 포함)
  expect(svgSize('<svg xmlns="http://www.w3.org/2000/svg" width="120px" height="80">')).toEqual({ width: 120, height: 80 })
  expect(svgSize('<svg viewBox="0 0 300 150">')).toEqual({ width: 300, height: 150 })
  expect(svgSize(`<svg content="${'&lt;mxfile&gt;'.repeat(2000)}" viewBox="0 0 10 20">`)).toEqual({ width: 10, height: 20 })
  // 크기를 못 읽는 SVG 는 빌드 실패
  // 임시 디렉터리에 '<svg></svg>' 로 b.svg 를 쓴다
  await expect(renderMarkdown('![b](./b.svg)', { ...opts, filePath })).rejects.toThrow(/b\.svg.*크기/)
  ```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**
  - 실행: `pnpm test src/markdown`
  - 기대: FAIL

- [ ] **Step 3: 플러그인을 구현한다**
  - 의존성: `pnpm add -D image-size sharp`. `pnpm approve-builds` 로 sharp 를 승인한다.
  - jihoon-blog `src/lib/rehype-image-path.ts` 는 구조만 참고한다. 라이선스가 없으니 코드를 옮기지 않는다.
  - `remarkCallouts`
    - 대상: blockquote 의 첫 문단 첫 텍스트가 `[!TYPE]`(대소문자 무시)인 경우. 그 표지와 이어지는 줄바꿈을 지운다.
    - hast 로 `aside` 와 제목 `p` 를 만든다(`data.hName`, `data.hProperties`, 제목 노드 삽입).
    - 모르는 TYPE 은 그대로 둔다.
  - `rehypeLocalImages`
    - 대상: `img` 중 src 가 `/`, `http(s):`, `data:` 로 시작하지 않는 것.
    - 동작
      1. src 의 `?w=`(또는 `?width=`) 쿼리를 떼서 폭 제한 값으로 쓴다.
      2. `resolve(dirname(filePath), 경로)` 를 읽는다. 파일이 없으면 `` `${src}: 이미지 파일을 찾을 수 없습니다 (${filePath})` `` 로 throw 한다.
      3. 내용 sha256 앞 8자리로 `public/content-assets/<slug>/<basename>.<hash><ext>` 를 copy asset 으로 만든다.
      4. src 를 `/content-assets/<slug>/…` 로 바꾼다.
      5. 크기를 넣는다. SVG 는 `svgSize`, 그 밖은 `imageSize` 로 읽는다. 크기를 못 읽으면 `` `${src}: 이미지 크기를 읽을 수 없습니다` `` 로 throw 한다.
      6. 폭 제한 값이 있으면 `style="max-width:min(Npx, 100%);height:auto;"` 를 단다.
      7. PNG/JPEG 면 WebP 사본을 만든다.
         - 폭: `IMAGE_VARIANT_WIDTHS` 중 원본보다 작은 것 + 원본 폭
         - 이름: `<basename>.<hash>.<w>w.webp`, webp asset 으로 추가한다.
         - `img` 를 `picture > source[type=image/webp][srcset][sizes] + img` 로 감싼다.
         - `sizes` 는 `` `(max-width: ${PROSE_MAX_WIDTH + 32}px) calc(100vw - 32px), ${min(cap ?? PROSE_MAX_WIDTH, PROSE_MAX_WIDTH)}px` `` 이다.
    - 외부 이미지에도 공통으로 적용하는 것
      - 문서의 첫 `img` 는 `loading="eager" fetchpriority="high"`, 나머지는 `loading="lazy" fetchpriority="low"`, 모두 `decoding="async"` 다.
      - alt 가 비어 있으면 `` console.warn(`[이미지] alt 텍스트가 없습니다 (${slug}): ${src}`) `` 를 낸다.
  - `rehypeFigure`
    - 조건: `p` 의 자식이 공백을 빼고 `img` 나 `picture` 하나뿐이고, 그 img 에 title 이 있다.
    - 변환: `figure > (img|picture) + figcaption` 으로 바꾸고, img 의 title 은 지운다.
  - `rehypeLinks`
    - 모든 `a[href]` 에 `resolvePostLink` 를 적용한다.
    - external 이면 `target="_blank" rel="noopener"`, `hrefLang` 이 있으면 `hreflang` 속성을 단다.
  - `render.ts` 의 `[Task 5]` 자리에 끼우고, `file.data.assets` 를 `RenderResult.assets` 로 돌려준다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**
  - 실행: `pnpm test`
  - 기대: 전부 PASS

- [ ] **Step 5: 이미지 복사와 샘플 글을 연결한다**
  - `content-collections.ts` transform 에서 캐시 결과의 `assets` 를 **캐시 밖에서 매번** `writeAssets` 로 쓴다.
  - `package.json` 의 `build` 를 `rm -rf public/content-assets && vite build` 로 바꾼다. 지운 이미지가 배포에 남지 않게 하기 위해서다.
  - 샘플 글에 PNG 이미지도 하나 넣는다. 폭 800 이상인 `screenshot.png` 를 sharp 로 만든 단색 이미지로 둔다. 720w WebP 사본이 생기는지 확인하려는 것이다.
  - 샘플 ko/en 글에 넣을 것
    - `> [!TIP]`
    - `![…](./diagram.svg "…")`
    - 문장 안 이미지 1개
    - `/posts/how-this-blog-is-built#…` 내부 링크
  - 넣은 뒤 `pnpm content:rehash --post how-this-blog-is-built` 를 실행한다.

- [ ] **Step 6: 확인한다**
  - 스모크 항목을 추가한다.

    ```ts
    { path: '/posts/how-this-blog-is-built', status: 200, contains: ['data-callout="tip"', '<figcaption', 'src="/content-assets/how-this-blog-is-built/diagram.', '<source type="image/webp"', 'fetchpriority="high"'] },
    { path: '/en/posts/how-this-blog-is-built', status: 200, contains: ['href="/en/posts/how-this-blog-is-built#'] },
    ```

  - 실행: `pnpm build && ls dist/client/content-assets/how-this-blog-is-built/`
  - 기대: 다음 파일이 있다.
    - `diagram.<hash>.svg`
    - `screenshot.<hash>.png`
    - `screenshot.<hash>.720w.webp`
    - `screenshot.<hash>.<원본폭>w.webp`
  - 프리뷰를 돌린다. 기대: 전 항목 통과. 이미지 URL 을 직접 요청해도 200 이다.

- [ ] **Step 7: 커밋한다**

  ```bash
  git add -A && git commit -m "feat: Callout·Figure·글 옆 이미지·내부 링크 현지화 추가"
  ```

### Task 6: 디렉티브 블록 (details · See Also · quote · term · widget)

**Files:**
- Create
  - `src/markdown/remark-directive-guard.ts`, `remark-details.ts`, `remark-see-also.ts`, `remark-quote.ts`, `remark-term.ts`, `remark-widget.ts`
  - `content/glossary.yaml`
  - `src/widgets/names.ts`, `src/widgets/registry.ts`, `src/widgets/counter-demo.tsx`
  - `src/lib/tooltip-position.ts`
  - `src/components/TermTooltips.tsx`, `src/components/WidgetMounter.tsx`
- Test
  - 플러그인별: `src/markdown/remark-directive-guard.test.ts`, `remark-details.test.ts`, `remark-see-also.test.ts`, `remark-quote.test.ts`, `remark-term.test.ts`, `remark-widget.test.ts`
  - `src/widgets/registry.test.ts`, `src/lib/tooltip-position.test.ts`
  - 통합: `render.test.ts` 에 추가
- Modify: `src/markdown/render.ts`, `content-collections.ts`(glossary 컬렉션, 렌더 옵션), `src/content/posts.functions.ts`, `src/routes/posts/$slug.tsx`, 샘플 글 두 개, `scripts/smoke.ts`

**Interfaces:**
- Consumes: Task 4 의 `RenderOptions`, `RenderResult`
- Produces
  ```ts
  export type GlossaryEntry = { name: string; definition: string }
  export type Glossary = Record<string, Record<Locale, GlossaryEntry>>
  // RenderOptions 에 추가: glossary: Glossary; widgetNames: readonly string[]
  // RenderResult 에 추가: terms: string[]   // 본문에서 쓴 용어 키(중복 없음)
  // PostPage(getPostFn) 에 추가: terms: Record<string, GlossaryEntry>   // 그 언어의 정의만
  // post-queries.ts: PostBody 에 terms: string[] 추가, createPostQueries 입력에 glossary: Glossary 추가

  export function remarkDirectiveGuard(): Transformer
  export function remarkDetails(): Transformer
  export function remarkSeeAlso(): Transformer
  export function remarkQuote(opts: { locale: Locale }): Transformer
  export function remarkTerm(opts: { locale: Locale; glossary: Glossary }): Transformer
  export function remarkWidget(opts: { names: readonly string[] }): Transformer

  // src/widgets/names.ts — React 를 import 하지 않는다. Content Collections 설정이 읽는다
  export const widgetNames = ['counter-demo'] as const
  // src/widgets/registry.ts
  export const widgets: Record<(typeof widgetNames)[number], () => Promise<{ default: ComponentType }>>

  // src/lib/tooltip-position.ts (순수)
  export function computeTooltipPosition(
    target: { top: number; bottom: number; left: number; width: number },
    tooltip: { width: number; height: number },
    viewport: { width: number; height: number },
    gap?: number,   // 기본 8
  ): { top: number; left: number; placement: 'top' | 'bottom' }
  // 기본은 대상 아래(bottom). 아래 공간이 모자라면 위(top)
  // 가로는 대상 중앙에 맞추되 화면 좌우 8px 안으로 자른다

  export function TermTooltips(props: { container: RefObject<HTMLElement | null>; terms: Record<string, GlossaryEntry> }): JSX.Element | null
  export function WidgetMounter(props: { container: RefObject<HTMLElement | null> }): null
  ```

- 문법과 마크업

  | 문법 | 출력 |
  |---|---|
  | `:::details` | `<details class="details"><summary>첫 문단 내용</summary>…나머지…</details>`. 첫 문단이 없으면 빌드 오류 |
  | `:::see-also` (목록) | `<details open class="see-also"><summary>See Also</summary><ul class="see-also-list"><li data-kind="paper|docs|repo|article|link">…</li></ul></details>` |
  | `::::quote` + `:::translation` + `:::original{lang?}` | 아래 별도 설명 |
  | `:term[라벨]{key="hydration"}` | `<span class="term" data-term-key="hydration" tabindex="0">라벨</span>` |
  | `:::widget-<이름>` | `<div class="widget" data-widget="<이름>">…블록 안 내용(대체 콘텐츠)…</div>` |

  - **see-also**
    - 항목 앞 `[paper]` 같은 표지는 지우고 `data-kind` 로 옮긴다.
    - 표지가 없거나 모르는 종류면 `link` 다.
    - 아이콘은 Task 8 에서 CSS 로 단다: `FileText`, `BookOpen`, `FolderGit2`, `Newspaper`, `Link`.
  - **quote**
    - 출력 구조: `<blockquote class="bilingual-quote">` 안에 `<div class="quote-translation" lang="<글 언어>">` 와 `<div class="quote-original" lang="<원문 언어>">` 를 둔다.
    - 원문 언어는 기본 `en` 이다.
    - 글 언어와 원문 언어가 같으면 원문 div 만 남긴다.
    - translation 과 original 이 정확히 하나씩, 비어 있지 않아야 한다. 아니면 빌드 오류다.
  - **term**
    - `key` 속성 하나만 쓴다. key 는 `TAG_PATTERN` 형식이고, 라벨은 비어 있으면 안 된다.
    - 용어집에 그 키가 없으면 빌드 오류다.
  - **widget**: 이름이 `widgetNames` 에 없으면 빌드 오류다.
  - **guard**
    - 알려진 디렉티브: 컨테이너 `details`, `see-also`, `quote`, `translation`, `original`, `widget-*`. 텍스트 `term`.
    - 모르는 **컨테이너**: `` `알 수 없는 블록 :::${name}` `` 오류
    - 모르는 **텍스트·리프** 디렉티브: 원문 그대로 텍스트로 되살린다. 원문은 `file.value` 를 노드 position 으로 잘라 얻는다. `key:value` 같은 본문을 지키기 위해서다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

  - 아래 단언은 플러그인별 파일로 나눠 둔다. 파일 이름은 대상 플러그인 이름을 따른다.
    - 각 파일은 `runPlugins(md, { remark: [remarkDirectiveGuard, <대상 플러그인과 옵션>], path })` 로 그 플러그인만 검증한다.
    - `renderMarkdown` 을 쓰는 같은 시나리오 하나(샘플 글처럼 다섯 문법을 섞은 문서)는 `render.test.ts` 에 통합 테스트로 둔다.

  ```ts
  // glossary = { hydration: { ko: { name: '하이드레이션', definition: '정의 ko' }, en: { name: 'Hydration', definition: 'def en' } } }
  // widgetNames = ['counter-demo']
  const ko = { ...opts, locale: 'ko', glossary, widgetNames } as const
  const en = { ...ko, locale: 'en' } as const

  const guard = await renderMarkdown('비율은 key:value 와 3:1, 그리고 Note:foo[x]{a=1} 입니다', ko)
  expect(guard.html).toContain('key:value')
  expect(guard.html).toContain('3:1')
  expect(guard.html).toContain('Note:foo[x]{a=1}')
  await expect(renderMarkdown(':::detials\n내용\n:::', ko)).rejects.toThrow(/알 수 없는 블록 :::detials/)

  const details = await renderMarkdown(':::details\n로그 보기\n\n긴 내용\n:::', ko)
  expect(details.html).toContain('<details class="details"><summary>로그 보기</summary>')
  expect(details.html).toContain('<p>긴 내용</p>')

  const see = await renderMarkdown(':::see-also\n- [paper] [논문](https://a.example)\n- [docs] [문서](https://b.example)\n- [기타](https://c.example)\n:::', ko)
  expect(see.html).toContain('<details open class="see-also"><summary>See Also</summary>')
  expect(see.html).toMatch(/<li data-kind="paper"><a href="https:\/\/a\.example"/)
  expect(see.html).toMatch(/<li data-kind="docs">/)
  expect(see.html).toMatch(/<li data-kind="link">/)
  expect(see.html).not.toContain('[paper]')

  const quoteSrc = '::::quote\n:::translation\n번역문\n:::\n:::original\nOriginal text\n:::\n::::'
  const qko = await renderMarkdown(quoteSrc, ko)
  expect(qko.html).toContain('<blockquote class="bilingual-quote"><div class="quote-translation" lang="ko">')
  expect(qko.html).toContain('<div class="quote-original" lang="en"><p>Original text</p></div>')
  const qen = await renderMarkdown(quoteSrc, en)
  expect(qen.html).not.toContain('번역문')
  expect(qen.html).toContain('Original text')
  await expect(renderMarkdown('::::quote\n:::original\nx\n:::\n::::', ko)).rejects.toThrow(/quote/)

  const term = await renderMarkdown('이건 :term[하이드레이션]{key="hydration"} 이야', ko)
  expect(term.html).toContain('<span class="term" data-term-key="hydration" tabindex="0">하이드레이션</span>')
  expect(term.terms).toEqual(['hydration'])
  await expect(renderMarkdown(':term[x]{key="nope"}', ko)).rejects.toThrow(/nope/)

  const widget = await renderMarkdown(':::widget-counter-demo\n대체 문장\n:::', ko)
  expect(widget.html).toContain('<div class="widget" data-widget="counter-demo"><p>대체 문장</p></div>')
  await expect(renderMarkdown(':::widget-nope\n:::', ko)).rejects.toThrow(/widget-nope/)

  // post-queries.test.ts (추가) — bodies 의 'en/both' 가 terms: ['hydration'] 을 가진다
  expect(q.getPostPage('en', 'both')?.terms).toEqual({ hydration: { name: 'Hydration', definition: 'def en' } })
  expect(q.getPostPage('ko', 'ko-only')?.terms).toEqual({})

  // registry.test.ts
  expect(Object.keys(widgets).sort()).toEqual([...widgetNames].sort())
  for (const load of Object.values(widgets)) expect(typeof (await load()).default).toBe('function')

  // tooltip-position.test.ts — viewport 1000x800, tooltip 200x50
  expect(computeTooltipPosition({ top: 100, bottom: 120, left: 400, width: 100 }, { width: 200, height: 50 }, { width: 1000, height: 800 }))
    .toEqual({ top: 128, left: 350, placement: 'bottom' })
  expect(computeTooltipPosition({ top: 760, bottom: 780, left: 400, width: 100 }, { width: 200, height: 50 }, { width: 1000, height: 800 }))
    .toEqual({ top: 702, left: 350, placement: 'top' })            // 아래가 모자라면 위
  expect(computeTooltipPosition({ top: 100, bottom: 120, left: 0, width: 20 }, { width: 200, height: 50 }, { width: 1000, height: 800 }).left)
    .toBe(8)                                                          // 왼쪽 가장자리 자르기
  expect(computeTooltipPosition({ top: 100, bottom: 120, left: 990, width: 10 }, { width: 200, height: 50 }, { width: 1000, height: 800 }).left)
    .toBe(792)                                                        // 오른쪽 가장자리 자르기
  ```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**
  - 실행: `pnpm test src/markdown src/widgets src/lib`
  - 기대: FAIL

- [ ] **Step 3: 플러그인과 위젯 목록을 구현한다**
  - 의존성: `pnpm add -D remark-directive mdast-util-to-string`
  - jihoon-blog `src/lib/remark-*.ts` 는 구조만 참고하고 코드는 옮기지 않는다.
  - 변환은 `data.hName` / `data.hProperties` 로 한다.
  - `summary` 처럼 새 노드가 필요하면 mdast 노드를 만들어 `hName` 을 붙인다. `type: 'html'` 노드는 원본 HTML 비허용 설정에서 사라지니 쓰지 않는다.
  - `counter-demo`: 버튼 하나와 숫자를 보여주는 최소 위젯이다. 위젯 마운트를 확인하는 용도이고, 샘플 글에서 시연한다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**
  - 실행: `pnpm test`
  - 기대: 전부 PASS

- [ ] **Step 5: 컬렉션, 서버 함수, 화면에 연결한다**
  - **`glossary` 컬렉션**
    - directory `content`, include `glossary.yaml`, parser `yaml`
    - schema `{ terms: z.array(z.object({ key: z.string().regex(TAG_PATTERN), ko: entry, en: entry })) }`
    - `entry = z.object({ name: z.string().min(1), definition: z.string().min(1) })`
  - **글 컬렉션 transform**
    - `context.documents(glossary)` 로 `Glossary` 를 만들어 렌더 옵션에 넘긴다.
    - `widgetNames` 는 `src/widgets/names.ts` 에서 상대 경로로 import 한다.
    - 캐시 키에 용어집 키 목록과 `widgetNames` 를 넣는다.
  - **`getPostFn`**: `terms` 에 그 글이 쓴 키의 해당 언어 정의만 담는다.
  - **글 라우트**
    - 본문 div 에 `ref` 를 단다.
    - `<TermTooltips container={ref} terms={terms} />` 와 `<WidgetMounter container={ref} />` 를 렌더한다.
  - **`TermTooltips`**
    - 컨테이너에 위임 리스너를 단다.
    - `pointerover` / `focusin` 에 툴팁을 띄운다. 위치는 `computeTooltipPosition` 으로 정한다. portal, `role="tooltip"`, 대상에 `aria-describedby` 를 단다.
    - `pointerout` / `focusout` / `Escape` 에 닫는다.
    - 터치(`pointerType === 'touch'`)는 탭으로 열고 닫는다.
    - 툴팁 내용: `<strong>{name}</strong> {definition}`
  - **`WidgetMounter`**
    - 마운트 뒤 `[data-widget]` 마다 `widgets[name]()` 을 불러 `createRoot(el).render(<Comp />)` 로 붙인다. 이때 대체 콘텐츠는 교체된다.
    - 언마운트 때 각 root 를 정리한다.
    - 본문은 `dangerouslySetInnerHTML` 이라 React 가 안쪽을 관리하지 않으므로 hydration 과 충돌하지 않는다.
  - **샘플 ko/en 글**에 다섯 문법을 하나씩 넣는다.
    - `:::details`, `:::see-also`, `::::quote`, `:term[…]{key="prerender"}`, `:::widget-counter-demo`
    - `content/glossary.yaml` 에 `prerender` 항목을 넣는다.
    - en 글의 `:::original` 은 원문과 글자 하나까지 같아야 하고, `:term` 키도 같아야 한다.
    - 넣은 뒤 `pnpm content:rehash --post how-this-blog-is-built` 를 실행한다.

- [ ] **Step 6: 확인한다**
  - 스모크 항목을 추가한다.

    ```ts
    { path: '/posts/how-this-blog-is-built', status: 200, contains: ['<details class="details">', '<details open class="see-also">', 'class="bilingual-quote"', 'data-term-key="prerender"', 'data-widget="counter-demo"'] },
    { path: '/en/posts/how-this-blog-is-built', status: 200, contains: ['class="quote-original" lang="en"'], notContains: ['class="quote-translation"'] },
    ```

  - 프리뷰를 돌린다. 기대: 전 항목 통과
  - 브라우저에서 확인한다.
    - 용어에 마우스를 올리면 툴팁이 뜨고, `Tab` 포커스로도 뜨고, `Escape` 로 닫힌다.
    - `counter-demo` 버튼이 동작하고, 그 청크는 글 페이지에서만 로드된다.
    - `__recoverableErrors` 는 0 이다.

- [ ] **Step 7: 커밋한다**

  ```bash
  git add -A && git commit -m "feat: details·See Also·원문 병기 인용·용어 툴팁·위젯 디렉티브 추가"
  ```

### Task 7: 화면 (Lobby · Posts · Post · 404 · 언어 전환)

**Files:**
- Create: `src/site.ts`, `src/lib/tag-filter.ts`, `src/components/Layout.tsx`, `PostList.tsx`, `TagFilter.tsx`, `LanguageSwitch.tsx`, `NotFound.tsx`
- Test: `src/lib/tag-filter.test.ts`
- Modify: `src/routes/__root.tsx`, `index.tsx`, `posts/index.tsx`, `posts/$slug.tsx`, `src/components/Toc.tsx`, `messages/*.json`, `scripts/smoke.ts`

**테스트 먼저 (Step 0)**

`src/lib/tag-filter.ts` 의 순수 함수 두 개를 먼저 TDD 로 만든다. 순서는 테스트 작성, FAIL 확인, 구현, PASS 확인이다. 컴포넌트는 이 함수들을 쓴다.

```ts
export function tagFilterCss(keys: string[]): string
export function readTagParam(search: string): string | undefined   // 인라인 스크립트와 effect 가 같은 규칙을 쓴다

// tag-filter.test.ts
expect(tagFilterCss(['meta'])).toBe(
  'html[data-tag="meta"] [data-post]:not([data-tags~="meta"]){display:none}' +
  'html[data-tag="meta"] [data-year]:not(:has([data-tags~="meta"])){display:none}' +
  'html[data-tag="meta"] [data-chip="meta"]{font-weight:700;text-decoration:underline}')
expect(tagFilterCss([])).toBe('')
expect(tagFilterCss(['a"b'])).toBe('')                    // TAG_PATTERN 에 맞지 않는 키는 건너뛴다 (CSS 주입 방지)
expect(readTagParam('?tag=meta')).toBe('meta')
expect(readTagParam('?tag=META')).toBeUndefined()        // TAG_PATTERN 위반
expect(readTagParam('')).toBeUndefined()
```

- 인라인 스크립트는 `readTagParam` 과 같은 정규식을 문자열로 넣는다. `TAG_PATTERN.source` 를 쓴다.
- 활성 칩 스타일은 Task 8 에서 디자인에 맞춰 이 함수의 마지막 규칙을 고친다. 고칠 때 테스트도 같이 고친다.

**Interfaces:**
- Consumes: `listPostsFn`, `getPostFn`, `PostMeta`, `TagRef`, `groupByYear`, `formatDate`, `m`, `getLocale`, `localizeHref`
- Produces
  ```ts
  // src/site.ts
  export const site = { name: 'eunsol', url: 'https://nabichan.me', author: 'eunsol (Nabi)',
    license: { name: 'CC BY-NC 4.0', url: 'https://creativecommons.org/licenses/by-nc/4.0/' },
    socials: [] as Array<{ label: string; href: string; icon: string }> } as const
  ```
  - `PostList` props: `{ posts: PostMeta[]; locale: Locale; groupByYear?: boolean }`
    - 항목: `<li data-post data-tags="a b">`
    - 연도 그룹: `<section data-year="2026">`
  - `TagFilter` props: `{ tags: TagRef[] }`
    - 칩: 링크(`?tag=<key>`, `data-chip="<key>"`)
    - `<style>`: 태그마다 다음 규칙을 낸다.
      - `html[data-tag="k"] [data-post]:not([data-tags~="k"]){display:none}`
      - `html[data-tag="k"] [data-year]:not(:has([data-tags~="k"])){display:none}`
      - `html[data-tag="k"] [data-chip="k"]{…활성 스타일…}`

- [ ] **Step 1: 레이아웃과 404 를 만든다**
  - 헤더: `site.name` 링크, `m.nav_posts()`, `LanguageSwitch`
  - 푸터: `m.footer_license()` + 라이선스 링크. `site.socials` 가 비어 있으면 소셜 영역을 렌더하지 않는다.
  - `__root.tsx`
    - 기본 title 은 `site.name`
    - 각 라우트 `head` 가 `` `${제목} | eunsol` `` 로 덮어쓴다.
    - `notFoundComponent: NotFound` 는 현재 언어로 제목·설명·홈 링크를 그린다.

- [ ] **Step 2: Lobby 를 만든다**
  - `m.lobby_intro()`, 최근 글 5개(`PostList`: 제목, 날짜, 설명), `m.lobby_view_all()` 링크
  - 글이 0편이면 `m.posts_empty()` 를 보인다.

- [ ] **Step 3: Posts 를 만든다 (Review Focus 1)**
  - 렌더: `TagFilter` + `PostList groupByYear`
  - **컴포넌트 렌더 결과가 URL 쿼리에 의존하면 안 된다.**
  - 라우트 `head.scripts` 에 인라인 스크립트를 넣어, 페인트 전에 `?tag` 를 `document.documentElement.dataset.tag` 로 옮긴다.
  - 칩 클릭은 `<Link search={{ tag }}>` 로 한다.
  - `useRouterState` 로 search 변화를 받아 effect 에서 `dataset.tag` 를 갱신한다. 태그가 없으면 속성을 지운다.
  - `validateSearch` 는 `tag?: string` 만 통과시킨다.

- [ ] **Step 4: Post 를 완성한다**
  - 헤더: 제목, `formatDate(date)`, 수정일이 있으면 `m.post_updated()` + 날짜, 태그 라벨
  - `Toc`: 넓은 화면에서는 오른쪽 sticky, 좁은 화면에서는 본문 위 `<details>` 다.
  - `LanguageSwitch`
    - Post 에서는 `available` 에 상대 언어가 있을 때만 링크를 보인다.
    - 링크는 일반 `<a href={localizeHref(`/posts/${slug}`, { locale: other })}>` 다.
    - 다른 화면에서는 같은 경로의 상대 언어로 링크한다.

- [ ] **Step 5: 스모크 항목을 추가한다**

  ```ts
  { path: '/', status: 200, contains: ['href="/posts"'] },
  { path: '/posts', status: 200, contains: ['data-chip="meta"', 'data-year="2026"', 'html[data-tag="meta"]'] },
  { path: '/posts?tag=meta', status: 200, contains: ['data-post'] },
  { path: '/posts/how-this-blog-is-built', status: 200, contains: ['href="/en/posts/how-this-blog-is-built"'] },
  { path: '/en/posts/how-this-blog-is-built', status: 200, contains: ['href="/posts/how-this-blog-is-built"'] },
  { path: '/posts/does-not-exist', status: 404, contains: ['lang="ko"'] },
  { path: '/en/posts/does-not-exist', status: 404, contains: ['lang="en"'] },
  ```

- [ ] **Step 6: 확인한다**
  - 프리뷰를 돌린다. 기대: 전 항목 통과
  - 브라우저에서 `/posts?tag=meta` 를 새로고침한다.
    - `__recoverableErrors` 가 0
    - 태그가 없는 항목은 `display:none`
    - 칩을 클릭하면 `dataset.tag` 가 바뀐다

- [ ] **Step 7: 커밋한다**

  ```bash
  git add -A && git commit -m "feat: Lobby·Posts·Post·404 화면과 언어 전환 추가"
  ```

### Task 8: 폰트와 비주얼 디자인

**Files:**
- Create: `scripts/fonts/ranges.txt`, `scripts/fonts/build_suit.py`, `public/fonts/suit/*.woff2`, `public/fonts/suit/OFL.txt`, `src/styles/fonts.css`, `src/styles/prose.css`
- Modify: `src/styles/app.css`, `src/routes/__root.tsx`(preload), 컴포넌트 className, `src/markdown/render.ts`(shiki 테마)

**Interfaces:**
- Produces
  - 폰트 패밀리 `'Eunsol Sans'` (SUIT RFN 회피)
  - 무채색 CSS 토큰 `--color-*`
  - 조각 파일 `public/fonts/suit/eunsol-sans.<index>.woff2`
  - Callout 아이콘 CSS: `.callout[data-callout=…]::before` 에 lucide SVG 를 `mask-image` 로 넣는다(`Info`, `Lightbulb`, `MessageSquareWarning`, `TriangleAlert`, `OctagonAlert`).

- [ ] **Step 1: 분할 경계를 고정한다**
  - 최신 브라우저 UA 로 `https://fonts.googleapis.com/css2?family=Noto+Sans+KR` 를 받아 `unicode-range` 값을 순서대로 뽑는다.
  - `scripts/fonts/ranges.txt` 에 한 줄에 하나씩 저장한다.

- [ ] **Step 2: `build_suit.py` 를 구현한다**
  - 실행: `uvx --from 'fonttools[woff]' python scripts/fonts/build_suit.py <SUIT-Variable.woff2>`
  - 원본: npm `@sun-typeface/suit@2.0.5` 의 `fonts/variable/woff2/SUIT-Variable.woff2` (임시 디렉터리에 받는다)
  - 동작
    1. 범위마다 subset 한다(`layout_features='*'`, `flavor='woff2'`, variation 유지). 글리프가 0 인 범위는 건너뛴다.
    2. name 테이블 ID 1/4/6/16 을 `Eunsol Sans` 계열로 바꾼다.
    3. `src/styles/fonts.css` 에 범위마다 `@font-face { font-family: 'Eunsol Sans'; src: url(/fonts/suit/eunsol-sans.N.woff2) format('woff2'); font-weight: 100 900; font-display: swap; unicode-range: … }` 를 쓴다.
    4. SUIT 의 OFL 전문을 `OFL.txt` 로 복사하고, 맨 위에 `Modified (subset, renamed) from SUIT by SUNN` 을 붙인다.

- [ ] **Step 3: 생성 결과를 확인한다**
  - 실행: `ls public/fonts/suit/*.woff2 | wc -l` 와 `du -ch public/fonts/suit/*.woff2 | tail -1`
  - 기대: 조각 50개 이상, 조각 하나는 100KB 이하. 숫자를 기록한다.

- [ ] **Step 4: 디자인을 적용한다**
  - `frontend-design:frontend-design` 스킬을 불러 방향을 잡는다.
  - 고정 조건
    - 무채색(흰색·회색·검정), 라이트 전용
    - 본문 폰트 `'Eunsol Sans'`, 코드 폰트는 시스템 monospace
    - 아이콘은 lucide
  - 할 일
    - Tailwind typography 를 `prose.css` 에서 덮어써 본문 폭과 타이포 스케일을 잡는다. 본문 최대 폭은 `PROSE_MAX_WIDTH`(720px)와 같아야 한다. 이미지 `sizes` 가 이 값을 쓴다.
    - Callout, Figure, details, See Also(종류별 아이콘), 원문 병기 인용, 용어(점선 밑줄 + 툴팁), 위젯 자리 스타일을 넣는다.
    - shiki 테마를 무채색 계열로 바꾼다.
  - `__root.tsx` 에서 라틴 기본 범위(`U+0000-00FF` 포함) 조각 하나를 `<link rel="preload" as="font" type="font/woff2" crossorigin>` 로 넣는다.

- [ ] **Step 5: 스크린샷을 은솔에게 확인받는다**
  - 프리뷰 화면을 390px 와 1280px 폭으로 찍는다(chrome-devtools MCP).
    - `/`, `/posts`, `/posts/how-this-blog-is-built`, `/en/posts/how-this-blog-is-built`, `/posts/does-not-exist`
  - 은솔에게 보여준다. 피드백을 반영하고 다시 찍는다.
  - **은솔이 괜찮다고 할 때까지 다음 단계로 가지 않는다.**

- [ ] **Step 6: 측정해서 기록한다**
  - `/posts/how-this-blog-is-built` 를 새로 로드한다.
  - 측정 항목
    - `.woff2` 요청 수와 transferSize 합계
    - `PerformanceObserver('layout-shift')` 누적값
  - 이 숫자를 커밋 메시지 본문에 남긴다.

- [ ] **Step 7: 커밋한다**

  ```bash
  git add -A && git commit -m "feat: SUIT 기반 폰트 분할과 무채색 디자인 적용"
  ```

### Task 9: 계획 1 마무리 검증

**Files:**
- Modify: 없음 (실패하면 해당 태스크의 파일을 고친다)

- [ ] **Step 1: 정적 검사와 테스트를 돌린다**
  - 실행: `pnpm check && pnpm test`
  - 기대: 둘 다 종료 코드 0. 커버리지 임계값(`functions: 100`, `lines: 90`)도 통과해야 한다.
  - lib 디렉터리(`src/content`, `src/markdown`, `src/lib`, `src/widgets`)의 `.ts` 파일마다 같은 이름의 `.test.ts` 가 있는지 확인한다. 커버리지 제외 파일은 빼고 본다.

    ```bash
    for f in $(git ls-files 'src/content/*.ts' 'src/markdown/*.ts' 'src/lib/*.ts' 'src/widgets/*.ts' | grep -v -E '\.test\.ts$|test-utils\.ts$|posts\.(server|functions)\.ts$|constants\.ts$|names\.ts$'); do
      [ -f "${f%.ts}.test.ts" ] || echo "테스트 없음: $f"
    done
    ```

    - 기대: 출력 없음
    - `constants.ts` 와 `names.ts` 는 함수가 없는 상수 모듈이라 제외한다.

- [ ] **Step 2: 클린 빌드와 전체 스모크를 돌린다**
  - 실행: `rm -rf dist .content-collections src/paraglide public/content-assets` 다음 프리뷰
  - 기대: 전 항목 통과

- [ ] **Step 3: 번들 누출을 다시 확인한다**
  - Task 4 Step 7 의 grep 두 개를 다시 돌린다.
  - 기대: 출력 없음

- [ ] **Step 4: 브라우저 회귀를 확인한다**
  - 다섯 화면 × 두 언어에서 `__recoverableErrors` 가 0 이어야 한다.
  - `/posts?tag=meta` 필터가 동작해야 한다.

- [ ] **Step 5: 스펙 6장 로컬 완료 조건을 대조한다**
  - 이번 범위에서 확인할 것: 렌더링, 404, Markdown, 다국어, 성능 일부
  - 나머지 항목은 "계획 2~5" 로 표시해서 은솔에게 보고한다.

- [ ] **Step 6: 남은 변경을 커밋한다**

  ```bash
  git status --short && git add -A && git commit -m "chore: 계획 1 검증 마무리"
  ```
