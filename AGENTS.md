# AGENTS.md

eunsol(Nabi)의 개인 블로그 `nabichan.me` 저장소다. 사람과 에이전트가 같이 읽는 작업 규칙을 모았다. 설계의 근거는 `docs/superpowers/specs/2026-10-20-blog-foundation-design.md` 에 있다.

## 스택 한눈에

- TanStack Start + Cloudflare Workers(`@cloudflare/vite-plugin` ^1). 글·목록 페이지는 빌드할 때 프리렌더한다.
- 글은 Content Collections 가 Markdown 을 빌드 시점에 HTML 로 만든다(`content-collections.ts`, `src/markdown/`). 글 데이터는 서버 전용이다.
- 다국어는 Paraglide JS. 한국어가 기본(접두사 없음), 영어는 `/en/...` 이다. 언어는 URL 로만 정한다.
- 댓글·조회수는 D1 + Worker API(`src/api/`). 은솔 구분은 Cloudflare Access, 스팸은 Turnstile 이다.
- SEO·GEO 산출물(sitemap, robots, RSS, llms, `.md` 원문, OG 이미지)도 빌드할 때 만든다.

## 로컬 준비

```sh
pnpm install
cp .dev.vars.example .dev.vars   # Turnstile 테스트 키, dev 용 시크릿, DEV_OWNER
pnpm db:migrate:local            # 로컬 D1 에 마이그레이션 적용
pnpm dev                         # http://localhost:3000
```

`.dev.vars` 의 `DEV_OWNER=1` 이면 dev 에서 은솔로 동작한다(배지 댓글, 모든 댓글 수정·삭제). 프로덕션 빌드에서는 읽지 않는다.

## 명령

| 명령 | 하는 일 |
|---|---|
| `pnpm check` | Paraglide 컴파일 + Content Collections 빌드 + 타입 검사 |
| `pnpm test` | vitest + 커버리지(함수 100%, 줄 90%) |
| `pnpm audit:repo` | 저장소 점검(아래). `--build`, `--live [--base-url <url>]` |
| `pnpm content:check [--post <slug>]` | 글 검사: 번역 구조, 빠진 태그·용어, 깨진 내부 링크, 낡은 번역. 볼드 깨짐·맞춤법은 경고만 |
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
- **ko 원문의 본문·제목·설명을 고치면 push 전에 둘 중 하나를 한다.** 하지 않으면 낡은 번역으로 빌드와 배포가 막힌다.
  - 번역에 영향이 있으면 `/translate-post <slug>`
  - 오타처럼 영향이 없으면 `pnpm content:rehash --post <slug>`
- **마이그레이션은 추가만 한다.** 이미 커밋한 `migrations/*.sql` 은 고치지 않는다. CI 가 마이그레이션을 먼저 적용하고 배포하므로, 그 사이에는 이전 코드가 새 스키마 위에서 돈다.
- 커맨드(`/write-post` 등)는 커밋하지 않는다. 바꾼 파일을 보여 주고 은솔이 확인한 뒤 커밋한다.

## 영역별 주의

### Markdown 파이프라인 (`src/markdown/`, `content-collections.ts`)

- 원본 HTML 태그는 허용하지 않는다(`allowDangerousHtml` 금지). 모르는 컨테이너 디렉티브는 빌드 오류다.
- 렌더 결과의 모양이나 플러그인 동작을 바꾸면 `content-collections.ts` 의 `RENDER_VERSION` 을 올린다. 렌더 캐시가 예전 결과를 내지 않게 한다.
- OG 카드 디자인을 바꾸면 `src/og/render.ts` 의 `OG_VERSION` 을 올린다.
- 글 옆 이미지는 글 폴더에 둔다. 한글·공백 파일 이름도 되지만 `.md` 원문에서 절대 URL 로 바꾸지 못하면 빌드가 멈춘다.

### 다국어 (`src/i18n/`, `project.inlang/paraglide.config.ts`)

- Paraglide 설정(전략·URL 패턴)은 `project.inlang/paraglide.config.ts` 한 곳에만 둔다. CLI(`pnpm check`·`pnpm test`)와 vite 플러그인이 같이 읽는다. vite 설정에 옵션을 따로 두면 CLI 가 기본값으로 런타임을 덮어써서 dev 의 `/en` 이 깨진다.
- 서버 함수에는 언어를 항상 입력으로 넘긴다. 서버 함수 URL 에는 언어 접두사가 없다.
- 새 UI 문구는 `messages/ko.json`, `messages/en.json` 에 같은 키로 넣는다(`audit:repo` 가 키를 대조한다).

### 댓글·조회수 API (`src/api/`)

- 쓰기 요청은 같은 Origin 과 `application/json` 만 받는다.
- 은솔 판정(Access JWT)은 실패하면 닫힌다. 설정값이 비었거나 검증이 실패하면 은솔이 아니다.
- 비밀번호 해시(PBKDF2) 전에 Turnstile 과 시도 제한을 먼저 통과해야 한다. CPU 를 태우지 못하게 하려는 순서다.
- 바인딩·시크릿은 `fetch`·`scheduled` 인자의 `env` 로 읽는다. 모듈 최상단에서 읽지 않는다.
- 새 변수·시크릿을 만들면 `.dev.vars.example` 에도 넣고 `pnpm cf-typegen` 을 돌린다.

### 프리렌더·산출물

- `/api/*`, `/admin` 은 프리렌더하지 않는다. 정적 에셋이 Worker 보다 먼저 응답하므로, 프리렌더되면 Worker 코드가 실행되지 않는다.
- 크롤러는 `<a href>` 만 따라간다. SEO 산출물과 글별 `.md` 는 `src/lib/prerender.ts` 의 목록으로 넣는다.
- `vite.config.ts` 가 불러오는 모듈(`src/lib/prerender.ts`, `src/og/*`)과 Node 로 바로 실행하는 스크립트가 불러오는 lib 은 `~/` 별칭 대신 상대 경로(`.ts` 확장자 포함)로 import 한다. 설정 로더와 Node 는 별칭을 읽지 못한다.

### CSS (`src/styles/`)

- 새 수제 CSS 는 큰 전역 파일 꼬리에 붙이지 않는다. `src/styles/` 에 별도 파일로 두고 `app.css` 에서 import 한다.
- 배포 확인은 배포된 CSS 파일을 직접 받아 본다.
- 무채색, 굵기는 400·700 만 쓴다.

## 예산

`src/lib/audit.ts` 의 `BUDGETS` 와 이 표를 같이 고친다.

| 항목 | 예산 | 측정(2026-10-20) |
|---|---|---|
| 클라이언트 JS (gzip 합) | 170KB | 128.9KB |
| Worker (압축 전, 소스맵 제외) | 64 MiB | 1.76MB |

## 글 쓰기

- 커맨드: `/write-post`, `/refine-post`, `/translate-post`, `/audit` (`.claude/commands/`)
- 문체: `docs/writing/style-guide.md`
- 글 폴더: `content/posts/<YYMMDD(-kebab)?>/index.ko.md` (+ `index.en.md`, 글 옆 이미지). `YYMMDD` 는 frontmatter `date`(KST)와 같고, 하루에 한 편만 쓴다.
- 태그 표시 이름은 `content/tags.yaml`, 용어는 `content/glossary.yaml` 에 ko/en 으로 둔다.
