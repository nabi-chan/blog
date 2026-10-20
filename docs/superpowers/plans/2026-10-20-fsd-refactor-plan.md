# FSD 리팩터링 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src` 전체를 FSD 레이어(`app / pages / widgets / features / entities / shared`)로 옮기고 Steiger 로 의존 방향을 강제한다. 사이트 동작은 바꾸지 않는다.

**Architecture:** 아래 레이어부터 위로 옮긴다(shared → entities → features → widgets·pages → app → CSS → 게이트·문서). 파일마다 `git mv` 로 옮기고 import 를 고쳐 매 커밋을 초록으로 유지한다.
- 슬라이스 밖에서는 공개 API 로만 들어온다: `index.ts`, `index.server.ts`, `index.build.ts`, `index.scripts.ts`, `index.testing.ts`.
- 서버 코드가 브라우저 번들로 새는 건 TanStack Start import 보호가 막는다.
- 동작이 같은지는 리팩터링 전 기준선과 비교해 증명한다: 빌드 산출물 바이트 비교, 계산된 스타일 덤프 비교.

**Tech Stack:** TanStack Start 1.169 (start-plugin-core 1.171), Vite, Cloudflare Workers + D1, Content Collections, Paraglide JS, Tailwind v4, vitest, Steiger 0.7.0 + `@feature-sliced/steiger-plugin` 0.8.0

**Spec:** `docs/superpowers/specs/2026-10-20-fsd-refactor-design.md`

## Global Constraints

### 바꾸지 않는 것

- 동작, 디자인, URL, 응답 헤더, 의존성 버전은 바꾸지 않는다.
- 로직을 고치지 않는다. 허용하는 변경은 여섯 가지뿐이다(스펙 2장).
  - 파일 이동
  - import 경로(Node 가 읽는 상대 import 에 `.ts` 붙이기 포함)
  - 공개 API 추가
  - 스펙에 적은 타입·규칙 블록 이동
  - 라우트 컴포넌트를 pages 로 빼면서 loader 데이터를 props 로 넘기기
  - 주석·오류 문구에 적힌 옛 경로 고치기
- 커버리지 기준(함수 100%, 줄 90%)을 낮추지 않는다. 지금 커버리지에 들어가는 파일은 옮긴 뒤에도 전부 들어간다.
- 파일 이름은 그대로 둔다. 예외는 `*.server.ts` 접미사, 그리고 스펙 6장과 이 계획이 새 이름을 준 파일뿐이다.

### 레이어와 공개 API

- import 방향은 `app → pages → widgets → features → entities → shared` 다.
  - 같은 레이어의 다른 슬라이스는 import 하지 않는다. `@x` 도 쓰지 않는다.
- 슬라이스 밖에서는 공개 API 로만 들어온다.

  | 파일 | 담는 것 |
  |---|---|
  | `index.ts` | 브라우저·서버 공용 |
  | `index.server.ts` | Worker 전용 |
  | `index.build.ts` | `content-collections.ts` 용 |
  | `index.scripts.ts` | `scripts/*` 용 |
  | `index.testing.ts` | 다른 슬라이스의 테스트용 |

  - `shared` 는 세그먼트마다 `index.ts` 를 둔다. `shared/lib` 는 모듈 폴더마다 둔다.
  - 이름을 하나씩 적어 재수출한다. `export *` 는 쓰지 않는다.
  - **공개 API 는 슬라이스 밖에서 실제로 import 하는 이름만 내보낸다.** 슬라이스 밖에서 그 파일을 import 하는 곳을 grep 으로 찾아 정한다.

### 서버 코드와 Node 쪽 경로

- 브라우저 코드와 같은 슬라이스에 있는 Worker 전용 파일(D1·시크릿·`jose`·Access)은 `*.server.ts` 로 끝난다.
  - `app/server` 폴더는 접미사 대신 import 보호 `client.files` 로 폴더째 막는다.
- `tanstackStart` 의 `srcDirectory` 는 `src` 그대로 둔다. 바꾸면 슬라이스가 import 보호 밖으로 빠진다.
- Node 쪽 소비자는 저마다 필요한 것만 담은 공개 API 로 들어온다.

  | 소비자 | 들어오는 곳 |
  |---|---|
  | `vite.config.ts` | `app/build/prerender.ts`, `shared/og/index.ts` |
  | `content-collections.ts` | `entities/post/index.build.ts`, `features/embeds/index.build.ts`, `shared/og`, `shared/config`, `shared/lib/date` |
  | `scripts/*` | `entities/post/index.scripts.ts`, `shared/tooling`, `shared/lib/security-headers` |

- `vite.config.ts` 와 `scripts/*` 가 닿는 모듈은 두 규칙을 지킨다.
  - 상대 경로에 `.ts` 확장자를 붙인다.
  - `~` 별칭과 paraglide 생성물은 `import type` 으로만 쓴다.
- 경로 표기: 슬라이스 안에서는 상대 경로, 슬라이스 밖은 `~/레이어/슬라이스` 로 쓴다. 서버 공개 API 는 `~/features/comment/index.server` 처럼 쓴다.

### 커밋·실행

