# AGENTS.md

eunsol(Nabi)의 개인 블로그 `nabichan.me` 저장소다. 사람과 에이전트가 같이 읽는 작업 규칙을 모았다. 설계의 근거는 `docs/superpowers/specs/2026-10-20-blog-foundation-design.md` 에 있다.

## 스택 한눈에

- TanStack Start + Cloudflare Workers(`@cloudflare/vite-plugin` ^1). 글·목록 페이지는 빌드할 때 프리렌더한다.
- 글은 Content Collections 가 Markdown 을 빌드 시점에 HTML 로 만든다(`content-collections.ts`, `src/entities/post/markdown/`). 글 데이터는 서버 전용이다.
- 다국어는 Paraglide JS. 한국어가 기본(접두사 없음), 영어는 `/en/...` 이다. 언어는 URL 로만 정한다.
- 댓글·조회수는 D1 + Worker API(`src/features/{comment,view-count}`, `src/app/server/`). 은솔 구분은 Cloudflare Access, 스팸은 Turnstile 이다.
- SEO·GEO 산출물(sitemap, robots, RSS, llms, `.md` 원문, OG 이미지)도 빌드할 때 만든다.
- 코드는 FSD(Feature-Sliced Design) 레이어로 나누고 Steiger 로 검사한다(아래 "FSD 구조").

## FSD 구조

`src` 를 레이어로 나눈다. 설계는 `docs/superpowers/specs/2026-10-20-fsd-refactor-design.md` 에 있다.

| 레이어 | 두는 것 |
|---|---|
| `app` | 라우트(`routes`), 엔트리(`router.tsx`·`client.tsx`), Worker 진입과 API 조립(`server`), SEO 산출물(`seo`), 프리렌더 목록(`build`), 전역 CSS(`styles`) |
| `pages` | 화면(`home`·`posts`·`post`·`not-found`). 한 화면에서만 쓰는 코드(카테고리 필터, 목차 등)도 여기 |
| `widgets` | 여러 화면이 같이 쓰는 큰 블록(`site-layout`) |
| `features` | 사용자 동작(`comment`·`view-count`·`term-tooltip`·`embeds`). 화면과 그 API 처리·D1 쿼리가 같이 산다 |
| `entities` | 글(`post`): 모델, 서버 함수, Markdown 렌더 파이프라인, 원문 검사 |
| `shared` | `config`·`i18n`·`api`·`lib`·`og`·`tooling` |

- import 는 위에서 아래로만 한다(`app → pages → widgets → features → entities → shared`). 같은 레이어의 다른 슬라이스는 import 하지 않는다.
- 한 곳에서만 쓰는 코드는 쓰는 페이지 안에 둔다. 두 곳 이상에서 쓰게 되면 아래 레이어로 내린다(Steiger `insignificant-slice` 가 본다).
- 슬라이스 밖에서는 공개 API 로만 들어온다. 이름을 하나씩 적어 재수출하고 `export *` 는 쓰지 않는다. `shared` 는 세그먼트마다(`shared/lib` 는 모듈 폴더마다) `index.ts` 를 둔다.

  | 공개 API | 누가 부르나 |
  |---|---|
  | `index.ts` | 화면과 서버 |
  | `index.server.ts` | Worker 만(D1·시크릿·`jose`·Access) |
  | `index.build.ts` | `content-collections.ts` 만 |
  | `index.scripts.ts` | `scripts/*` 만 |
  | `index.testing.ts` | 다른 슬라이스의 테스트 |

- Worker 전용 파일은 `*.server.ts` 로 끝낸다. 브라우저 번들이 import 하면 TanStack Start import 보호가 빌드를 멈춘다. `app/server` 는 폴더째 막는다(`vite.config.ts` 의 `importProtection`). `tanstackStart` 의 `srcDirectory` 는 바꾸지 않는다. 바꾸면 슬라이스가 보호 밖으로 빠진다.
- Node 쪽 소비자는 저마다의 공개 API 로 들어온다. 이 경로의 모듈은 상대 경로에 `.ts` 를 붙여 import 하고, `~` 별칭과 Paraglide 생성물은 `import type` 으로만 쓴다. 설정 로더와 Node 는 별칭을 읽지 못하고, CI 는 `i18n:compile` 보다 먼저 `scripts/audit.ts` 를 불러온다.

  | 소비자 | 들어오는 곳 |
  |---|---|
  | `vite.config.ts` | `src/app/build/prerender.ts`, `src/shared/og` |
  | `content-collections.ts` | `src/entities/post/index.build.ts`, `src/features/embeds/index.build.ts`, `src/shared/og`, `src/shared/config`, `src/shared/lib/date` |
  | `scripts/*` | `src/entities/post/index.scripts.ts`, `src/shared/tooling`, `src/shared/lib/security-headers` |

