# FSD 리팩터링 설계

`src` 전체를 Feature-Sliced Design(FSD) 레이어로 옮기고, Steiger 로 의존 방향을 강제한다. 동작은 바꾸지 않는다.

## 1. 왜 하나

은솔이 꼽은 이유는 세 가지다.

1. **파일 찾기가 어렵다.** 기술 종류로 나눈 폴더(`lib`, `components`, `hooks`)와 도메인 폴더(`api`, `content`, `markdown`, `seo`, `og`)가 섞여 있다. `lib` 에는 스크립트용(`smoke`, `audit`, `indexnow`)과 화면용(`tag-filter`, `tooltip-position`)이 같이 있다. 댓글 하나가 다섯 곳에 흩어져 있다.
   - `components/comments`
   - `lib/api-client`
   - `lib/comment-errors`
   - `api/comment-input`
   - `api/comments`·`api/comments-repo`
2. **의존 방향을 규칙으로 막고 싶다.** 아래 레이어가 위 레이어를 import 하지 못하게 한다.
3. **기능이 늘어날 대비.** 새 기능이 어디에 들어갈지 고민 없이 정해지는 틀을 만든다.

### 성공 기준

- "이 기능 코드 어디 있어?"에 폴더 하나로 답한다. 예를 들어 댓글은 화면, 서버 처리, D1 쿼리, CSS 까지 전부 `features/comment` 에 있다.
- Steiger 가 레이어 방향과 공개 API 우회를 잡는다. `audit:repo` 가 위반을 FAIL 로 내서 배포를 막는다.
- 리팩터링 전후로 사이트가 똑같이 동작한다(검증은 9장).

## 2. 목표·비목표·반목표

**목표**
- 화면, Worker API, 빌드 파이프라인, 스크립트가 쓰는 lib 까지 `src` 의 모든 코드를 FSD 레이어로 옮긴다.
- Steiger 를 들여서 검사를 자동으로 돌린다.
- 문서(`AGENTS.md` 등)를 새 구조에 맞춘다.

**비목표**
- 동작, 디자인, URL, 응답 헤더, 의존성 버전은 바꾸지 않는다.
- 새 기능은 넣지 않는다.
- 옮기는 김에 로직을 고치지 않는다. 허용하는 변경은 여섯 가지뿐이다.
  - 파일 이동
  - import 경로(Node 가 읽는 상대 import 에 `.ts` 를 붙이는 것 포함)
  - 공개 API(`index*.ts`) 추가
  - 아래에 적은 타입·규칙 블록 이동
  - 라우트 컴포넌트를 pages 로 빼면서 loader 데이터를 props 로 넘기는 것
  - 주석과 오류 문구에 적힌 옛 경로를 새 경로로 바꾸는 것(예: `remark-widget.ts` 의 `src/widgets/names.ts`)

**반목표** — 아래 중 하나라도 생기면 겉으로 돌아가도 실패다.
- 프로덕션 응답이 달라진다(본문, 헤더, 상태 코드, 프리렌더 산출물).
- D1·`jose`·시크릿을 다루는 코드가 브라우저 번들에 들어간다.
- Steiger 를 통과시키려고 규칙을 끄거나 `ignores` 를 늘린다(허용 범위는 7장).
- 커버리지 기준(함수 100%, 줄 90%)을 낮추거나, 지금 커버리지에 들어가는 파일을 빼서 맞춘다.
- 레이어 규칙만을 위해 의미 없는 래퍼나 재수출 파일을 늘린다. 공개 API 파일 말고는 늘리지 않는다.

## 3. 은솔이 정한 것

| 항목 | 결정 |
|---|---|
| 범위 | **전부 FSD.** Worker API, 빌드 파이프라인, 스크립트용 lib 까지 레이어 안에 둔다 |
| 강제 수단 | **Steiger**(FSD 공식 린터) |
| 한 곳에서만 쓰는 코드 | **pages 우선.** Steiger 기본 규칙(`insignificant-slice` 포함)을 그대로 쓴다. 한 페이지에서만 쓰면 그 페이지 안에, 두 곳 이상에서 쓰면 아래 레이어로 내린다 |
| 손으로 쓴 CSS | **슬라이스 옆.** 불러오는 방식은 지금처럼 app 의 CSS 진입 파일 하나가 `@import` 한다 |