- main 에 직접 커밋한다. **push 는 Task 10 에서 은솔 확인을 받은 뒤 한 번만 한다.**
- `git add` 는 경로를 적어서 한다. `git add -A`·`git add .` 는 쓰지 않는다.
- 커밋 메시지는 한국어로 쓰고, 끝에 아래 두 줄을 붙인다.
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RzL49ncQEeheb9KHNoMXPM
  ```
- 명령은 `&&` 로만 잇는다.
- dev 서버나 preview 가 떠 있을 때 빌드하지 않는다. `audit:repo --build` 는 혼자 돌린다.

## Review Focus

테스트가 직접 잡지 않는 실패 다섯 가지와, 각각을 확인하는 단계다.

1. **CSS 를 나눈 뒤 `:hover`·`:focus-visible` 같은 상태 규칙의 순서가 바뀌는 것.** 계산된 스타일 덤프는 쉬는 상태만 본다. → Task 8 Step 6 이 빌드 CSS 의 상태 규칙 순서를 비교한다.
2. **새로 받은 저장소(`src/paraglide` 없음)에서 Node 쪽 경로가 깨지는 것.** CI 는 `i18n:compile` 보다 먼저 `scripts/audit.ts` 를 불러온다. → Task 4 Step 7 과 Task 7 Step 8 이 `src/paraglide` 를 치운 상태에서 Node 공개 API 를 import 한다.
3. **Worker 진입점을 옮긴 뒤 `scheduled`(cron)나 wrangler 진입이 빠지는 것.** → Task 7 Step 9 가 빌드한 Worker 에 cron 로그 문구가 있는지와 `wrangler deploy --dry-run` 을 본다.
4. **import 보호가 실제로는 슬라이스나 `app/server` 를 안 보고 있는 것.** → Task 7 Step 10 이 일부러 위반 import 를 넣어 빌드가 실패하는지 본다.
5. **Steiger 가 `src` 를 실제로 검사하지 않는데 0건으로 통과하는 것.** → Task 9 Step 7 이 일부러 레이어를 거스르는 import 를 넣어 `lint:fsd` 와 `audit:repo` 가 FAIL 하는지 본다.

---

### Task 1: 기준선·임시 글·Steiger 설치

**Files:**
- Modify: `package.json`(devDependencies `steiger` `0.7.0`, `@feature-sliced/steiger-plugin` `0.8.0` 정확한 버전, script `"lint:fsd": "steiger ./src"`), `pnpm-lock.yaml`
- Create: `steiger.config.ts`
- 커밋 안 함
  - `content/posts/261020/*`: 검증용 임시 글
  - `.git/info/exclude` 한 줄
  - `temp.local/fsd-refactor/*`: 기준선과 도구

**Interfaces:**
- Produces(이후 태스크가 쓰는 것)
  - `temp.local/fsd-refactor/BASE`: 기준 커밋 sha
  - `temp.local/fsd-refactor/baseline-dist/`: 기준 `dist/client` 사본
  - `temp.local/fsd-refactor/baseline.txt`: 기준 클라이언트 JS gzip 합과 스모크 통과 수
  - `temp.local/fsd-refactor/compare-dist.mjs <기준폴더> <대상폴더>`
    - `assets/` 아래를 뺀 모든 파일을 바이트로 비교한다.
    - 텍스트 파일은 비교 전에 `/assets/<이름>-<해시>.<확장자>` 를 `/assets/<이름>-HASH.<확장자>` 로 바꾼다.
    - 다른 파일과 없는 파일의 목록을 찍는다. 다르면 exit 1.
  - `temp.local/fsd-refactor/fsd-diag.mjs <경로 접두사>`
    - `pnpm exec steiger ./src --reporter json` 의 결과에서 `location.path` 가 `src/<접두사>` 로 시작하는 진단만 찍는다(`ruleName 상대경로 message`).
    - 진단이 있으면 exit 1.
  - `pnpm lint:fsd`

- [ ] **Step 1: 기준 커밋을 적는다**

Run: `mkdir -p temp.local/fsd-refactor && git rev-parse HEAD > temp.local/fsd-refactor/BASE && git status --short`
Expected: 작업 트리 깨끗(출력 없음)

- [ ] **Step 2: 예전 샘플 글을 임시 글로 되살리고 git 이 못 보게 한다**

Run: `git restore --source=51ca9e3^ --worktree -- content/posts/261020 && echo 'content/posts/261020/' >> .git/info/exclude && git status --short && ls content/posts/261020`
Expected
- `git status` 출력 없음
- 파일 5개: `diagram.svg`, `index.en.md`, `index.ko.md`, `mobile.png`, `posts.png`

- [ ] **Step 3: 기준선 게이트를 돌리고 산출물을 남긴다**

Run: `pnpm audit:repo --build && cp -R dist/client temp.local/fsd-refactor/baseline-dist`
Expected
- FAIL 0
- 스모크에 글 페이지 검사가 포함된다(261020 이 sitemap 에 있음)
- 결과의 클라이언트 JS gzip 합과 스모크 통과 수를 `temp.local/fsd-refactor/baseline.txt` 에 적는다

FAIL 이 임시 글 때문이면 우회하지 말고 원인을 확인한다(예: 낡은 번역이면 `pnpm content:rehash --post 261020`). 임시 글은 커밋하지 않는다.

- [ ] **Step 4: 비교 도구 두 개를 쓰고 자기 자신과 비교해 본다**

Run: `node temp.local/fsd-refactor/compare-dist.mjs temp.local/fsd-refactor/baseline-dist dist/client`
Expected: 차이 0, exit 0

- [ ] **Step 5: Steiger 를 설치하고 설정한다**

Run: `pnpm add -D -E steiger@0.7.0 @feature-sliced/steiger-plugin@0.8.0`

`steiger.config.ts` 를 만든다.
- 내용: `@feature-sliced/steiger-plugin` 의 `configs.recommended` 를 펼치고, `ignores` 블록 하나에 `src/paraglide` 아래 전부와 `src/app/routeTree.gen.ts` 를 넣는다. 그 밖의 규칙 설정은 없다.
- glob 형식은 Steiger README 예시(`'**/__mocks__/**'`)를 따른다.

- [ ] **Step 6: Steiger 가 도는지 본다**

Run: `pnpm lint:fsd; node temp.local/fsd-refactor/fsd-diag.mjs paraglide`
Expected
- `lint:fsd` 는 지금 구조에 대한 진단을 낸다(종료 코드는 상관없다)
- `fsd-diag paraglide` 는 진단 0건, exit 0. 무시 설정이 먹었다는 뜻이다

- [ ] **Step 7: 게이트**

Run: `pnpm check && pnpm test`
Expected: 둘 다 통과

- [ ] **Step 8: 커밋**

```bash
git add package.json pnpm-lock.yaml steiger.config.ts
git commit -m "chore: FSD 구조 검사용 Steiger 를 들임"
```

---

### Task 2: shared — config·i18n·lib

**Files**

`git mv` 로 옮긴다. 테스트 파일은 대상 파일을 따라간다.

| 지금 | 새 위치 |
|---|---|
| `src/site.ts` | `src/shared/config/site.ts` |
| `src/content/constants.ts` | `src/shared/config/content.ts` |
| `src/i18n/messages.ts`, `runtime.ts`, `compiled-runtime.test.ts` | `src/shared/i18n/` |
| `src/lib/url.ts` | `src/shared/i18n/url.ts` |
| `src/lib/language-options.ts` | `src/shared/i18n/language-options.ts` |
| `src/content/date.ts` | `src/shared/lib/date/date.ts` |
| `src/api/crypto.ts` | `src/shared/lib/crypto/crypto.ts` |
| `src/lib/security-headers.ts` | `src/shared/lib/security-headers/security-headers.ts` |

- Create: 공개 API
  - `src/shared/config/index.ts`
  - `src/shared/i18n/index.ts`
  - `src/shared/lib/{date,crypto,security-headers}/index.ts`
- Modify
  - 위 파일을 import 하던 모든 곳: `src/**`, `scripts/*`, `content-collections.ts`
  - `vitest.config.ts` 의 커버리지 `include`·`exclude`

**Interfaces:**
- Produces
  - `~/shared/config`: `site`, `content.ts` 의 상수 전부(`DESCRIPTION_MAX`, `SLUG_PATTERN`, `TAG_PATTERN`, `CONTENT_VW`, `SPLIT_MIN_VIEWPORT`, `BODY_MAX_WIDTH`, `IMAGE_VARIANT_WIDTHS`)
  - `~/shared/i18n`
    - `m`
    - `type Locale`, `baseLocale`, `locales`
    - `getLocale`, `localizeHref`, `localizeUrl`, `deLocalizeUrl`
    - `languageOptions`, `LANGUAGE_NAMES`, `type LanguageOption`
    - 그 밖에 밖에서 import 하는 이름
  - `~/shared/lib/date`: `parseKstDate`, `formatDate`, `formatDateTime`, `kstYear`, `formatCompactDate`
  - `~/shared/lib/crypto`: `crypto.ts` 의 export 중 밖에서 쓰는 것
  - `~/shared/lib/security-headers`: `SECURITY_HEADERS`, `withSecurityHeaders`, `headersFile`
- Node 쪽 소비자는 별칭 대신 상대 경로 `.../shared/config/index.ts` 처럼 `.ts` 를 붙여 부른다.
  - 해당 파일: `src/content/*`, `src/lib/smoke.ts`, `src/lib/indexnow.ts`, `src/lib/audit.ts`, `src/og/card.ts`, `scripts/*`

- [ ] **Step 1: 파일을 옮긴다(`git mv`, 위 표대로)**

- [ ] **Step 2: 타입 검사가 옛 경로 때문에 깨지는지 본다**

Run: `pnpm check`
Expected: FAIL. `Cannot find module '~/site'`, `'~/i18n/runtime'`, `'../content/constants'` 같은 오류

- [ ] **Step 3: 공개 API 를 만들고 import 를 고친다**

- 옛 경로는 `grep -rnE "~/(site|i18n/|lib/(url|language-options|security-headers)|content/(constants|date)|api/crypto)|/(site|constants|date|crypto|security-headers)(\.ts)?['\"]" src scripts content-collections.ts vite.config.ts` 로 찾는다.
- 같은 세그먼트 안(예: `shared/i18n/runtime.ts` → `./url`)은 상대 경로를 쓴다.
- `og/card.ts` 의 `import type { Locale } from '../i18n/runtime.ts'` 처럼 Node 가 닿는 타입 import 는 `import type` 을 유지한다.

- [ ] **Step 4: 커버리지 범위를 옮긴다**

- `vitest.config.ts` 의 `include` 에 `src/shared/**/*.ts` 를 더한다.
- `exclude` 에 지금 커버리지 밖인 `src/shared/i18n/messages.ts`, `src/shared/i18n/runtime.ts`, `src/shared/config/site.ts` 를 더한다.
- 옮긴 `url`, `language-options`, `date`, `crypto`, `security-headers` 는 계속 들어가야 한다.

- [ ] **Step 5: 게이트**

Run: `pnpm check && pnpm test && node temp.local/fsd-refactor/fsd-diag.mjs shared`
Expected
- 통과
- 커버리지 기준 통과
- `security-headers.test.ts` 의 `public/_headers` 비교도 통과
- `fsd-diag shared` 0건

- [ ] **Step 6: 저장소 점검**

Run: `pnpm audit:repo`
Expected: FAIL 0

- [ ] **Step 7: 커밋**

`git add` 에는 옮긴 파일의 옛 경로와 새 경로, 고친 파일을 모두 적는다.
- 확인: `git status --short` 에 `??`(새 파일)와 ` M` 이 남지 않아야 한다.
- 커밋 메시지: `refactor: config·i18n·공용 lib 을 shared 레이어로 옮김`

---

### Task 3: shared — api·tooling·og

**Files**

`git mv` 로 옮긴다. 테스트 파일은 대상 파일을 따라간다.

| 지금 | 새 위치 |
|---|---|
| `src/api/types.ts` | `src/shared/api/types.ts` |
| `src/lib/api-client.ts` | `src/shared/api/client.ts` |
| `src/api/http.ts` | `src/shared/api/http.server.ts` |
| `src/api/attempts.ts` | `src/shared/api/attempts.server.ts` |
| `src/api/turnstile.ts` | `src/shared/api/turnstile.server.ts` |
| `src/api/test-utils.ts` | `src/shared/api/test-utils.ts` |
| `src/api/schema.test.ts` | `src/shared/api/schema.test.ts` |
| `src/lib/audit.ts`, `smoke.ts`, `indexnow.ts` | `src/shared/tooling/` |
| `src/og/card.ts`, `render.ts`, `site-plugin.ts` | `src/shared/og/` |

- Create
  - `src/shared/api/api-context.ts`: `src/api/router.ts` 의 `ApiContext` 타입 블록을 그대로 옮긴다. `TurnstileOutcome` 은 `./turnstile.server` 에서 `import type` 한다.
  - 공개 API: `src/shared/api/{index,index.server,index.testing}.ts`, `src/shared/tooling/index.ts`, `src/shared/og/index.ts`
- Modify
  - `src/api/router.ts`: `ApiContext` 를 `~/shared/api/index.server` 에서 import 하고, 이 이름을 다시 내보내지 않는다.
  - 위 파일을 import 하던 모든 곳
  - `scripts/*.ts`
  - `content-collections.ts`
  - `vite.config.ts`(`ogSitePlugin` → `./src/shared/og/index.ts`)
  - `vitest.config.ts`

**Interfaces:**
- Consumes: Task 2 의 `~/shared/config`, `~/shared/i18n`, `~/shared/lib/*`
- Produces
  - `~/shared/api`: `type CommentDto`, `type ApiErrorCode`, `type MeDto`, `type ViewCountsDto`, `createApiClient`, `type ApiResult`
  - `~/shared/api/index.server`
    - `type ApiContext`
    - `json`, `apiError`, `isSameOrigin`, `clientIp`, `readCookie`, `readJson`, `safeReturnPath`
    - `isLimited`, `recordFailure`, `pruneAttempts`, `ATTEMPT_LIMITS`, `ATTEMPT_WINDOW_SECONDS`, `type AttemptKey`
    - `verifyTurnstile`, `type TurnstileOutcome`
    - 이 중 밖에서 쓰는 것만 내보낸다
  - `~/shared/api/index.testing`: `testContext`, `createTestDb`
  - `src/shared/tooling/index.ts`: `scripts/*` 가 `audit.ts`·`smoke.ts`·`indexnow.ts` 에서 쓰는 이름 전부. 상대 경로 `.ts` 로만 import 한다.
  - `src/shared/og/index.ts`: `postCard`, `siteCard`, `ogSitePlugin`, 그리고 `render.ts` 에서 밖으로 쓰는 것(`writeOgImage` 등). 상대 경로 `.ts` 로만 import 한다.

- [ ] **Step 1: 파일을 옮기고 `ApiContext` 타입 블록을 `shared/api/api-context.ts` 로 옮긴다**

- [ ] **Step 2: 타입 검사가 깨지는지 본다**

Run: `pnpm check`
Expected: FAIL. `~/api/types`, `./http`, `../src/lib/audit.ts`, `./src/og/card` 등을 찾지 못한다

- [ ] **Step 3: 공개 API 를 만들고 import 를 고친다**

옛 경로 찾기: `grep -rnE "api/(types|http|attempts|turnstile|crypto|test-utils)|lib/(api-client|audit|smoke|indexnow)|/og/" src scripts content-collections.ts vite.config.ts`

`src/api/*` 의 테스트가 `./test-utils` 를 부르던 곳은 `~/shared/api/index.testing` 으로 바꾼다.

- [ ] **Step 4: 커버리지 범위**

- `include` 의 `src/og/**`, `src/lib/**`, `src/api/**` 가운데 옮긴 파일은 `src/shared/**/*.ts` 가 덮는다.
- `exclude` 를 새 경로로 고친다: `src/shared/api/test-utils.ts`, `src/shared/api/types.ts`, `src/shared/api/api-context.ts`.

- [ ] **Step 5: 게이트**

Run: `pnpm check && pnpm test && node temp.local/fsd-refactor/fsd-diag.mjs shared`
Expected: 통과, `fsd-diag shared` 0건

- [ ] **Step 6: 빌드 게이트와 산출물 비교**

Run: `pnpm audit:repo --build && node temp.local/fsd-refactor/compare-dist.mjs temp.local/fsd-refactor/baseline-dist dist/client`
Expected
- FAIL 0
- 산출물 차이 0. OG PNG 와 `_headers` 도 같다

- [ ] **Step 7: 커밋**

방법은 Task 2 Step 7 과 같다.
- 커밋 메시지: `refactor: API 공용 코드·스크립트 lib·OG 를 shared 레이어로 옮김`

---

### Task 4: entities/post

**Files**

`git mv` 로 옮긴다. 테스트 파일은 대상 파일을 따라간다.

| 지금 | 새 위치 |
|---|---|
| `src/components/PostList.tsx` | `src/entities/post/ui/PostList.tsx` |
| `src/content/post-index.ts`, `post-queries.ts` | `src/entities/post/model/` |
| `src/content/posts.functions.ts`, `posts.server.ts` | `src/entities/post/api/` |
| `src/markdown/*` 전부(`link.ts`, `test-utils.ts` 포함) | `src/entities/post/markdown/` |
| `src/content/fingerprint.ts`, `slug.ts`, `source-hash.ts`, `resolve-en-post.ts`, `rehash.ts`, `translation-structure.ts`, `content-checks.ts` | `src/entities/post/source/` |

- Create: `src/entities/post/{index,index.server,index.build,index.scripts}.ts`
- Modify
  - 위 파일을 import 하던 모든 곳
  - `content-collections.ts`, `scripts/*.ts`, `vitest.config.ts`
  - `remark-widget.ts` 의 오류 문구는 Task 5 에서 고친다(경로가 그때 바뀐다)

**Interfaces:**
- Consumes: Task 2·3 의 shared 공개 API
- Produces
  - `~/entities/post`(`index.ts`)
    - `PostList`, `groupByYear`, `collectTags`, `localizePath`
    - `listPostsFn`, `getPostFn`, `getLobbyIntroFn`
    - `type PostMeta`, `type TagRef`, `type PostPage`, `type LobbyIntro`, `type FeedItem`, `type TocItem`, `type Glossary`, `type GlossaryEntry`
    - 그 밖에 밖에서 쓰는 타입·순수 함수(`resolvePostLink` 등)
  - `~/entities/post/index.server`: `postIndex`, `queries`
  - `src/entities/post/index.build.ts`
    - `renderMarkdown`, `type Glossary`, `writeAssets`
    - `absolutizeMarkdownImages`, `localizeMarkdownLinks`, `countWords`
    - `folderFingerprint`, `validateSlug`, `sameDayConflicts`, `computeSourceHash`, `resolveEnPost`
  - `src/entities/post/index.scripts.ts`
    - `collectContentProblems`, `collectContentWarnings`, `messageKeyDiff`, `plainTextMarker`, `type ContentPostInput`
    - `splitFrontmatter`, `replaceSourceHash`, `computeSourceHash`
    - `translationStructure`, `compareStructure`
    - 그 밖에 `scripts/*` 가 쓰는 것
  - 두 Node 용 공개 API 의 규칙
    - 상대 경로에 `.ts` 를 붙여서만 import 한다.
    - `index.scripts.ts` 에서 닿는 모듈(`source/*` 중 스크립트용)은 `markdown/*` 를 값으로 import 하지 않는다.
    - 상대 import 에 `.ts` 가 없는 곳은 `.ts` 를 붙인다.

- [ ] **Step 1: 파일을 옮긴다(`git mv`, 위 표대로)**

- [ ] **Step 2: 타입 검사가 깨지는지 본다**

Run: `pnpm check`
Expected: FAIL. `~/content/*`, `~/markdown/*`, `./src/content/*`, `../src/content/*` 를 찾지 못한다

- [ ] **Step 3: 공개 API 네 개를 만들고 import 를 고친다**

- 슬라이스 안(`model` ↔ `api` ↔ `markdown` ↔ `source` ↔ `ui`)은 상대 경로로 import 한다.
- 슬라이스 밖은 아래 공개 API 로 부른다.
  - 화면·서버 코드: `~/entities/post`, `~/entities/post/index.server`
  - `content-collections.ts`: `./src/entities/post/index.build.ts`
  - `scripts/*`: `../src/entities/post/index.scripts.ts`
- `src/seo/head.ts`·`url.ts` 의 `localizePath` 는 `~/entities/post` 에서 가져온다.

- [ ] **Step 4: 커버리지 범위**

- `include` 에 `src/entities/**/*.ts` 를 더한다.
- `exclude` 를 새 경로로 고친다: `src/entities/post/markdown/test-utils.ts`, `src/entities/post/api/posts.server.ts`, `src/entities/post/api/posts.functions.ts`.

- [ ] **Step 5: 게이트**

Run: `pnpm check && pnpm test && node temp.local/fsd-refactor/fsd-diag.mjs entities`
Expected: 통과, 0건

- [ ] **Step 6: 빌드 게이트와 산출물 비교**

Run: `pnpm audit:repo --build && node temp.local/fsd-refactor/compare-dist.mjs temp.local/fsd-refactor/baseline-dist dist/client`
Expected
- FAIL 0
- 산출물 차이 0

허용되는 차이는 서버 함수 ID 하나뿐이다(스펙 10장). `posts.functions.ts` 를 옮기면 HTML 안의 `/_serverFn/` 뒤 해시가 바뀔 수 있다. 다른 차이가 나오면 멈추고 원인을 찾는다.

- [ ] **Step 7: paraglide 생성물 없이 Node 공개 API 를 불러 본다 (Review Focus 2)**

Run: `mv src/paraglide temp.local/fsd-refactor/paraglide-aside && node --input-type=module -e "await import('./src/entities/post/index.scripts.ts'); await import('./src/shared/tooling/index.ts'); await import('./src/shared/lib/security-headers/index.ts'); await import('./src/shared/og/index.ts'); console.log('ok')"; mv temp.local/fsd-refactor/paraglide-aside src/paraglide`
Expected: `ok`. 실패하면 그 경로에서 값으로 import 하는 `~` 별칭이나 paraglide 를 찾아 고친다.

이 단계만 예외로 `;` 를 쓴다. 실패해도 `src/paraglide` 를 되돌려야 해서다.

- [ ] **Step 8: 커밋**

- 커밋 메시지: `refactor: 글 모델·렌더 파이프라인·원문 검사를 entities/post 로 옮김`

---

### Task 5: features — comment·view-count·term-tooltip·embeds

**Files**

`git mv` 로 옮긴다. 테스트 파일은 대상 파일을 따라간다.

| 지금 | 새 위치 |
|---|---|
| `src/components/comments/*.tsx`(4개) | `src/features/comment/ui/` |
| `src/api/comment-input.ts` | `src/features/comment/model/comment-input.ts` |
| `src/lib/comment-errors.ts` | `src/features/comment/lib/comment-errors.ts` |
| `src/api/password.ts` | `src/features/comment/lib/password.server.ts` |
| `src/api/comments.ts` | `src/features/comment/api/comments.server.ts` |
| `src/api/comments-repo.ts` | `src/features/comment/api/comments-repo.server.ts` |
| `src/components/ViewCounts.tsx` | `src/features/view-count/ui/ViewCounts.tsx` |
| `src/lib/view-target.ts`, `min-delay.ts` | `src/features/view-count/lib/` |
| `src/api/views.ts` | `src/features/view-count/api/views.server.ts` |
| `src/components/TermTooltips.tsx` | `src/features/term-tooltip/ui/TermTooltips.tsx` |
| `src/lib/tooltip-position.ts` | `src/features/term-tooltip/lib/tooltip-position.ts` |
| `src/components/WidgetMounter.tsx` | `src/features/embeds/ui/WidgetMounter.tsx` |
| `src/widgets/counter-demo.tsx` | `src/features/embeds/ui/counter-demo.tsx` |
| `src/widgets/registry.ts` | `src/features/embeds/model/registry.ts` |
| `src/widgets/names.ts` | `src/features/embeds/config/names.ts` |

- Create
  - `src/features/comment/{index,index.server}.ts`
  - `src/features/view-count/{index,index.server}.ts`
  - `src/features/term-tooltip/index.ts`
  - `src/features/embeds/{index,index.build}.ts`
- Modify
  - `src/api/router.ts`, `src/api/cleanup.ts`: 핸들러와 `pruneViews` 를 `~/features/*/index.server` 에서 import 한다.
  - `src/entities/post/markdown/remark-widget.ts` 오류 문구의 경로 → `src/features/embeds/config/names.ts`
  - `content-collections.ts`(`widgetNames` → `./src/features/embeds/index.build.ts`)
  - 라우트 파일, `src/components/Layout.tsx`
  - `vitest.config.ts`
  - `docs/writing/style-guide.md` 의 `src/widgets/names.ts`

**Interfaces:**
- Consumes: `~/shared/api`, `~/shared/api/index.server`, `~/shared/api/index.testing`, `~/shared/i18n`, `~/shared/lib/date`, `~/shared/lib/crypto`, `~/shared/config`, `~/entities/post`(`GlossaryEntry` 등 타입)
- Produces
  - `~/features/comment`: `CommentSection`
  - `~/features/comment/index.server`: `handleMe`, `handleListComments`, `handleCreateComment`, `handleEditComment`, `handleDeleteComment`
  - `~/features/view-count`: `ViewCountsProvider`, `useViewCounts`, `ViewCount`
  - `~/features/view-count/index.server`: `handleRecordView`, `pruneViews`
  - `~/features/term-tooltip`: `TermTooltips`
  - `~/features/embeds`: `WidgetMounter`
  - `src/features/embeds/index.build.ts`: `widgetNames`. React 를 import 하지 않는다.
- 규칙: `features/comment/ui/*` 는 `*.server.ts` 를 import 하지 않는다. 입력 규칙(`COMMENT_LIMITS` 등)은 `model/comment-input.ts` 에서 가져온다.

- [ ] **Step 1: 파일을 옮긴다(`git mv`, 위 표대로)**

이 시점에 `src/widgets/` 폴더는 비어서 사라진다.

- [ ] **Step 2: 타입 검사가 깨지는지 본다**

Run: `pnpm check`
Expected: FAIL. `~/components/comments/*`, `~/api/comment-input`, `~/widgets/*` 등을 찾지 못한다

- [ ] **Step 3: 공개 API 를 만들고 import 를 고친다**

- 슬라이스 안은 상대 경로로 import 한다(예: `ui/CommentItem.tsx` → `../model/comment-input`).
- 같은 레이어의 다른 슬라이스는 import 하지 않는다.

- [ ] **Step 4: 커버리지 범위**

- `include` 에 `src/features/**/*.ts` 를 더한다(`.tsx` 는 넣지 않는다).
- `src/widgets/**` 와 `src/widgets/*.tsx` 항목은 뺀다.

- [ ] **Step 5: 게이트**

Run: `pnpm check && pnpm test && node temp.local/fsd-refactor/fsd-diag.mjs features`
Expected
- 통과
- 댓글·조회수 핸들러 테스트가 새 위치에서 그대로 통과
- `fsd-diag features` 0건

- [ ] **Step 6: 빌드 게이트와 산출물 비교**

Run: `pnpm audit:repo --build && node temp.local/fsd-refactor/compare-dist.mjs temp.local/fsd-refactor/baseline-dist dist/client`
Expected
- FAIL 0
- 스모크의 `/api/me` 와 댓글 검사 통과
- 산출물 차이는 Task 4 에서 허용한 것뿐

- [ ] **Step 7: 커밋**

- 커밋 메시지: `refactor: 댓글·조회수·용어 툴팁·글 속 위젯을 features 레이어로 옮김`

---

### Task 6: widgets·pages

**Files**

`git mv` 로 옮긴다. 테스트 파일은 대상 파일을 따라간다.

| 지금 | 새 위치 |
|---|---|
| `src/components/Layout.tsx`, `LanguageMenu.tsx` | `src/widgets/site-layout/ui/` |
| `src/components/NotFound.tsx` | `src/pages/not-found/ui/NotFound.tsx` |
| `src/components/TagFilter.tsx`(+`TagFilter.test.tsx`) | `src/pages/posts/ui/` |
| `src/lib/tag-filter.ts` | `src/pages/posts/lib/tag-filter.ts` |
| `src/components/Toc.tsx` | `src/pages/post/ui/Toc.tsx` |
| `src/lib/active-heading.ts` | `src/pages/post/lib/active-heading.ts` |
| `src/hooks/useActiveHeading.ts` | `src/pages/post/lib/useActiveHeading.ts` |

- Create: 라우트 컴포넌트를 옮긴 page 파일. 본문(JSX·훅·상수)을 그대로 옮기고 loader 데이터를 props 로 받는다.
  - `src/pages/home/ui/HomePage.tsx`: `src/routes/index.tsx` 의 `Lobby` 본문과 `RECENT_COUNT`
  - `src/pages/posts/ui/PostsPage.tsx`: `src/routes/posts/index.tsx` 의 `Posts` 본문
  - `src/pages/post/ui/PostPage.tsx`: `src/routes/$slug.tsx` 의 `Post` 본문
- Create: 공개 API
  - `src/widgets/site-layout/index.ts`
  - `src/pages/{home,posts,post,not-found}/index.ts`
- Modify: `src/routes/index.tsx`, `src/routes/posts/index.tsx`, `src/routes/$slug.tsx`, `src/routes/__root.tsx`, `vitest.config.ts`

**Interfaces:**
- Consumes: `~/features/*`, `~/entities/post`, `~/shared/*`
- Produces

  | 공개 API | 내보내는 것 |
  |---|---|
  | `~/widgets/site-layout` | `Layout` |
  | `~/pages/home` | `HomePage({ posts, intro }: { posts: PostMeta[]; intro: LobbyIntro \| null })` |
  | `~/pages/posts` | `PostsPage({ posts, tags }: { posts: PostMeta[]; tags: TagRef[] })` |
  | `~/pages/post` | `PostPage({ page }: { page: PostPageData })` |
  | `~/pages/not-found` | `NotFound` |

  - `PostPageData` 는 `import type { PostPage as PostPageData } from '~/entities/post'` 로 가져온다. 컴포넌트 이름과 타입 이름이 같아서 별칭을 쓴다.
- 라우트 파일에 남기는 것
  - `createFileRoute` 의 `loader`, `head`, `validateSearch`
  - `APPLY_TAG_SCRIPT`
  - `component` 연결
  - 예: `component: () => <PostPage page={Route.useLoaderData()} />`
- pages 는 `src/routes/*` 와 `src/seo/*` 를 import 하지 않는다.

- [ ] **Step 1: 파일을 옮기고 page 파일 세 개를 만든다**

라우트 파일에서 컴포넌트 함수를 잘라 옮긴다. `Route.useLoaderData()` 대신 props 를 쓴다.

- [ ] **Step 2: 타입 검사가 깨지는지 본다**

Run: `pnpm check`
Expected: FAIL. `~/components/*`, `~/hooks/*`, `~/lib/tag-filter` 등을 찾지 못한다

- [ ] **Step 3: 공개 API 를 만들고 라우트·page 의 import 를 고친다**

- [ ] **Step 4: 커버리지 범위**

- `include` 에 `src/pages/**/*.ts`, `src/widgets/**/*.ts` 를 더한다.
- `exclude` 에 `src/pages/post/lib/useActiveHeading.ts` 를 더한다(지금도 커버리지 밖).
- 옮긴 `tag-filter.ts`, `active-heading.ts` 는 계속 들어간다.

- [ ] **Step 5: 게이트**

Run: `pnpm check && pnpm test && node temp.local/fsd-refactor/fsd-diag.mjs pages && node temp.local/fsd-refactor/fsd-diag.mjs widgets`
Expected: 통과, 둘 다 0건

- [ ] **Step 6: 빌드 게이트와 산출물 비교**

Run: `pnpm audit:repo --build && node temp.local/fsd-refactor/compare-dist.mjs temp.local/fsd-refactor/baseline-dist dist/client`
Expected
- FAIL 0
- 프리렌더 HTML 차이 없음(DOM 이 같다는 뜻)
- 차이는 Task 4 에서 허용한 것뿐

- [ ] **Step 7: 커밋**

- 커밋 메시지: `refactor: 사이트 레이아웃을 widgets 로, 화면을 pages 로 옮기고 라우트는 연결만 함`

---

### Task 7: app — 라우트·엔트리·Worker·SEO·설정

**Files**

`git mv` 로 옮긴다. 테스트 파일은 대상 파일을 따라간다.

| 지금 | 새 위치 |
|---|---|
| `src/routes/**` | `src/app/routes/**`(이름 그대로) |
| `src/routeTree.gen.ts` | `src/app/routeTree.gen.ts` |
| `src/router.tsx` | `src/app/router.tsx` |
| `src/client.tsx` | `src/app/client.tsx` |
| `src/server.ts` | `src/app/server/worker.ts` |
| `src/lib/markdown-negotiation.ts` | `src/app/server/markdown-negotiation.ts` |
| `src/lib/url-guard.ts` | `src/app/server/url-guard.ts` |
| `src/api/router.ts` | `src/app/server/api-router.ts` |
| `src/api/context.ts` | `src/app/server/api-context.ts` |
| `src/api/access.ts` | `src/app/server/access.ts` |
| `src/api/cleanup.ts` | `src/app/server/cleanup.ts` |
| `src/seo/*` | `src/app/seo/*` |
| `src/lib/prerender.ts` | `src/app/build/prerender.ts` |

- Modify
  - `vite.config.ts`
  - `wrangler.jsonc`(`"main": "./src/app/server/worker.ts"`)
  - `worker-configuration.d.ts`(`pnpm cf-typegen` 으로 다시 만든다)
  - `vitest.config.ts`
  - `.claude/commands/audit.md` 의 `src/routes/`, `src/api/`, `src/lib/audit.ts` 경로

**Interfaces:**
- Consumes: Task 2~6 의 모든 공개 API
- `vite.config.ts` 의 `tanstackStart` 옵션. 경로는 모두 `srcDirectory`(`src`) 기준이다.

  | 옵션 | 값 |
  |---|---|
  | `router.routesDirectory` | `'app/routes'` |
  | `router.generatedRouteTree` | `'app/routeTree.gen.ts'` |
  | `router.entry` | `'app/router'` |
  | `client.entry` | `'app/client'` |
  | `server.entry` | `'app/server/worker'` |
  | `importProtection.client.files` | `['**/*.server.*', '**/src/app/server/**']` |

  - 기존 `prerender`·`pages` 옵션은 그대로 둔다.
  - import 경로만 바꾼다: `./src/app/build/prerender.ts`.
- `app/server/*` 는 접미사 없이 둔다. `app/routes/*`·`router.tsx`·`client.tsx` 는 `app/server/*` 를 import 하지 않는다.

- [ ] **Step 1: 파일을 옮긴다(`git mv`, 위 표대로). `src/api`, `src/lib`, `src/seo`, `src/routes`, `src/components`, `src/hooks`, `src/content`, `src/markdown`, `src/og`, `src/i18n` 이 비었는지 본다**

Run: `git mv ... && ls src`
Expected: `app entities features pages paraglide shared styles widgets`. `styles` 는 Task 8 에서 옮긴다.

- [ ] **Step 2: vite·wrangler 설정을 바꾸고 타입을 다시 만든다**

Run: `pnpm cf-typegen && grep -n "mainModule" worker-configuration.d.ts`
Expected: `typeof import("./src/app/server/worker")`

- [ ] **Step 3: import 를 고친다**

- `__root.tsx` 의 `~/styles/app.css?url` 은 이 태스크에서 그대로 둔다.
- `app/seo/*` 는 슬라이스가 아니라 app 세그먼트다. 그래서 같은 세그먼트 안은 상대 경로로 부른다.

- [ ] **Step 4: 커버리지 범위**

- `include` 에 `src/app/server/**/*.ts`, `src/app/seo/**/*.ts`, `src/app/build/**/*.ts` 를 더한다. 옛 디렉터리 항목은 모두 지운다.
- `exclude` 를 고친다: `src/app/server/worker.ts`, `src/app/server/api-context.ts`(env 배선. 지금도 밖).

- [ ] **Step 5: 게이트**

Run: `pnpm check && pnpm test && pnpm lint:fsd`
Expected
- `check`·`test` 통과
- `lint:fsd` 의 진단은 `src/styles` 와 관계된 것만 남거나 0건. 레이어·공개 API 위반은 0건

- [ ] **Step 6: 빌드 게이트와 산출물 비교**

Run: `pnpm audit:repo --build && node temp.local/fsd-refactor/compare-dist.mjs temp.local/fsd-refactor/baseline-dist dist/client`
Expected: FAIL 0, 차이는 Task 4 에서 허용한 것뿐

- [ ] **Step 7: dev 서버가 새 라우트 위치로 뜨는지 본다**

Run: `pnpm dev` 를 백그라운드로 띄운다. 그다음 `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ http://localhost:3000/en http://localhost:3000/261020 http://localhost:3000/api/me` 를 돌리고 dev 서버를 끈다.
Expected: `200` 네 번