- 공개 API 를 바꾸면 `audit:repo --build` 의 클라이언트 JS 를 본다. 진입 청크만 쓰는 모듈을 지연 청크도 쓰는 공개 API 에 넣으면 Rolldown 이 공통 청크를 떼어 낸다(`language-options` 를 `shared/i18n` 에 넣었을 때 +1.5KB). 그래서 `language-options` 는 `shared/lib` 에 따로 있다.
- `pnpm lint:fsd` 가 구조를 검사하고 `audit:repo` 의 `fsd` 가 위반을 FAIL 로 낸다. 검사에서 빼는 건 `src/paraglide` 와 `src/app/routeTree.gen.ts` 두 개뿐이다(`steiger.config.ts`). 규칙을 끄지 않는다.

## 로컬 준비

```sh
pnpm install
cp .dev.vars.example .dev.vars   # Turnstile 테스트 키, dev 용 시크릿, DEV_OWNER
pnpm db:migrate:local            # 로컬 D1 에 마이그레이션 적용
pnpm dev                         # http://localhost:3000
```

`.dev.vars` 의 `DEV_OWNER=1` 이면 dev 에서 은솔로 동작한다(배지 댓글, 모든 댓글 수정·삭제). 프로덕션 빌드에서는 읽지 않는다.

`pnpm install` 의 `prepare` 가 `core.hooksPath` 를 `.githooks` 로 맞춘다. pnpm 은 바뀐 것이 없으면 `prepare` 를 건너뛰므로, 이미 설치한 클론에서는 `pnpm run prepare` 를 한 번 실행한다.

- `.githooks/pre-push`(`scripts/pre-push.ts`)는 main 으로 가는 push 에서 바뀐 글 중 `draft: true` 인 글이 있으면 push 를 막는다. 일부러 올릴 때는 `git push --no-verify` 를 쓴다.
- GitHub 에서 PR 을 머지하는 경로는 hook 이 돌지 않는다.

## 명령

| 명령 | 하는 일 |
|---|---|
| `pnpm check` | Paraglide 컴파일 + Content Collections 빌드 + 타입 검사 |
| `pnpm test` | vitest + 커버리지(함수 100%, 줄 90%) |
| `pnpm audit:repo` | 저장소 점검(아래). `--build`, `--live [--base-url <url>]` |
| `pnpm lint:fsd` | FSD 구조 검사(Steiger). `audit:repo` 도 돌린다 |
| `pnpm content:check [--post <slug>]` | 글 검사: 번역 구조, 빠진 카테고리·용어, 깨진 내부 링크, 낡은 번역. 볼드 깨짐·맞춤법은 경고만 |
| `pnpm content:rehash --post <slug>` | 번역에 영향 없는 ko 수정 뒤 en 의 `sourceHash` 만 갱신 |
| `pnpm build` / `pnpm preview` | 프로덕션 빌드 / workerd 로 미리보기(:4173) |
| `pnpm smoke <url>` | 주요 경로·산출물·메타 URL 200 확인 |
| `pnpm db:migrate:local` | 로컬 D1 마이그레이션 |
| `pnpm cf-typegen` | `worker-configuration.d.ts` 재생성(`.dev.vars.example` 기준) |
| `pnpm indexnow [--all] [--submit]` | 바뀐 글 IndexNow 알림. 기본은 미리보기만 |

## 검증 순서

1. `pnpm check`
2. `pnpm test`
3. `pnpm audit:repo`
4. 배포 전에는 `pnpm audit:repo --build` 를 **혼자 직렬로** 돌린다. 다른 빌드나 dev 서버와 같이 돌리지 않는다.
   `--build` 는 4173 포트에 preview 를 직접 띄우므로 떠 있는 `pnpm preview` 는 먼저 끈다(포트가 쓰이고 있으면 smoke 가 FAIL 로 멈춘다).