## 4. 소스로 확인한 사실

- **TanStack Start**(`@tanstack/react-start` 1.169, `start-plugin-core` 1.171)
  - 플러그인 옵션에 `router.routesDirectory`, `router.generatedRouteTree`, `router.entry`, `client.entry`, `server.entry`, `srcDirectory` 가 있다. 그래서 `src/routes` 도 옮길 수 있다.
- **TanStack Start import 보호**(기본 켜짐)
  - 클라이언트 환경에서 `**/*.server.*` 파일과 `@tanstack/react-start/server` import 를 막는다.
  - `importProtection.client.files` 로 패턴을 바꿀 수 있다. 사용자 값이 기본값을 대체하므로 기본 패턴도 같이 적어야 한다.
- **Steiger 0.7.0 + `@feature-sliced/steiger-plugin` 0.8.0**
  - 파일 이름의 첫 조각이 `index` 이면 공개 API 로 본다. 그래서 `index.server.ts`, `index.build.ts` 도 공개 API 다.
  - 같은 레이어 안의 import 와 같은 슬라이스 안의 import 는 공개 API 검사에서 빠진다.
  - `insignificant-slice`
    - 다른 슬라이스 하나에서만 참조되는 슬라이스를 문제 삼는다.
    - app 에서만 참조되는 슬라이스는 문제 삼지 않는다.
    - pages 레이어는 검사하지 않는다.
  - `segments-by-purpose` 는 세그먼트 이름으로 다음을 금지한다: `components`, `hooks`, `utils`, `helpers`, `types`, `constants`, `handlers`, `schemas`, `assets`, `services`, `providers`, `store(s)` 등.
  - `no-reserved-folder-names` 는 세그먼트 안에 `ui`·`api`·`lib`·`model`·`config` 이름의 폴더를 두지 못하게 한다.
  - `shared-lib-grouping` 은 `shared/lib` 아래 모듈이 15개를 넘으면 경고한다.
  - `no-wildcard-exports` 가 있다.
  - Node 22.18 이상이 필요하다(우리는 26).
- **wrangler** `main` 은 지금 `./src/server.ts` 다.
- **글은 지금 0편이다**(`content/posts` 가 비어 있다).

## 5. 레이어와 공개 API 규칙

### 레이어

위에서 아래로만 import 한다.

```
app → pages → widgets → features → entities → shared
```

- 같은 레이어의 다른 슬라이스는 import 하지 않는다. `@x` 교차 import 도 쓰지 않는다.
- `app` 과 `shared` 는 슬라이스 없이 세그먼트로만 나눈다.

### 공개 API — 슬라이스 밖에서는 이 파일로만 들어간다

| 파일 | 누가 부르나 | 담는 것 |
|---|---|---|
| `index.ts` | 브라우저와 서버 모두 | 컴포넌트, 타입, 순수 함수, `createServerFn` 함수 |
| `index.server.ts` | Worker 만 | D1, 시크릿, `jose`, Access 를 쓰는 것 |
| `index.build.ts` | `content-collections.ts` 만 | 렌더 파이프라인처럼 `node:fs`·unified 를 쓰는 빌드 코드 |
| `index.scripts.ts` | `scripts/*` 만(Node 가 바로 실행) | 원문 검사처럼 가벼운 Node 코드 |

- `shared` 는 세그먼트마다 `index.ts` 를 둔다. `shared/lib` 는 모듈 폴더마다 둔다(`shared/lib/date/index.ts`).
- 공개 API 는 이름을 하나씩 적어 재수출한다. `export *` 는 쓰지 않는다.
- 테스트 도우미를 슬라이스 밖 테스트에 내줘야 하면 `index.testing.ts` 로 낸다. vitest 의 `*.test.ts` 패턴에 걸리지 않는 이름이다.

### 서버 전용 코드의 이름