- [ ] **Step 8: paraglide 생성물 없이 vite 설정 경로를 불러 본다 (Review Focus 2)**

Run: `mv src/paraglide temp.local/fsd-refactor/paraglide-aside && node --input-type=module -e "await import('./src/app/build/prerender.ts'); await import('./src/shared/og/index.ts'); await import('./src/entities/post/index.scripts.ts'); console.log('ok')"; mv temp.local/fsd-refactor/paraglide-aside src/paraglide`
Expected: `ok`

- [ ] **Step 9: Worker 진입과 cron 이 살아 있는지 본다 (Review Focus 3)**

Run: `pnpm build && grep -c "정리 완료" dist/server/index.js && pnpm exec wrangler deploy --dry-run --outdir temp.local/fsd-refactor/dry-run`
Expected: `grep` 이 1 이상이고, dry-run 이 오류 없이 끝난다

- [ ] **Step 10: import 보호가 실제로 막는지 본다 (Review Focus 4)**

두 위반을 하나씩 넣고 확인한다. 커밋하지 않는다.
- (a) `src/features/comment/ui/CommentSection.tsx` 에 `import '../api/comments-repo.server'` 를 넣는다.
  - Run: `pnpm build`
  - Expected: FAIL. import-protection 오류에 `comments-repo.server` 가 보인다
  - 되돌린다