`audit:repo` 결과는 PASS / WARN / FAIL / INFO 로 나오고 `.audit-report.json` 에 남는다. FAIL 이 있으면 배포하지 않는다.

## 꼭 지킬 것

- **개발 서버가 떠 있을 때 빌드를 돌리지 않는다.** `.content-collections`, `src/paraglide`, `dist`, `public/og`, `public/content-assets` 를 서로 덮어쓴다. 빌드는 병렬 작업 전에 혼자 한 번만 돌린다.
- **ko 원문의 본문·제목·검색 제목(`seoTitle`)·설명·키워드(`keywords`)를 고치면 push 전에 둘 중 하나를 한다.** 하지 않으면 낡은 번역으로 빌드와 배포가 막힌다.
  - 번역에 영향이 있으면 `/translate-post <slug>`
  - 오타처럼 영향이 없으면 `pnpm content:rehash --post <slug>`
- **마이그레이션은 추가만 한다.** 이미 커밋한 `migrations/*.sql` 은 고치지 않는다. CI 가 마이그레이션을 먼저 적용하고 배포하므로, 그 사이에는 이전 코드가 새 스키마 위에서 돈다.
- 커맨드(`/write-post` 등)는 커밋하지 않는다. 바꾼 파일을 보여 주고 은솔이 확인한 뒤 커밋한다.

## 영역별 주의

### Markdown 파이프라인 (`src/entities/post/markdown/`, `content-collections.ts`)

- 원본 HTML 태그는 허용하지 않는다(`allowDangerousHtml` 금지). 모르는 컨테이너 디렉티브는 빌드 오류다.
- 렌더 결과의 모양이나 플러그인 동작을 바꾸면 `content-collections.ts` 의 `RENDER_VERSION` 을 올린다. 렌더 캐시가 예전 결과를 내지 않게 한다.
- OG 카드 디자인을 바꾸면 `src/shared/og/render.ts` 의 `OG_VERSION` 을 올린다.
- 글 옆 이미지는 글 폴더에 둔다. 한글·공백 파일 이름도 되지만 `.md` 원문에서 절대 URL 로 바꾸지 못하면 빌드가 멈춘다.

### 다국어 (`src/shared/i18n/`, `project.inlang/paraglide.config.ts`)

- Paraglide 설정(전략·URL 패턴)은 `project.inlang/paraglide.config.ts` 한 곳에만 둔다. CLI(`pnpm check`·`pnpm test`)와 vite 플러그인이 같이 읽는다. vite 설정에 옵션을 따로 두면 CLI 가 기본값으로 런타임을 덮어써서 dev 의 `/en` 이 깨진다.
- 서버 함수에는 언어를 항상 입력으로 넘긴다. 서버 함수 URL 에는 언어 접두사가 없다.
- 새 UI 문구는 `messages/ko.json`, `messages/en.json` 에 같은 키로 넣는다(`audit:repo` 가 키를 대조한다).

### 댓글·조회수 API (`src/features/*/api/`, `src/app/server/`, `src/shared/api/`)

- 쓰기 요청은 같은 Origin 과 `application/json` 만 받는다.
- 은솔 판정(Access JWT)은 실패하면 닫힌다. 설정값이 비었거나 검증이 실패하면 은솔이 아니다.
- 비밀번호 해시(PBKDF2) 전에 Turnstile 과 시도 제한을 먼저 통과해야 한다. CPU 를 태우지 못하게 하려는 순서다.
- 바인딩·시크릿은 `fetch`·`scheduled` 인자의 `env` 로 읽는다. 모듈 최상단에서 읽지 않는다.
- 새 변수·시크릿을 만들면 `.dev.vars.example` 에도 넣고 `pnpm cf-typegen` 을 돌린다.

### 프리렌더·산출물

- `/api/*`, `/admin` 은 프리렌더하지 않는다. 정적 에셋이 Worker 보다 먼저 응답하므로, 프리렌더되면 Worker 코드가 실행되지 않는다.
- 크롤러는 `<a href>` 만 따라간다. SEO 산출물과 글별 `.md` 는 `src/app/build/prerender.ts` 의 목록으로 넣는다.
- `vite.config.ts`·`scripts/*` 가 불러오는 모듈은 `~/` 별칭 대신 상대 경로(`.ts` 확장자 포함)로 import 한다(위 "FSD 구조"의 Node 쪽 소비자 표).