- **브라우저 코드와 같은 슬라이스에 있는 Worker 전용 파일은 `*.server.ts` 로 끝난다.**
  - 대상은 D1, 시크릿, `jose`, Access 를 쓰는 파일이다.
  - 같은 슬라이스의 ui 가 실수로 import 해도 import 보호가 빌드를 막는다.
- **서버만 사는 폴더(`app/server`)는 이름에 접미사를 붙이지 않는다.**
  - 대신 import 보호의 `client.files` 에 `**/*.server.*` 와 `**/src/app/server/**` 를 같이 넣어 폴더째 막는다.

### 경로

- 슬라이스 안에서는 상대 경로를 쓰고, 슬라이스 밖은 `~/레이어/슬라이스` 로 쓴다(`~/*` 별칭은 그대로).
- **Node 쪽 소비자는 저마다 필요한 것만 담은 공개 API 로 들어온다.** 큰 공개 API 하나로 몰지 않는다. Node 는 재수출된 모듈을 전부 먼저 읽기 때문이다.

  | 소비자 | 들어오는 곳 |
  |---|---|
  | `vite.config.ts` | `app/build/prerender.ts`, `shared/og/index.ts` |
  | `content-collections.ts` | `entities/post/index.build.ts`, `features/embeds/index.build.ts`, `shared/og`, `shared/config`, `shared/lib/date` |
  | `scripts/*` | `entities/post/index.scripts.ts`, `shared/tooling`, `shared/lib/security-headers` |

- `vite.config.ts` 와 `scripts/*` 가 닿는 모듈에는 지금 규칙이 그대로 적용된다.
  - 상대 경로에 `.ts` 확장자를 붙인다.
  - `~` 별칭과 paraglide 생성물은 `import type` 으로만 쓴다.
  - 이유는 셋이다. 설정 로더와 Node 는 별칭을 읽지 못한다. `src/paraglide` 는 gitignore 된 생성물이다. CI 는 `i18n:compile` 보다 먼저 `scripts/audit.ts` 를 불러온다.

### 파일 이름

- 옮기면서 파일 이름은 바꾸지 않는다(`CommentForm.tsx`, `useActiveHeading.ts` 그대로).
- 바꾸는 경우는 두 가지뿐이다.
  - `*.server.ts` 접미사를 붙이는 경우
  - 아래 배치표에서 새 이름을 준 경우

### 라우트와 pages

- `app/routes/*` 의 라우트 파일은 `createFileRoute` 의 `loader`·`head`·`component` 연결만 한다.
- 화면 본문은 `pages/<page>/ui/<Name>Page.tsx` 로 옮긴다.
- 라우트 컴포넌트는 `Route.useLoaderData()` 결과를 props 로 넘긴다. pages 는 라우터 파일을 import 하지 않는다.

## 6. 파일 배치표

`←` 오른쪽이 지금 위치다. 테스트 파일(`*.test.ts(x)`)은 대상 파일을 따라간다.