- (b) `src/app/routes/index.tsx` 에 `import '~/app/server/access'` 를 넣는다.
  - Run: `pnpm build`
  - Expected: FAIL. `app/server/access` 가 보인다
  - 되돌린다

Run: `git status --short`
Expected: 이 두 파일에 변경 없음

- [ ] **Step 11: 커밋**

- 커밋 메시지: `refactor: 라우트·엔트리·Worker·SEO 산출물을 app 레이어로 옮김`

---

### Task 8: CSS 를 슬라이스 옆으로

**Files**

`git mv` 로 옮긴다.

| 지금 | 새 위치 |
|---|---|
| `src/styles/app.css` | `src/app/styles/app.css` |
| `src/styles/fonts.css` | `src/app/styles/fonts.css` |
| `src/styles/tokens.css` | `src/app/styles/tokens.css` |
| `src/styles/comments.css` | `src/features/comment/ui/comment.css` |
| `src/styles/language-menu.css` | `src/widgets/site-layout/ui/language-menu.css` |
| `src/styles/badge.css` | `src/entities/post/ui/draft-badge.css` |

`layout.css`·`prose.css` 는 규칙 블록을 잘라 아래 파일로 나눈다(스펙 6장).

| 새 파일 | 담는 규칙 |
|---|---|
| `src/app/styles/base.css` | `html`, `body`, `a`, `main`, `.display`, `.meta-list`, `.section-title`, 그 밖에 어느 슬라이스에도 속하지 않는 규칙 |
| `src/widgets/site-layout/ui/layout.css` | `.site`, `.site-header`, `.site-name`, `.site-nav`, `.site-footer`, `.site-socials` |
| `src/pages/home/ui/home.css` | `.lobby-*` |
| `src/pages/posts/ui/posts.css` | `.posts`, `.post-year`, `.tag-filter` |
| `src/pages/post/ui/post.css` | `.post-header`, `.post-meta`, `.post-tags`, `.post-aside`, `.toc*` |
| `src/pages/not-found/ui/not-found.css` | `.not-found` |
| `src/entities/post/ui/post-list.css` | `.post-list`, `.post-item*` |
| `src/entities/post/ui/prose.css` | `.prose` |
| `src/features/view-count/ui/view-count.css` | `.view-count-number` |
| `src/features/term-tooltip/ui/term-tooltip.css` | `.term-tooltip` |
| `src/features/embeds/ui/counter-demo.css` | `.widget-counter` |