### CSS (`src/app/styles/`, 슬라이스의 `ui/*.css`)

- 전역(폰트·토큰·기본)은 `src/app/styles/`, 나머지는 그 CSS 를 쓰는 슬라이스의 `ui` 옆에 둔다. `src/app/styles/app.css` 가 모두 `@import` 한다.
- `app.css` 의 `@import` 순서가 캐스케이드 순서다. 새 파일은 쓰는 슬라이스 자리에 넣고, 같은 요소를 건드리는 규칙끼리 순서가 바뀌지 않게 한다.
- 배포 확인은 배포된 CSS 파일을 직접 받아 본다.
- 무채색, 굵기는 400·700 만 쓴다.
- 폰트 조각은 `src/app/styles/fonts/` 에 두고 `fonts.css` 가 상대 경로로 가리킨다. Vite 가 이름에 해시를 붙여 `/assets` 로 낸다. `scripts/fonts/build_suit.py` 가 만들고, 라틴 조각(123번)은 `__root.tsx` 가 `?url` 로 미리 받는다.
  - woff2 는 작아도 `data:` 로 인라인하지 않는다(`vite.config.ts` 의 `assetsInlineLimit`). CSP 의 `font-src 'self'` 가 `data:` 폰트를 막는다.

## 예산

`src/shared/tooling/audit.ts` 의 `BUDGETS` 와 이 표를 같이 고친다.

| 항목 | 예산 | 측정(2026-10-20) |
|---|---|---|
| 클라이언트 JS (gzip 합) | 170KB | 128.9KB |
| Worker (압축 전, 소스맵 제외) | 64 MiB | 1.76MB |

## 배포

- main 에 push 하면 GitHub Actions(`.github/workflows/deploy.yml`)가 배포한다. 수동 실행도 된다.
  - 순서: `pnpm audit:repo --build`(게이트) → 원격 D1 마이그레이션 → `wrangler deploy` → `pnpm smoke https://nabichan.me` → 바뀐 글 IndexNow
- 손으로 배포할 때는 `pnpm audit:repo --build && pnpm exec wrangler deploy` 처럼 **`&&` 로만** 잇는다. FAIL 이 있으면 배포하지 않는다.
- 시크릿은 값을 화면에 내지 않고 넣는다.

  | 이름 | 위치 | 넣는 법 |
  |---|---|---|
  | `TURNSTILE_SECRET_KEY` | Worker | `wrangler turnstile widget get <사이트 키> --json` 의 `secret` 을 바로 `wrangler secret put` 으로 넘긴다 |
  | `COMMENT_PEPPER` | Worker | `openssl rand -base64 32` 를 바로 넘긴다. **바꾸면 기존 댓글 비밀번호가 전부 틀리게 된다** |
  | `VIEW_SALT_SECRET` | Worker | 같은 방법. 바꾸면 그날 방문자를 다시 센다 |
  | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub | 은솔이 만들고 등록한다 |

- Access: 팀 `nabi-chan`, `/admin` 앱(이메일 OTP, 세션 24시간)
  - 허용 이메일을 바꾸면 `wrangler.jsonc` 의 `OWNER_EMAIL`(쉼표 목록)과 Access 정책을 같이 고친다.
  - 로그아웃해도 세션이 끝날 때까지 API 의 은솔 판정은 남는다(스펙 4.7).
- 리다이렉트(Single Redirect 규칙, 프록시 `AAAA 100::` 레코드)
  - `www.nabichan.me` → apex. 경로와 쿼리를 유지한다.
  - `nabi.kim`, `www.nabi.kim` → `https://nabichan.me/`. 경로를 버린다.
  - `nabi.kim` 의 MX·TXT 는 메일(`hello@nabi.kim`)용이라 건드리지 않는다.