```
src/
├ app/
│  ├ routes/**                         ← routes/** (이름 그대로)
│  ├ routeTree.gen.ts                  ← routeTree.gen.ts
│  ├ router.tsx                        ← router.tsx
│  ├ client.tsx                        ← client.tsx
│  ├ server/                           Worker 진입과 API 조립 (app 에서만 쓰는 서버 코드)
│  │  ├ worker.ts                      ← server.ts (wrangler main, server.entry 둘 다 이 파일)
│  │  ├ markdown-negotiation.ts        ← lib/markdown-negotiation.ts
│  │  ├ url-guard.ts                   ← lib/url-guard.ts
│  │  ├ api-router.ts                  ← api/router.ts (ROUTES·routeApi. ApiContext 타입은 shared/api 로)
│  │  ├ api-context.ts                 ← api/context.ts
│  │  ├ access.ts                      ← api/access.ts
│  │  └ cleanup.ts                     ← api/cleanup.ts
│  ├ seo/                              라우트에서만 쓰는 SEO·GEO 산출물
│  │  └ head·json-ld·text·url·robots·rss·sitemap·llms.ts   ← seo/*
│  │                                   (localizePath 는 ~/entities/post 에서 가져온다)
│  ├ build/
│  │  └ prerender.ts                   ← lib/prerender.ts (vite.config 가 부름)
│  └ styles/
│     ├ app.css                        ← styles/app.css (진입. 슬라이스 CSS 를 @import)
│     ├ fonts.css · tokens.css         ← styles/fonts.css · tokens.css
│     └ base.css                       ← layout.css 의 전역 규칙(html·body·a·main·.display·.meta-list·.section-title)
├ pages/
│  ├ home/      ui/HomePage.tsx(← routes/index.tsx 의 컴포넌트), ui/home.css(.lobby-*)
│  ├ posts/     ui/PostsPage.tsx, ui/TagFilter.tsx(← components), lib/tag-filter.ts(← lib),
│  │            ui/posts.css(.posts·.post-year·.tag-filter)
│  ├ post/      ui/PostPage.tsx, ui/Toc.tsx(← components), lib/active-heading.ts(← lib),
│  │            lib/useActiveHeading.ts(← hooks), ui/post.css(prose.css 의 .post-header·.post-meta·.post-tags·.post-aside·.toc*)
│  └ not-found/ ui/NotFound.tsx(← components), ui/not-found.css(.not-found)
├ widgets/
│  └ site-layout/  ui/Layout.tsx, ui/LanguageMenu.tsx(← components),
│                  ui/layout.css(.site·.site-header·.site-name·.site-nav·.site-footer·.site-socials),
│                  ui/language-menu.css(← styles)
├ features/
│  ├ comment/      ui/CommentSection·CommentForm·CommentItem·Turnstile.tsx(← components/comments),
│  │               ui/comment.css(← styles/comments.css),
│  │               model/comment-input.ts(← api),            화면과 서버가 같이 쓰는 입력 규칙
│  │               lib/comment-errors.ts(← lib),
│  │               lib/password.server.ts(← api/password.ts),
│  │               api/comments.server.ts(← api/comments.ts, handleMe 포함),
│  │               api/comments-repo.server.ts(← api/comments-repo.ts)
│  ├ view-count/   ui/ViewCounts.tsx(← components), ui/view-count.css(.view-count-number),
│  │               lib/view-target.ts · lib/min-delay.ts(← lib),
│  │               api/views.server.ts(← api/views.ts)
│  ├ term-tooltip/ ui/TermTooltips.tsx(← components), ui/term-tooltip.css(.term-tooltip),
│  │               lib/tooltip-position.ts(← lib)
│  └ embeds/       글 속 위젯 (지금 src/widgets. FSD widgets 레이어와 이름이 겹쳐서 옮긴다)
│                  ui/WidgetMounter.tsx(← components), ui/counter-demo.tsx(← widgets),
│                  ui/counter-demo.css(.widget-counter), model/registry.ts, config/names.ts(← widgets)
├ entities/
│  └ post/         ui/PostList.tsx(← components), ui/post-list.css(.post-list·.post-item*),
│                  ui/prose.css(.prose), ui/draft-badge.css(← styles/badge.css),
│                  model/post-index.ts · post-queries.ts(← content),
│                  api/posts.functions.ts · posts.server.ts(← content),
│                  markdown/*(← markdown/* 전부. link.ts 도 그대로 여기),
│                  source/ fingerprint·slug·source-hash·resolve-en-post·rehash·
│                          translation-structure·content-checks.ts(← content/*)
└ shared/
   ├ config/   site.ts(← site.ts), content.ts(← content/constants.ts)
   ├ i18n/     messages.ts · runtime.ts(← i18n), compiled-runtime.test.ts(← i18n),
   │           url.ts(← lib/url.ts), language-options.ts(← lib)
   ├ api/      types.ts(← api/types.ts), client.ts(← lib/api-client.ts),
   │           api-context.ts(← api/router.ts 의 ApiContext 타입),
   │           http.server.ts(← api/http.ts), attempts.server.ts(← api/attempts.ts),
   │           turnstile.server.ts(← api/turnstile.ts. ApiContext 가 TurnstileOutcome 타입을 써서 같이 둔다),
   │           test-utils.ts(← api/test-utils.ts), schema.test.ts(← api)
   ├ og/       card.ts · render.ts · site-plugin.ts(← og/*)   글 카드와 사이트 카드. post 엔티티에 기대지 않는다
   ├ lib/      date/(← content/date.ts), crypto/(← api/crypto.ts), security-headers/(← lib/security-headers.ts)
   └ tooling/  audit.ts · smoke.ts · indexnow.ts(← lib)   scripts/* 만 부른다
```