- Modify
  - `src/app/routes/__root.tsx`(`~/app/styles/app.css?url`)
  - `scripts/fonts/build_suit.py`(`CSS_PATH = "src/app/styles/fonts.css"`)
- `app.css` 의 `@import` 순서
  - 지금 순서대로 둔다: `fonts` → `tokens` → `layout` 에서 나온 파일들 → `prose` 에서 나온 파일들 → `comment` → `language-menu` → `draft-badge`.
  - 한 원본 파일에서 나온 파일들은 원본에서 규칙이 처음 나온 순서대로 둔다.
  - 이렇게 해서 같은 우선순위 규칙의 순서를 지킨다.

**Interfaces:**
- Consumes: Task 1 의 `BASE`
- Produces(검증 도구, 커밋 안 함): `temp.local/fsd-refactor/style-dump.js`
  - chrome-devtools MCP 의 `evaluate` 로 실행한다. 인자는 `mode` 하나(`'save'` 또는 `'compare'`)다.
  - 같은 출처 iframe 을 만들어 페이지를 연다.
    - 경로 9개: `/`, `/en`, `/posts`, `/posts?tag=meta`, `/en/posts`, `/261020`, `/en/261020`, `/does-not-exist`, `/en/does-not-exist`
    - 폭 2개: 390px, 1280px. 높이는 900px
  - `load`, `document.fonts.ready`, 그리고 2초를 기다린다.
  - 모든 요소와 `::before`·`::after` 의 `getComputedStyle` 전체를 DOM 경로(태그와 nth-child 사슬)를 키로 모은다.
    - Turnstile 컨테이너 아래와 `iframe` 요소 안은 뺀다.
  - `save`: IndexedDB `fsd-style` 에 `경로@폭` 키로 저장한다.
  - `compare`: 저장값과 비교해 `{ pages, elements, diffCount, diffs }` 를 돌려준다. `diffs` 는 앞 30개만이다.