- Workers 는 **무료 플랜**이다(2026-10-20 은솔 확인). 요청당 CPU 10ms, Worker 요청 하루 10만 건이 한도다.
- Markdown 협상: 홈(`/`, `/en`)과 글(`/<slug>`, `/en/<slug>`)은 Worker 가 먼저 받는다(`wrangler.jsonc` 의 `run_worker_first`).
  - `Accept` 에 `text/markdown` 을 직접 적고 HTML 보다 낮게 두지 않은 요청은 글의 `.md` 원문, 홈은 `llms.txt` 를 받는다. 나머지는 프리렌더 HTML 그대로다.
  - 응답에 `Vary: Accept` 와 `Content-Signal` 헤더가 붙는다. 판단은 `src/app/server/markdown-negotiation.ts`, 연결은 `src/app/server/worker.ts` 의 `negotiate`.
  - 글 경로 패턴은 첫 자리 숫자(`/0*`~`/9*`)로 잡는다. 패턴이 숫자 범위를 지원하지 않아서다.
- Content Signals 는 `src/shared/config/site.ts` 의 `contentSignal` 한 곳에서 정한다(검색·AI 답변 허용, 학습 거부). robots.txt 의 모든 그룹과 Markdown 응답 헤더에 같은 값이 들어간다.
- CSP 는 `src/shared/lib/security-headers/security-headers.ts` 에서만 고치고 `public/_headers` 를 다시 만든다(테스트가 둘이 같은지 본다). Cloudflare 가 끼워 넣는 Web Analytics 비콘을 허용해 두었다.
  - 이미지는 같은 출처와 `data:` 만 된다. 글에 외부 이미지 주소를 쓰면 `content:check` 가 문제로 잡는다.
  - 스모크와 `audit:repo --live` 가 정적 응답·Worker 응답·404 의 헤더 값을 lib 과 글자까지 비교한다.
- 정적 에셋 캐시도 같은 파일(`IMMUTABLE_ASSET_CACHE`)에서 정한다. `/assets/*`(이름에 해시가 붙는 JS·CSS·폰트)만 1년 `immutable` 이고, 나머지는 Workers 기본값(`max-age=0, must-revalidate`)이다.
  - 해시 없는 파일을 `public/assets/` 에 두지 않는다. 내용을 바꿔도 방문자 브라우저에서 1년 동안 바뀌지 않는다.
  - 스모크가 CSS·미리 받는 폰트의 `Cache-Control`, 그 폰트가 CSS 의 주소와 같은지, CSS 에 `data:` 폰트가 없는지를 본다.

### 첫 글 공개 때 한 번

계획 5 에서 글 0편으로 배포해서, 아래는 첫 공개 글이 main 에 들어간 뒤에 한다.

1. Actions 실행이 성공했고, IndexNow 가 그 글 주소를 보냈고, `pnpm smoke https://nabichan.me` 가 글 페이지 검사까지 통과하는지 본다.
2. 실제 Turnstile 로 댓글 작성·수정·삭제를 해 본다. 틀린 비밀번호는 403, 반복하면 429, 예약 이름은 거절, Access 로그인 상태의 댓글에는 배지가 붙는다.
3. Workers Logs 에서 댓글 작성(`POST /api/posts/<slug>/comments`)의 CPU 시간을 본다. 무료 플랜에서 10ms 를 넘거나 1102 오류가 나면 `PASSWORD_ITERATIONS`(지금 50,000)를 낮춘다. 해시에 횟수가 저장돼 있어 예전 댓글은 그대로 검증된다.
4. 같은 브라우저로 새로고침해도 글·오늘·전체 조회수가 하루 한 번만 오르는지 본다.
5. 확인용 행을 원격 D1 에서 지운다. 은솔이 남길 댓글이 있으면 먼저 묻는다.

## 글 쓰기

- 커맨드: `/write-post`, `/refine-post`, `/translate-post`, `/audit` (`.claude/commands/`)
- 문체: `docs/writing/style-guide.md`
- 글 폴더: `content/posts/<YYMMDD(-kebab)?>/index.ko.md` (+ `index.en.md`, 글 옆 이미지). `YYMMDD` 는 frontmatter `date`(KST)와 같고, 하루에 한 편만 쓴다.
- 카테고리 표시 이름은 `content/categories.yaml`, 용어는 `content/glossary.yaml` 에 ko/en 으로 둔다.
- frontmatter 의 `title`·`seoTitle`·`keywords`·`categories` 를 쓰는 기준은 `docs/writing/style-guide.md` 7절에 있다.
- 공개는 ko frontmatter 의 `draft` 를 `false` 로 바꿔서 한다. `draft: true` 인 글은 배포해도 프리렌더·sitemap·RSS 에서 빠져 사이트에 나오지 않는다.