`src/paraglide/`(생성물)는 그대로 두고 Steiger 검사에서 뺀다.

### 공개 API 내용

배치에서 바로 나오지 않는 것만 적는다.

- **`entities/post`**
  - `index.ts`: `PostList`, 글 타입(`PostMeta`, `TagRef`, `PostPage`, `LobbyIntro`, `TocItem`, `Glossary`·`GlossaryEntry`), `groupByYear`, `collectTags`, `localizePath`, `listPostsFn`·`getPostFn`·`getLobbyIntroFn`
  - `index.server.ts`: `postIndex`, `queries`
  - `index.build.ts`(`content-collections.ts` 용): `renderMarkdown`, `writeAssets`, 에이전트용 Markdown 함수, `folderFingerprint`, `validateSlug`·`sameDayConflicts`, `computeSourceHash`, `resolveEnPost`
  - `index.scripts.ts`(`scripts/*` 용): `content-checks`·`rehash`·`source-hash`·`translation-structure` 의 함수. 렌더 파이프라인은 닿지 않는다
- **`shared/og/index.ts`**: `postCard`, `siteCard`, `writeOgImage` 등과 `ogSitePlugin`
- **`features/comment`**
  - `index.ts`: `CommentSection`
  - `index.server.ts`: `handleMe`, `handleListComments`, `handleCreateComment`, `handleEditComment`, `handleDeleteComment`
- **`features/view-count`**
  - `index.ts`: `ViewCountsProvider`, `useViewCounts`, `ViewCount`
  - `index.server.ts`: `handleRecordView`, `pruneViews`
- **`features/embeds`**
  - `index.ts`: `WidgetMounter`
  - `index.build.ts`: 위젯 이름 목록(`names.ts`). `content-collections.ts` 가 쓴다.
- **`shared/api`**
  - `index.ts`: DTO 타입과 `createApiClient`·`ApiResult`
  - `index.server.ts`: `ApiContext` 타입, http 도우미, 시도 제한, `verifyTurnstile`·`TurnstileOutcome`
  - `index.testing.ts`: `testContext`, `createTestDb`
- **`shared/tooling/index.ts`**: `scripts/*` 가 부르는 것 전부

## 7. Steiger

- 개발 의존성으로 `steiger@0.7.0` 과 `@feature-sliced/steiger-plugin@0.8.0` 을 정확한 버전으로 넣는다. 설정은 저장소 루트 `steiger.config.ts` 에 둔다.
  - 규칙 묶음은 `recommended` 를 쓴다.
  - `ignores` 는 `src/paraglide/**` 와 `src/app/routeTree.gen.ts` 두 개만 둔다.
- `package.json` 에 `"lint:fsd": "steiger ./src"` 를 추가한다.
- `audit:repo` 가 Steiger 를 돌린다.
  - 오류 규칙 위반은 FAIL, 경고 규칙 위반은 WARN 이다.
  - **리팩터링이 끝났을 때 진단은 0건**(오류·경고 모두)이어야 한다.
- 배치표대로 했는데 Steiger 가 진단을 내면, 구조를 고쳐서 없애는 게 먼저다.
  - 다른 결정과 부딪혀서 없앨 수 없으면 좁은 `ignores` 를 하나 더한다. 설정 파일에 이유를 주석으로 남기고 `AGENTS.md` 에도 적는다.
  - 규칙을 통째로 끄지는 않는다.

## 8. 바뀌는 설정과 문서

**설정 파일**