- [ ] **Step 1: 기준 워크트리를 띄울 준비를 한다**

워크트리는 저장소 밖 `~/.agent-temp/fsd-refactor-base` 에 둔다. 저장소 안에 두면 `tsconfig` 의 `**/*.ts` 가 그 안의 옛 코드까지 타입 검사한다.

Run: `git worktree add ~/.agent-temp/fsd-refactor-base $(cat temp.local/fsd-refactor/BASE) && cp -R content/posts/261020 ~/.agent-temp/fsd-refactor-base/content/posts/ && cp .dev.vars ~/.agent-temp/fsd-refactor-base/ && cd ~/.agent-temp/fsd-refactor-base && pnpm install --frozen-lockfile && pnpm db:migrate:local && pnpm build`
Expected: 빌드 성공

- [ ] **Step 2: 기준 스타일을 저장한다**

- 기준 워크트리에서 `pnpm preview`(4173)를 띄운다.
- MCP `navigate` 로 `http://localhost:4173/does-not-exist` 를 연다.
- `style-dump.js` 를 `save` 로 실행하고 preview 를 끈다.

Expected: 18개(9경로 × 2폭) 저장, 각 요소 수가 0보다 크다

- [ ] **Step 3: CSS 를 옮기고 나눈다(위 표대로)**