| 파일 | 바뀌는 것 |
|---|---|
| `vite.config.ts` | `tanstackStart` 의 `router.routesDirectory`, `router.generatedRouteTree`, `router.entry`, `client.entry`, `server.entry`, `importProtection.client.files`. prerender·OG import 경로. **`srcDirectory` 는 `src` 그대로 둔다**(아래 참고) |
| `wrangler.jsonc` | `main` → `./src/app/server/worker.ts` |
| `worker-configuration.d.ts` | `pnpm cf-typegen` 으로 다시 만든다. `mainModule` 이 `./src/server` 로 박혀 있어서 그대로 두면 `audit:repo` 의 `wrangler types --check` 가 FAIL 이다 |
| `content-collections.ts` | import 를 5장 표의 공개 API 로 바꾼다 |
| `scripts/*.ts` | import 를 5장 표의 공개 API 로 바꾼다. `smoke.ts` 의 `security-headers` 직접 import 도 포함 |
| `scripts/fonts/build_suit.py` | `CSS_PATH` → `src/app/styles/fonts.css` |
| `vitest.config.ts` | 커버리지 `include`·`exclude` 를 새 경로로 바꾼다 |

- **`srcDirectory` 를 바꾸면 안 되는 이유**
  - import 보호는 `srcDirectory` 안에 있는 파일이 하는 import 만 검사한다.
  - `src/app` 으로 좁히면 슬라이스 전체가 소리 없이 보호 밖으로 빠진다.
- `vitest.config.ts` 의 커버리지 범위
  - 지금 커버리지에 들어가는 파일은 옮긴 뒤에도 전부 들어간다.
  - 지금 빠진 파일은 계속 빠져도 된다: 컴포넌트 `.tsx`, 라우트, `i18n`, `site.ts`, `server.ts`, `hooks`, `context.ts`·`types.ts`·`test-utils.ts`·`posts.server.ts`·`posts.functions.ts`.

**문서**

- `AGENTS.md`
  - 경로를 모두 고친다.
  - "FSD 구조" 절을 새로 쓴다: 레이어, 공개 API 세 종류, `.server.ts` 규칙, pages 우선 규칙, `pnpm lint:fsd`.
  - CSS 규칙을 "그 슬라이스 `ui` 옆에 두고 `app/styles/app.css` 에서 `@import`" 로 바꾼다.
- `.claude/commands/audit.md`, `docs/writing/style-guide.md`(위젯 이름 경로)도 경로를 고친다.
- 지난 스펙과 계획서(`docs/superpowers/specs|plans/2026-10-20-blog-foundation-*`)는 기록이라 고치지 않는다.

## 9. 검증 — 리팩터링 전후가 같다는 증거

리팩터링을 시작하기 전에 기준선을 남기고, 끝난 뒤에 같은 방법으로 다시 떠서 비교한다.

### 임시 글

글이 0편이라 글 페이지를 확인할 수 없다. 그래서 검증할 때만 임시 글을 하나 둔다.
- `content/posts/<YYMMDD>-sample/` 에 ko·en 두 벌을 둔다.
- 안에 콜아웃·용어·위젯·코드·이미지·See Also 를 넣는다.
- 기준선과 최종 검증에 **같은 파일**을 쓴다.
- 커밋하지 않고, 끝나면 지운다.

### 비교 항목

1. **빌드 산출물**
   - `pnpm build` 결과에서 아래 파일을 바이트 단위로 비교한다.
     - 프리렌더 HTML
     - `robots.txt`, `sitemap.xml`, `rss.xml`(ko·en), `llms*.txt`
     - 글별 `.md`, `_headers`, OG 이미지
   - JS·CSS 파일 이름의 해시는 정규화한다. 차이가 나면 원인을 설명할 수 있어야 한다.
2. **화면 스타일**
   - CSS 를 나눠도 캐스케이드 순서가 바뀌면 안 된다.
   - dev 서버에서 페이지의 모든 요소의 계산된 스타일(`getComputedStyle`)을 덤프해 전후를 비교한다.
     - 페이지: 홈, 글 목록(태그 필터 포함), 임시 글, 404 를 ko·en 으로
     - 폭: 데스크톱과 모바일 두 가지
   - 차이는 0이어야 한다.