- 규칙 블록은 글자 그대로 옮긴다.
- 원본 파일의 주석은 그 규칙을 따라간다.

- [ ] **Step 4: 빌드하고 현재 스타일을 비교한다**

- 저장소 루트에서 `pnpm build && pnpm preview` 를 띄운다.
- 같은 MCP 탭에서 `http://localhost:4173/does-not-exist` 를 연다.
- `style-dump.js` 를 `compare` 로 실행하고 preview 를 끈다.

Expected: `diffCount: 0`

차이가 있으면 `@import` 순서나 블록 분할을 고쳐 다시 비교한다. 같은 상태로 두 번 덤프해서 생기는 흔들림(조회수 숫자가 채워지는 타이밍 등)은 기준선을 두 번 떠서 확인하고 비교에서 뺀다.

- [ ] **Step 5: CSS 안의 url 을 비교한다**

Run: 기준 워크트리 `~/.agent-temp/fsd-refactor-base/dist/client/assets/*.css` 와 현재 `dist/client/assets/*.css` 에서 `url(...)` 목록을 뽑아 정렬해 `diff` 한다.
Expected: 차이 없음(폰트 94개와 data URI 아이콘 9개)

- [ ] **Step 6: 상태 규칙의 순서를 비교한다 (Review Focus 1)**

Run
- 두 빌드 CSS 에서 선택자에 `:hover`, `:focus`, `:focus-visible`, `:active`, `:checked`, `[open]`, `[data-` 가 들어간 규칙을 나온 순서대로 뽑는다.
- 각 규칙은 `(미디어 조건, 선택자, 선언)` 으로 나타낸다.
- 두 목록을 `diff` 한다.

Expected: 차이 없음

- [ ] **Step 7: 게이트**

Run: `pnpm audit:repo --build && node temp.local/fsd-refactor/compare-dist.mjs temp.local/fsd-refactor/baseline-dist dist/client && pnpm lint:fsd`
Expected
- FAIL 0
- 산출물 차이는 Task 4 에서 허용한 것뿐
- `lint:fsd` 진단 0건
- `src/styles` 가 없어졌다

- [ ] **Step 8: 커밋**

- `scripts/fonts/build_suit.py` 를 포함한다.
- 커밋 메시지: `refactor: 손으로 쓴 CSS 를 쓰는 슬라이스 옆으로 옮김`

---

### Task 9: Steiger 게이트와 문서

**Files:**
- Modify
  - `src/shared/tooling/audit.ts`
  - `src/shared/tooling/audit.test.ts`
  - `src/shared/tooling/index.ts`
  - `scripts/audit.ts`
  - `AGENTS.md`
  - `docs/writing/style-guide.md`(남은 옛 경로가 있으면)

**Interfaces:**
- Produces
  - `type SteigerDiagnostic = { message: string; severity: 'error' | 'warn'; ruleName: string; location: { path: string; line?: number; column?: number } }`
  - `fsdResults(diagnostics: SteigerDiagnostic[], root: string): AuditResult`
    - `id` 는 `'fsd'` 다.
    - 진단이 없으면 `PASS` 이고 메시지는 `'FSD 구조 (Steiger)'` 다.
    - 오류가 하나라도 있으면 `FAIL` 이고 메시지는 `'FSD 구조 위반 (pnpm lint:fsd)'` 다.
    - 경고만 있으면 `WARN` 이고 메시지는 `'FSD 구조 경고 (pnpm lint:fsd)'` 다.
    - `details` 는 진단마다 한 줄이고 형식은 `` `${ruleName} ${root 기준 상대경로}${line ? `:${line}` : ''} ${message}` `` 다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```ts
describe('fsdResults', () => {
  const root = '/repo'
  const diag = (severity: 'error' | 'warn', line?: number) => ({
    message: '금지된 import',
    severity,
    ruleName: 'fsd/forbidden-imports',
    location: { path: '/repo/src/entities/post/index.ts', ...(line ? { line } : {}) },
  })
  it('진단이 없으면 PASS', () => {
    expect(fsdResults([], root)).toEqual({ id: 'fsd', status: 'PASS', message: 'FSD 구조 (Steiger)' })
  })
  it('오류가 있으면 FAIL 이고 상대 경로와 줄을 적는다', () => {
    expect(fsdResults([diag('warn'), diag('error', 3)], root)).toEqual({
      id: 'fsd',
      status: 'FAIL',
      message: 'FSD 구조 위반 (pnpm lint:fsd)',
      details: [
        'fsd/forbidden-imports src/entities/post/index.ts 금지된 import',
        'fsd/forbidden-imports src/entities/post/index.ts:3 금지된 import',
      ],
    })
  })
  it('경고만 있으면 WARN', () => {
    expect(fsdResults([diag('warn')], root).status).toBe('WARN')
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm exec vitest run src/shared/tooling/audit.test.ts`
Expected: FAIL. `fsdResults` 가 없다

- [ ] **Step 3: `fsdResults` 를 구현하고 `shared/tooling/index.ts` 에서 내보낸다**

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm exec vitest run src/shared/tooling/audit.test.ts`
Expected: PASS

- [ ] **Step 5: `scripts/audit.ts` 의 `baseChecks` 에 Steiger 를 붙인다**

- 메시지 키 검사 다음에 `run('pnpm', ['exec', 'steiger', './src', '--reporter', 'json'])` 을 돌린다.
- stdout 을 JSON 으로 읽어 `fsdResults(…, process.cwd())` 를 넣는다.
- JSON 을 읽지 못하면 `{ id: 'fsd', status: 'FAIL', message: 'Steiger 실행 실패', details: tail(stdout + stderr) }` 로 넣는다.

- [ ] **Step 6: 게이트가 PASS 인지 본다**

Run: `pnpm audit:repo`
Expected: `fsd` PASS, FAIL 0

- [ ] **Step 7: 게이트가 위반을 실제로 잡는지 본다 (Review Focus 5)**

- `src/shared/config/site.ts` 에 `import '~/entities/post'` 를 넣는다.
- Run: `pnpm lint:fsd; pnpm audit:repo`
- Expected
  - `lint:fsd` 가 `fsd/forbidden-imports` 를 낸다
  - `audit:repo` 의 `fsd` 가 FAIL 이다
- 되돌리고 `git status --short` 로 `site.ts` 변경이 없는지 본다.

- [ ] **Step 8: 문서를 고친다**

`AGENTS.md` 를 고친다.
- 경로가 들어간 모든 줄을 새 경로로 바꾼다. 남은 것은 `grep -nE "src/(api|lib|content|markdown|seo|og|routes|components|hooks|i18n|styles|widgets)/|src/(server|site|router|client)\.ts" AGENTS.md` 로 찾는다.
- "FSD 구조" 절을 새로 쓴다. 담을 것:
  - 레이어와 import 방향
  - 공개 API 다섯 종류와 각각 누가 부르는지
  - `*.server.ts` 규칙과 `app/server` 폴더 보호, `srcDirectory` 를 바꾸지 말 것
  - Node 쪽 소비자 표와 `.ts`·`import type` 규칙
  - pages 우선 규칙(한 곳에서만 쓰면 그 페이지 안, 두 곳 이상이면 아래 레이어로)
  - `pnpm lint:fsd` 와 `audit:repo` 의 `fsd` 검사
  - Steiger `ignores` 는 두 개뿐이라는 것
- 명령 표에 `pnpm lint:fsd` 를 더한다.
- CSS 절의 "src/styles 에 별도 파일" 규칙을 "그 슬라이스 `ui` 옆에 두고 `app/styles/app.css` 에서 원래 순서를 지켜 `@import`" 로 바꾼다.

- [ ] **Step 9: 옛 경로가 남았는지 저장소 전체를 본다**

Run: `grep -rnE "src/(api|lib|content|markdown|seo|og|routes|components|hooks|i18n|styles|widgets)/|src/(server|site|router|client)\.ts|~/(api|lib|content|markdown|seo|og|components|hooks|i18n|site|styles|widgets)\b" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.content-collections --exclude-dir=temp.local --exclude-dir=coverage . | grep -v "docs/superpowers/"`
Expected: 출력 없음. 지난 스펙·계획서(`docs/superpowers/`)는 기록이라 고치지 않는다

- [ ] **Step 10: 게이트**

Run: `pnpm audit:repo --build`
Expected: FAIL 0, WARN 은 기준선과 같다

- [ ] **Step 11: 커밋**

- 커밋 메시지: `feat: audit 에 FSD 구조 검사를 붙이고 문서를 새 구조로 고침`

---

### Task 10: 최종 검증·정리·배포

**Files:**
- 지울 것(커밋 안 함): `content/posts/261020/`, `.git/info/exclude` 의 그 줄, `~/.agent-temp/fsd-refactor-base` 워크트리

- [ ] **Step 1: 전체 게이트**

Run: `pnpm audit:repo --build && node temp.local/fsd-refactor/compare-dist.mjs temp.local/fsd-refactor/baseline-dist dist/client && pnpm lint:fsd`
Expected
- FAIL 0
- 산출물 차이는 허용한 서버 함수 ID 뿐
- 진단 0건
- 클라이언트 JS gzip 합이 `baseline.txt` 보다 1KB 넘게 늘지 않았다(늘었으면 원인을 찾는다)
- 스모크 통과 수가 기준선과 같다

- [ ] **Step 2: 화면을 마지막으로 비교한다**

Task 8 Step 4 와 같은 방법으로 `compare` 한다. 브라우저에 기준 저장값이 없으면 Task 8 Step 2 부터 다시 한다(기준 워크트리는 남아 있다).
Expected: `diffCount: 0`

- [ ] **Step 3: 임시 글과 워크트리를 치우고 글 0편 상태에서 다시 게이트를 돌린다**

Run: `git worktree remove --force ~/.agent-temp/fsd-refactor-base && rm -rf content/posts/261020 && sed -i '' '/content\/posts\/261020\//d' .git/info/exclude && git status --short && pnpm audit:repo --build`
Expected
- `git status` 출력 없음
- FAIL 0. 글이 0편이라 스모크의 글 페이지 검사는 건너뛴다

- [ ] **Step 4: 최종 리뷰**

실행 스킬의 Final Review 를 따른다. 커밋 범위는 `$(cat temp.local/fsd-refactor/BASE)..HEAD` 다.

- [ ] **Step 5: push 전에 은솔에게 확인받는다**

보여 줄 것
- 커밋 목록
- 검증 결과 요약: 산출물 비교, 스타일 비교, 번들 크기, Steiger 0건
- 서버 함수 ID 가 바뀌어서, 배포 때 열려 있던 탭은 새로고침이 필요하다는 점

Expected: 은솔의 명시적 승인. 승인 전에는 push 하지 않는다

- [ ] **Step 6: push 하고 배포를 확인한다**

Run: `git push origin main`
그다음 Actions 실행이 끝날 때까지 기다리고 아래를 돌린다.
Run: `pnpm smoke https://nabichan.me && pnpm audit:repo --live`
Expected
- Actions 의 모든 단계 success
- 스모크 통과
- `--live` FAIL 0

- [ ] **Step 7: 임시 폴더를 지운다**

Run: `rm -rf temp.local/fsd-refactor ~/.agent-temp/fsd-research ~/.agent-temp/fsd-refactor-base`
Expected: 지워짐