3. **클라이언트 번들**
   - 클라이언트 JS 합(gzip)이 기준선보다 1KB 넘게 늘면 원인을 찾는다.
   - 서버 코드가 번들에 없다는 건 import 보호가 켜진 상태로 빌드가 성공하는 것으로 확인한다.
   - 보호가 실제로 도는지도 한 번 확인한다.
     - 브라우저 쪽 파일 두 곳에 일부러 위반 import 를 넣는다: `features/comment/ui` 의 컴포넌트가 `comments-repo.server.ts` 를, 라우트 파일이 `app/server/access.ts` 를 import 하게 한다.
     - `pnpm build` 가 실패하는지 보고 되돌린다. 커밋하지 않는다.
4. **기존 게이트** — 모두 통과해야 한다.
   - `pnpm check`
   - `pnpm test`(커버리지 기준 그대로)
   - `pnpm audit:repo --build`(스모크 포함)
   - `pnpm lint:fsd` 진단 0건
5. **배포 뒤**
   - `pnpm smoke https://nabichan.me`
   - `pnpm audit:repo --live`

## 10. 진행 방식 (이로하의 판단)

- **아래에서 위로 옮긴다.**
  - 순서: shared → entities → features → widgets → pages → app(라우트·엔트리·설정) → CSS 나누기 → 문서 → Steiger 게이트
  - 커밋마다 `pnpm check`·`pnpm test`·`pnpm audit:repo` 가 통과해야 한다.
- **파일은 `git mv` 로 옮긴다.** 이력이 이어지게 하려는 것이다.
- **Steiger 는 처음부터 넣어 둔다.** 다만 마지막 단계 전까지는 보고만 하고, 마지막 단계에서 `audit:repo` FAIL 게이트로 켠다.
- **중간 커밋은 push 하지 않는다.** main 에 직접 커밋하되, 전체 검증이 끝난 뒤 한 번만 push 해서 배포를 한 번만 일으킨다. push 전에 은솔에게 확인받는다.
- **서버 함수 주소가 바뀌는 건 받아들인다.**
  - TanStack 은 서버 함수 ID 를 "파일 경로 + 함수 이름"으로 만든다. 그래서 `posts.functions.ts` 를 옮기면 `/_serverFn/<id>` 가 바뀐다.
  - 배포 전에 열어 둔 탭은 새로고침할 때까지 화면 이동에 실패할 수 있다.
  - 이건 JS 청크 해시가 바뀌는 평소 배포에서도 똑같이 생기는 일이다. 공개 URL 을 바꾸는 것도 아니라서, `generateFunctionId` 로 예전 ID 를 고정하지 않는다.
- **리뷰 뒤에 바뀐 배치**
  - OG 를 `entities/post` 대신 `shared/og` 에 둔다. 사이트 카드도 같이 만들고 post 엔티티에 기대지 않는다. 그리고 `vite.config.ts` 가 가벼운 공개 API 로 불러야 한다.
  - `localizePath` 는 옮기지 않고 `link.ts` 에 둔다. 옮기면 Node 쪽 경로가 paraglide 생성물을 값으로 끌어오게 된다. `app/seo` 는 이 함수를 `~/entities/post` 에서 가져온다.
  - `turnstile.ts` 는 `app/server` 대신 `shared/api` 로 간다. `ApiContext` 타입이 `TurnstileOutcome` 을 쓰기 때문이다.

## 11. 빌더에게 맡기는 것

- 각 공개 API 의 정확한 export 목록. 실제 import 를 보고 정한다.
- CSS 규칙 블록을 어느 파일로 나눌지의 세부. 9-2 검증이 기준이다.
- TanStack Start 엔트리 옵션 값의 정확한 형태. 상대 경로 기준이 `srcDirectory` 인지 등은 실제로 돌려서 확인한다.
- 기준선을 뜨는 스크립트와 비교 스크립트. `temp.local/fsd-refactor/` 에 두고 커밋하지 않는다.
