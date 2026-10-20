# 블로그 기반 계획 2: 댓글 · 조회수 (D1 · Turnstile · Access · Cron) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프리렌더된 글 페이지에서 브라우저가 Worker API 를 불러 댓글을 쓰고, 고치고, 지우고, 글별·전체 조회수를 보여 준다.
- 저장은 D1 이다.
- 스팸은 Turnstile 과 비밀번호 실패 시도 제한으로 막는다.
- 은솔 구분은 Cloudflare Access JWT 로 한다.

**Architecture:**
- `src/server.ts` 가 `/api/*` 와 `/admin` 을 TanStack 핸들러 **앞에서** 직접 받는다. 나머지 요청은 지금처럼 Paraglide 미들웨어와 TanStack 을 거친다.
- API 로직은 `src/api/` 의 순수 함수와 D1 함수로 나눈다.
  - 핸들러는 `ApiContext` 하나만 받는다. 이 안에 D1, 현재 시각, IP, 은솔 판정, Turnstile 검증, 시크릿이 들어 있다.
  - 테스트는 실제 D1(`getPlatformProxy({ persist: false })`)과 가짜 Turnstile·Access 로 돈다.
- 브라우저 쪽은 다음 둘로 나눈다.
  - `src/lib/api-client.ts`: fetch 래퍼
  - `src/components/`: 화면
  - 조회수는 Layout 에서 라우트 이동마다 한 번 센다. 댓글은 글 페이지에서 불러온다.
- `scheduled` 핸들러는 하루 한 번 지난 조회 중복 기록과 시도 제한 기록을 지운다.

**Tech Stack:** Cloudflare D1 (wrangler SQL 마이그레이션), WebCrypto (PBKDF2, HMAC, SHA-256), jose 6 (Access JWT), Cloudflare Turnstile (explicit render), wrangler `getPlatformProxy`, vitest 5

**Spec:** `docs/superpowers/specs/2026-10-20-blog-foundation-design.md`
- 이 계획은 스펙 7장 순서 4를 구현한다. 근거 절은 4.7, 4.8, 4.11(로컬·바인딩), 4.12, 6(로컬 검증의 댓글·Access·조회수)이다.
- 배포(원격 D1 생성, Access 앱, Turnstile 위젯, 시크릿, PBKDF2 실측)는 계획 5 에서 한다.

## Global Constraints

### 버전

| 대상 | 버전·조건 |
|---|---|
| `jose` | `^6.2.12` (새 의존성. Access JWT 검증 전용) |
| wrangler | 지금 쓰는 `^4.151.1`. `getPlatformProxy` 를 테스트에 쓴다 |
| 그 밖 | 계획 1 과 같다. Turnstile React 패키지는 쓰지 않고 explicit render 를 직접 붙인다 |

### 런타임

- Workers 무료 플랜 기준이다(요청당 CPU 10ms).
  - PBKDF2 반복 횟수 상한은 100,000 이다.
  - 반복 횟수 값은 해시 문자열에 같이 저장한다. 계획 5 에서 실측해 바꿔도 예전 댓글이 깨지지 않게 하기 위해서다.
- **비밀번호 해시(PBKDF2) 전에 Turnstile 과 시도 제한을 먼저 통과해야 한다.** 틀린 비밀번호를 계속 보내는 것만으로 CPU 를 태우지 못하게 하기 위해서다.
- 바인딩과 시크릿은 `fetch(request, env, ctx)`, `scheduled(controller, env, ctx)` 인자로만 읽는다. 모듈 최상단에서 `env` 를 읽지 않는다.
- 클라이언트 IP 는 `CF-Connecting-IP` 헤더를 직접 읽는다. TanStack `getRequestIP()` 는 이 헤더를 보지 않는다.
- 비교는 직접 만든 상수 시간 비교 함수로 한다. Node 의 `crypto.subtle` 에는 `timingSafeEqual` 이 없어서 테스트에서 쓸 수 없다.

### 데이터와 보안

- D1 은 ORM 없이 `migrations/*.sql` 로만 다룬다. 마이그레이션은 추가만 한다.
- 원본 IP, 평문 비밀번호, 되돌릴 수 있는 비밀번호는 저장하지 않는다.
- 쓰기 요청(POST·PATCH·DELETE)은 다음 두 조건을 모두 만족해야 받는다. 조회수 POST 도 마찬가지다.
  - `Origin` 이 요청 URL 의 origin 과 같다. 다르면 403 `forbidden_origin` 이다.
  - `Content-Type` 이 `application/json` 이다. 아니면 400 `invalid_input` 이다.
- **은솔 판정은 실패하면 닫힌다(fail closed).** Access 설정값 셋(`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `OWNER_EMAIL`) 중 하나라도 비었거나, 쿠키가 없거나, 검증 중 오류가 나면 은솔이 아니다.
- dev 은솔 스위치 `DEV_OWNER` 는 `import.meta.env.DEV` 가 참일 때만 읽는다. lib 함수는 이 값을 인자(`devOwner: boolean`)로 받고, `import.meta.env` 를 직접 읽지 않는다.
- API 오류 본문은 `{ "error": <ApiErrorCode> }` 다. 화면 문구는 클라이언트가 Paraglide 메시지로 바꾼다.
- 실패를 200 + 빈 값으로 덮지 않는다. D1 오류와 Turnstile 서버 장애는 `console.error('[api] ...', error)` 로 남기고 503 `unavailable` 을 돌려준다.

### 상태 코드 (스펙 4.7 표 + 이 계획에서 정한 것)

| 상황 | 코드 | `error` |
|---|---|---|
| 입력 검증 실패, JSON 아님, 16KB 초과 | 400 | `invalid_input` |
| Turnstile 실패 | 403 | `turnstile_failed` |
| 비밀번호 불일치, 남이 은솔 댓글을 고치려 함 | 403 | `wrong_password` |
| Origin 불일치 | 403 | `forbidden_origin` |
| 예약 이름 | 403 | `reserved_name` |
| 없는 글·댓글·API 경로 | 404 | `not_found` |
| 허용하지 않는 메서드 | 405 | `invalid_input` |
| 시도 초과 | 429 | `too_many_attempts` |
| D1 실패, siteverify 장애 | 503 | `unavailable` |
| 작성 성공 | 201 | `{ comment }` |
| 수정 성공 | 200 | `{ comment }` |
| 삭제 성공 | 204 | 본문 없음 |

### 테스트 규칙 (계획 1 규칙에 더한다)

- 커버리지 대상 디렉터리에 `src/api` 를 더한다.
- 커버리지 제외에 다음을 더한다.
  - 테스트 도우미 `src/api/test-utils.ts`
  - env 를 `ApiContext` 로 엮기만 하는 `src/api/context.ts`
- D1 을 쓰는 테스트는 `src/api/test-utils.ts` 의 `createTestDb()` 로 **실제 D1**(workerd)을 띄운다. D1 을 흉내 낸 가짜 객체는 쓰지 않는다. 일부러 실패하게 만드는 경우는 예외로, 마이그레이션을 적용하지 않은 DB 를 쓴다.

### 커밋

- main 에 바로 커밋한다. 메시지는 한국어로 쓴다.
- 메시지 끝에 다음 두 줄을 붙인다.

  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RzL49ncQEeheb9KHNoMXPM
  ```

## Review Focus

1. **같은 방문자가 같은 글을 동시에 두 번 연다**(탭 두 개). 글별 수는 1만 올라야 한다 → Task 7 `동시 요청도 하루 1회만 센다`
2. **비밀번호가 없는 은솔 댓글**(`password_hash` NULL)을 남이 아무 비밀번호로나 고치거나 지우려 한다. 500 이 아니라 403 이어야 한다 → Task 6 `남은 은솔 댓글을 고칠 수 없다`
3. **시도 제한에 걸린 뒤에는 맞는 비밀번호도 429 다.** 제한 판정이 PBKDF2 보다 먼저다 → Task 6 `제한에 걸리면 맞는 비밀번호도 429`
4. **다른 Access 앱의 토큰, 만료 토큰, 설정이 빈 Worker** 는 은솔로 인정되지 않는다 → Task 3 테스트들
5. **`/admin?return=` 으로 다른 사이트에 보내려는 시도**(`//evil.com`, `/\evil.com`, `https://evil.com`, `/admin` 루프)는 `/` 로 간다 → Task 2 `safeReturnPath`

## 파일 구조

```
migrations/0001_comments_views.sql     # comments, post_views, site_views, view_dedupe, attempts
.dev.vars.example                       # 로컬 시크릿·테스트 키 견본 (.dev.vars 는 gitignore)
src/api/
  types.ts           # 브라우저와 공유하는 DTO·오류 코드 (타입만)
  crypto.ts          # base64, HMAC, SHA-256, 상수 시간 비교
  password.ts        # PBKDF2 + pepper 해시·검증
  http.ts            # json 응답, Origin·IP·쿠키·본문 읽기, safeReturnPath
  access.ts          # Access JWT 검증, 은솔 판정, JWKS 캐시
  turnstile.ts       # siteverify
  attempts.ts        # 비밀번호 실패 시도 제한 (D1)
  comment-input.ts   # 입력 검증, 예약 이름
  comments-repo.ts   # comments 테이블 SQL
  comments.ts        # 댓글 핸들러 4개 + /api/me
  views.ts           # 방문자 키, 봇 판정, 조회수 SQL, 핸들러
  cleanup.ts         # Cron 정리
  router.ts          # /api/* 분기, 503 감싸기
  context.ts         # env → ApiContext (배선만, 커버리지 제외)
  test-utils.ts      # createTestDb, testContext (커버리지 제외)
src/lib/api-client.ts      # 브라우저 fetch 래퍼
src/lib/view-target.ts     # 라우트 매치 → 셀 대상
src/lib/prerender.ts       # 프리렌더 경로 필터
src/components/ViewCounts.tsx
src/components/comments/{CommentSection,CommentItem,CommentForm,Turnstile}.tsx
src/styles/comments.css
```

---

### Task 1: D1 기반 (스키마 · 바인딩 · 테스트 DB)

**Files:**
- Create: `migrations/0001_comments_views.sql`, `.dev.vars.example`, `src/api/types.ts`, `src/api/test-utils.ts`, `src/api/schema.test.ts`
- Modify: `wrangler.jsonc`, `package.json`, `vitest.config.ts`, `worker-configuration.d.ts`(재생성)

**Interfaces:**
- Produces

  ```ts
  // src/api/types.ts
  export type CommentDto = { id: string; author: string; body: string; isOwner: boolean; createdAt: string; updatedAt: string | null }
  export type ApiErrorCode = 'invalid_input' | 'turnstile_failed' | 'wrong_password' | 'forbidden_origin' | 'reserved_name' | 'not_found' | 'too_many_attempts' | 'unavailable'
  export type MeDto = { owner: boolean; turnstileSiteKey: string }
  export type ViewCountsDto = { site: number; post?: number }

  // src/api/test-utils.ts
  export async function createTestDb(options?: { migrate?: boolean }): Promise<{ db: D1Database; dispose: () => Promise<void> }>
  // migrate 기본값 true. migrations/*.sql 을 이름순으로 읽어 ';' 로 나눈 문장을 db.batch 로 적용한다
  // (D1 exec 는 줄마다 끊어 실행해서 여러 줄 CREATE 문이 깨진다. 확인함)
  ```

- [ ] **Step 1: 스키마 테스트를 먼저 쓴다** (`src/api/schema.test.ts`)
  - `comments` 에 `is_owner=0` 이면서 `password_hash` 가 NULL 인 행을 넣으면 CHECK 제약으로 실패한다.
  - `is_owner=1` 이면 비밀번호 없이 들어간다.
  - `site_views` 에 `id=2` 는 들어가지 않는다.
  - `view_dedupe` 에 같은 `(day, slug, visitor)` 를 `INSERT OR IGNORE` 로 두 번 넣으면 두 번째 `meta.changes` 가 0 이다.
  - `attempts` 테이블이 `(key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, count INTEGER NOT NULL)` 로 존재한다.
  - `sqlite_master` 에 `comments_post_created` 인덱스가 있다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/api/schema.test.ts`
  - 기대: FAIL (`test-utils` 또는 `migrations` 가 없음)

- [ ] **Step 3: 마이그레이션과 테스트 DB 도우미를 쓴다**
  - 스키마는 스펙 4.7·4.8 의 SQL 을 그대로 쓰고, 다음을 더한다.
    - `CREATE INDEX comments_post_created ON comments(post_slug, created_at)`
    - `view_dedupe` 와 `attempts` 는 `WITHOUT ROWID` 로 만든다. 쓰기 행 수를 줄이기 위해서다.
    - `attempts(key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, count INTEGER NOT NULL) WITHOUT ROWID`
  - `createTestDb` 는 `getPlatformProxy<{ DB: D1Database }>({ configPath: 'wrangler.jsonc', persist: false })` 를 쓴다.

- [ ] **Step 4: 바인딩과 변수를 넣는다** (`wrangler.jsonc`)

  ```jsonc
  "d1_databases": [{ "binding": "DB", "database_name": "eunsol-blog", "migrations_dir": "migrations" }],
  // 04:00 KST. 지난 조회 중복 기록과 시도 제한 기록을 지운다
  "triggers": { "crons": ["0 19 * * *"] },
  // 공개 값. Access 셋은 계획 5 에서 채운다. 비어 있으면 은솔 판정이 항상 false 다
  "vars": { "TURNSTILE_SITE_KEY": "1x00000000000000000000AA", "ACCESS_TEAM_DOMAIN": "", "ACCESS_AUD": "", "OWNER_EMAIL": "" }
  ```

  - `database_id` 는 넣지 않는다. 계획 5 에서 `wrangler d1 create` 로 만든 ID 를 커밋한다.
  - `.dev.vars.example` 에 넣을 값
    - Turnstile 공식 테스트 키: `TURNSTILE_SITE_KEY=1x00000000000000000000AA`, `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`
    - dev 용 `COMMENT_PEPPER`, `VIEW_SALT_SECRET`
    - `DEV_OWNER=0`
    - 맨 위에 "프로덕션 시크릿으로 쓰지 말 것" 주석을 단다.
  - 그 파일을 복사해 `.dev.vars` 를 만든다. `.dev.vars` 는 커밋하지 않는다.
  - `package.json` 스크립트
    - `"db:migrate:local": "wrangler d1 migrations apply DB --local"`
    - `"cf-typegen": "wrangler types --strict-vars=false"`
  - `pnpm cf-typegen` 으로 `worker-configuration.d.ts` 를 다시 만든다.
    - `Env` 에 `DB: D1Database`, 변수 넷, `.dev.vars` 의 시크릿이 `string` 으로 들어 있어야 한다.
  - `vitest.config.ts`
    - `coverage.include` 에 `'src/api/**/*.ts'` 를 더한다.
    - `coverage.exclude` 에 `'src/api/test-utils.ts'`, `'src/api/context.ts'`, `'src/api/types.ts'` 를 더한다.

- [ ] **Step 5: 확인한다**
  - 실행: `pnpm vitest run src/api/schema.test.ts && pnpm db:migrate:local && pnpm check`
  - 기대: 테스트 PASS, 마이그레이션 `0001_comments_views.sql ✅`, 타입 검사 통과

- [ ] **Step 6: 커밋한다**

  ```bash
  git add migrations .dev.vars.example src/api wrangler.jsonc package.json vitest.config.ts worker-configuration.d.ts
  git commit -m "feat: 댓글·조회수 D1 스키마와 바인딩 추가"
  ```

### Task 2: 암호 도구 · 비밀번호 해시 · 요청 도구

**Files:**
- Create: `src/api/crypto.ts`, `src/api/password.ts`, `src/api/http.ts`
- Test: `src/api/crypto.test.ts`, `src/api/password.test.ts`, `src/api/http.test.ts`

**Interfaces:**
- Consumes: `ApiErrorCode` (Task 1)
- Produces

  ```ts
  // src/api/crypto.ts
  export function toBase64(bytes: Uint8Array): string
  export function fromBase64(text: string): Uint8Array
  export async function hmacSha256(secret: string, message: string): Promise<Uint8Array>
  export async function hmacHex(secret: string, message: string): Promise<string>
  export async function sha256Hex(text: string): Promise<string>
  export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean   // 길이가 다르면 false

  // src/api/password.ts
  export const PASSWORD_ITERATIONS = 50_000   // 임시값. 계획 5 에서 무료 플랜 CPU 를 실측해 정한다 (상한 100,000)
  export type StoredPassword = { hash: string; salt: string }
  export async function hashPassword(password: string, pepper: string, options?: { iterations?: number; salt?: Uint8Array }): Promise<StoredPassword>
  // hash = `pbkdf2-sha256$<iterations>$<base64 32바이트>`, salt = base64(16바이트 랜덤)
  // 입력 키는 HMAC-SHA256(pepper, password) 다
  export async function verifyPassword(password: string, pepper: string, stored: StoredPassword): Promise<boolean>
  // 형식이 틀렸거나, 반복 횟수가 1 미만이거나 100,000 을 넘으면 false

  // src/api/http.ts
  export function json(status: number, body: unknown): Response   // content-type application/json; charset=utf-8, cache-control: no-store
  export function apiError(status: number, error: ApiErrorCode): Response
  export function isSameOrigin(request: Request): boolean   // Origin 헤더 === new URL(request.url).origin. 헤더가 없으면 false
  export function clientIp(request: Request): string        // CF-Connecting-IP, 없으면 ''
  export function readCookie(header: string | null, name: string): string | undefined
  export async function readJson(request: Request, maxBytes?: number): Promise<unknown>
  // 기본 16_384. content-type 이 application/json 이 아니거나, 크기를 넘거나, 파싱에 실패하면 undefined
  export function safeReturnPath(value: string | null): string
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `crypto.test.ts`
    - base64 왕복: `[0, 255, 16]` → `'AP8Q'` → 원래 바이트
    - `sha256Hex('abc')` = `'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'`
    - `hmacHex('key', 'The quick brown fox jumps over the lazy dog')` = `'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8'`
    - `constantTimeEqual`: 같으면 true, 한 바이트 다르면 false, 길이가 다르면 false
  - `password.test.ts`
    - 해시한 비밀번호는 같은 비밀번호와 pepper 로 검증된다.
    - 다른 비밀번호, 다른 pepper 는 false 다.
    - `hash` 는 `pbkdf2-sha256$50000$` 로 시작하고, 평문을 포함하지 않는다.
    - 같은 비밀번호를 두 번 해시하면 salt 와 hash 가 다르다.
    - `{ iterations: 1000 }` 으로 만든 해시는 저장된 반복 횟수로 검증된다.
    - `hash: 'plain'`, `'pbkdf2-sha256$0$AA=='`, `'pbkdf2-sha256$200000$AA=='` 는 false 다.
  - `http.test.ts`
    - `isSameOrigin`: 같으면 true, 다른 origin·헤더 없음·`null` 은 false
    - `clientIp`: 헤더 값, 없으면 `''`
    - `readCookie('a=1; CF_Authorization=tok.en; b=2', 'CF_Authorization')` → `'tok.en'`. 없으면 undefined, header 가 null 이어도 undefined
    - `readJson`: 정상 JSON, `text/plain` → undefined, 16KB 초과 → undefined, 깨진 JSON → undefined
    - `json(201, {a:1})` 의 상태, 헤더, 본문 / `apiError(403, 'wrong_password')` 본문 `{"error":"wrong_password"}`
    - `safeReturnPath`
      - `'/261020'` → `'/261020'`
      - `'/en/posts?tag=meta#x'` → 그대로
      - `null`, `''`, `'261020'`, `'//evil.com'`, `'/\\evil.com'`, `'https://evil.com'`, `'/admin'`, `'/admin?return=/x'` → `'/'`

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/api/crypto.test.ts src/api/password.test.ts src/api/http.test.ts`
  - 기대: FAIL (모듈 없음)

- [ ] **Step 3: 구현한다**
  - PBKDF2 는 `crypto.subtle.importKey('raw', hmac, 'PBKDF2', false, ['deriveBits'])` 와 `deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)` 로 한다.
  - `safeReturnPath` 는 다음 순서로 판정한다.
    - 값이 `/` 로 시작하고 `//`·`/\` 로 시작하지 않는지 본다.
    - `new URL(value, 'https://return.invalid')` 의 origin 이 그대로인지 본다.
    - pathname 이 `/admin` 이나 `/admin/...` 이 아닌지 본다.
    - 통과하면 `pathname + search + hash` 를 돌려준다.

- [ ] **Step 4: 실행해서 통과를 확인한다**
  - 실행: Step 2 와 같다
  - 기대: PASS

- [ ] **Step 5: 커밋한다**: `feat: 댓글 API 용 암호·비밀번호 해시·요청 도구 추가`

### Task 3: 은솔 판정 (Cloudflare Access JWT)

**Files:**
- Create: `src/api/access.ts`
- Test: `src/api/access.test.ts`
- Modify: `package.json` (`pnpm add jose@^6.2.12`)

**Interfaces:**
- Consumes: `readCookie` (Task 2)
- Produces

  ```ts
  import type { JWTVerifyGetKey } from 'jose'
  export type AccessConfig = { teamDomain: string; audience: string; ownerEmail: string }
  export async function verifyAccessToken(token: string, config: AccessConfig, keys: JWTVerifyGetKey, now?: Date): Promise<boolean>
  // jwtVerify(token, keys, { audience, issuer: `https://${teamDomain}`, algorithms: ['RS256'], currentDate: now })
  // + payload.email 을 소문자로 비교. 예외는 전부 false
  // 쿠키가 있는데 검증에 실패하면 console.warn('[access] ...', 원인) 을 남긴다 (스펙 4.12). 토큰 값은 로그에 넣지 않는다
  export async function isOwnerRequest(request: Request, options: { config: AccessConfig; keys: () => JWTVerifyGetKey; devOwner: boolean; now?: Date }): Promise<boolean>
  // devOwner 면 true. 설정값이 하나라도 비었거나 CF_Authorization 쿠키가 없으면 keys() 를 부르지 않고 false
  export function remoteAccessKeys(teamDomain: string): JWTVerifyGetKey
  // createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`)) 를 모듈 스코프 Map 에 팀 도메인별로 한 번만 만든다
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - jose 의 `generateKeyPair('RS256', { extractable: true })`, `exportJWK`(+`kid`), `createLocalJWKSet`, `SignJWT` 로 토큰을 만든다.
  - 공통 설정: `config = { teamDomain: 'team.cloudflareaccess.com', audience: 'aud-1', ownerEmail: 'owner@example.com' }`
  - `verifyAccessToken` 테스트
    - 올바른 토큰 → true
    - 이메일 대소문자만 다름(`Owner@Example.com`) → true
    - aud 다름(`aud-2`) → false
    - iss 다름(`https://other.cloudflareaccess.com`) → false
    - 만료됨(`exp` 가 `now` 이전) → false
    - 다른 키로 서명 → false
    - 이메일 다름 → false
    - email 클레임 없음 → false
    - `'not-a-jwt'` → false
  - `isOwnerRequest` 테스트
    - `devOwner: true` 면 쿠키 없이 true
    - 쿠키에 올바른 토큰 → true
    - 쿠키 없음 → false, 그리고 `keys` 가 호출되지 않음
    - `config.audience: ''` → false, 그리고 `keys` 가 호출되지 않음
  - `remoteAccessKeys('a.cloudflareaccess.com')` 를 두 번 부르면 같은 객체이고(`toBe`), 팀 도메인이 다르면 다른 객체다. 네트워크는 쓰지 않는다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/api/access.test.ts`
  - 기대: FAIL

- [ ] **Step 3: `jose` 를 추가하고 구현한다.**

- [ ] **Step 4: 실행해서 통과를 확인한다**
  - 실행: Step 2 와 같다
  - 기대: PASS

- [ ] **Step 5: 커밋한다**: `feat: Cloudflare Access JWT 로 은솔 판정 추가`

### Task 4: Turnstile 검증 · 비밀번호 실패 시도 제한

**Files:**
- Create: `src/api/turnstile.ts`, `src/api/attempts.ts`
- Test: `src/api/turnstile.test.ts`, `src/api/attempts.test.ts`

**Interfaces:**
- Consumes: `createTestDb` (Task 1)
- Produces

  ```ts
  // src/api/turnstile.ts
  export type TurnstileOutcome = 'ok' | 'failed' | 'unavailable'
  export async function verifyTurnstile(token: string, options: { secret: string; remoteIp: string; fetchFn?: typeof fetch }): Promise<TurnstileOutcome>
  // 빈 토큰이나 2048자를 넘는 토큰은 fetch 없이 'failed'
  // POST https://challenges.cloudflare.com/turnstile/v0/siteverify, form 본문 secret·response·remoteip(빈 값이면 뺀다)
  // 네트워크 오류나 2xx 가 아닌 응답이면 console.error('[turnstile] ...') 후 'unavailable'
  // success === true 면 'ok', 나머지는 'failed'
  // 'failed' 일 때는 error-codes 를 console.warn 으로 남긴다
  // 요청에 AbortSignal.timeout(5000) 을 건다

  // src/api/attempts.ts
  export const ATTEMPT_WINDOW_SECONDS = 600
  export const ATTEMPT_LIMITS = { visitor: 5, comment: 10 } as const
  export type AttemptKey = { key: string; max: number }
  export async function isLimited(db: D1Database, keys: AttemptKey[], now: Date): Promise<boolean>
  // 현재 창(floor(초 / 600))의 count >= max 인 키가 하나라도 있으면 true
  export async function recordFailure(db: D1Database, keys: string[], now: Date): Promise<void>
  // 한 batch 로 upsert. 같은 창이면 count + 1, 창이 바뀌었으면 1 로 다시 시작
  export async function pruneAttempts(db: D1Database, now: Date): Promise<number>   // 현재 창보다 이전 창의 행을 지우고 지운 수를 돌려준다
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `turnstile.test.ts`: 가짜 `fetchFn` 으로 확인한다.
    - success true → `'ok'`, 그리고 본문에 `secret`, `response`, `remoteip` 가 있다.
    - success false → `'failed'`
    - 500 응답 → `'unavailable'`
    - fetch 가 throw → `'unavailable'`
    - `''` 와 2049자 토큰 → `'failed'`, 그리고 fetch 가 호출되지 않는다.
    - `remoteIp: ''` 면 본문에 `remoteip` 가 없다.
  - `attempts.test.ts`: 실제 D1 로 확인한다.
    - 실패 4번까지는 `isLimited([{key:'v', max:5}])` 가 false, 5번째 뒤에는 true 다.
    - 600초가 지난 다음 창에서는 false 이고, 다시 기록하면 count 가 1 부터 시작한다.
    - 키 두 개 중 하나만 넘어도 true 다.
    - `pruneAttempts` 는 이전 창의 행만 지운다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/api/turnstile.test.ts src/api/attempts.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현한다**
  - `recordFailure` 의 upsert 는 다음 형태다.

    ```sql
    INSERT INTO attempts(key, window_start, count) VALUES (?1, ?2, 1)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN attempts.window_start = excluded.window_start THEN attempts.count + 1 ELSE 1 END,
      window_start = excluded.window_start
    ```

- [ ] **Step 4: 실행해서 통과를 확인한다**
  - 실행: Step 2 와 같다
  - 기대: PASS

- [ ] **Step 5: 커밋한다**: `feat: Turnstile 서버 검증과 비밀번호 실패 시도 제한 추가`

### Task 5: 댓글 입력 검증과 저장소

**Files:**
- Create: `src/api/comment-input.ts`, `src/api/comments-repo.ts`
- Test: `src/api/comment-input.test.ts`, `src/api/comments-repo.test.ts`

**Interfaces:**
- Consumes: `CommentDto` (Task 1), `createTestDb` (Task 1)
- Produces

  ```ts
  // src/api/comment-input.ts
  export const COMMENT_LIMITS = { author: { min: 1, max: 20 }, body: { min: 1, max: 1000 }, password: { min: 4, max: 64 } } as const
  export type NewComment = { author: string; body: string; password: string; turnstileToken: string }
  export type CommentEdit = { body: string; password: string; turnstileToken: string }
  export type CommentDeletion = { password: string; turnstileToken: string }
  // 은솔(owner=true)이면 body 만 검사하고 나머지 필드는 '' 로 채운다. 하나라도 틀리면 null
  export function parseNewComment(value: unknown, owner: boolean): NewComment | null
  export function parseCommentEdit(value: unknown, owner: boolean): CommentEdit | null
  export function parseCommentDeletion(value: unknown, owner: boolean): CommentDeletion | null
  export function isReservedName(name: string): boolean

  // src/api/comments-repo.ts
  export type CommentRow = { id: string; post_slug: string; author: string; body: string; is_owner: number; password_hash: string | null; password_salt: string | null; created_at: string; updated_at: string | null }
  export function toCommentDto(row: CommentRow): CommentDto
  export async function listComments(db: D1Database, slug: string): Promise<CommentDto[]>   // created_at, id 오름차순
  export async function getComment(db: D1Database, id: string): Promise<CommentRow | null>
  export async function insertComment(db: D1Database, row: CommentRow): Promise<void>
  export async function updateCommentBody(db: D1Database, id: string, body: string, updatedAt: string): Promise<CommentRow | null>   // UPDATE ... RETURNING *
  export async function deleteComment(db: D1Database, id: string): Promise<boolean>
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `comment-input.test.ts`
    - 작성자명
      - 앞뒤 공백은 잘라낸다.
      - 길이는 코드 포인트로 센다. 이모지 20개는 통과하고 21자는 null 이다.
      - 빈 이름이나 공백만 있는 이름은 null 이다.
      - 제어 문자(`\u0007`)나 줄바꿈이 있으면 null 이다.
    - 본문
      - `\r\n` 은 `\n` 으로 바꾸고 앞뒤 공백을 자른다.
      - 1000자는 통과하고 1001자는 null 이다.
      - `\n`, `\t` 말고 제어 문자가 있으면 null 이다.
    - 비밀번호
      - 공백을 자르지 않는다.
      - 3자와 65자는 null 이다.
    - `turnstileToken` 은 비어 있지 않은 문자열이어야 한다.
    - 객체가 아니거나 필드 타입이 틀리면 null 이다.
    - 은솔(`owner=true`)이면 `{ body: '안녕' }` 만으로 통과하고 나머지는 `''` 다.
    - 수정과 삭제도 같은 규칙이다. 삭제는 body 를 보지 않는다.
    - `isReservedName`
      - 막는 이름: `'eunsol'`, `' E u n S o l '`, `'ＥＵＮＳＯＬ'`(NFKC), `'nabi'`, `'은솔'`, `'나 비'`, `'eunsol (Nabi)'`
      - 허용하는 이름: `'eunsol2'`, `'김은솔'`
  - `comments-repo.test.ts` (실제 D1)
    - 넣은 순서와 상관없이 `created_at` 오름차순으로 나온다.
    - 다른 글의 댓글은 섞이지 않는다.
    - `toCommentDto` 는 `is_owner` 를 boolean 으로 바꾸고, 해시와 솔트를 내보내지 않는다.
    - `updateCommentBody` 는 바뀐 행을 돌려준다. 없는 id 면 null 이다.
    - `deleteComment` 는 지웠으면 true, 없으면 false 다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/api/comment-input.test.ts src/api/comments-repo.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현한다**
  - 예약 이름 판정: `NFKC` 정규화 → 소문자 → 공백 제거 순서로 바꾼 뒤, 아래 집합에 정확히 일치하는지 본다.
    - `{ 'eunsol', 'nabi', '은솔', '나비', 'eunsol(nabi)' }`
    - 마지막 것은 `site.author` 를 같은 방식으로 바꾼 값이다.

- [ ] **Step 4: 실행해서 통과를 확인한다**
  - 실행: Step 2 와 같다
  - 기대: PASS

- [ ] **Step 5: 커밋한다**: `feat: 댓글 입력 검증과 D1 저장소 추가`

### Task 6: 댓글 API 핸들러와 라우터

**Files:**
- Create: `src/api/comments.ts`, `src/api/router.ts`, `src/api/context.ts`
- Test: `src/api/comments.test.ts`, `src/api/router.test.ts`
- Modify: `src/api/test-utils.ts` (`testContext` 추가)

**Interfaces:**
- Consumes: Task 2~5 의 모든 Produces
- Produces

  ```ts
  // src/api/router.ts (comments.ts·views.ts 는 이 타입을 import type 으로만 가져온다. 순환 import 방지)
  export type ApiContext = {
    db: D1Database
    now: () => Date
    ip: string
    userAgent: string
    isOwner: () => Promise<boolean>              // 요청당 한 번만 계산되게 context.ts 가 memo 한다
    verifyTurnstile: (token: string) => Promise<TurnstileOutcome>
    postExists: (slug: string) => boolean
    pepper: string                               // COMMENT_PEPPER. 시도 제한의 방문자 키에도 쓴다
    viewSalt: string                             // VIEW_SALT_SECRET
    ownerName: string                            // site.name ('eunsol'). 은솔 댓글의 작성자명
    turnstileSiteKey: string
  }
  export async function routeApi(request: Request, ctx: ApiContext): Promise<Response>
  // GET /api/me, GET|POST /api/posts/:slug/comments, PATCH|DELETE /api/comments/:id, POST /api/views (Task 7)
  // 쓰기 메서드는 isSameOrigin 을 먼저 본다. 핸들러가 throw 하면 console.error 후 503 unavailable
  // 경로가 없으면 404, 경로는 맞는데 메서드가 틀리면 405

  // src/api/comments.ts
  export async function handleMe(ctx: ApiContext): Promise<Response>   // 200 MeDto
  export async function handleListComments(ctx: ApiContext, slug: string): Promise<Response>   // 200 { comments }. 없는 글이면 404
  export async function handleCreateComment(request: Request, ctx: ApiContext, slug: string): Promise<Response>
  export async function handleEditComment(request: Request, ctx: ApiContext, id: string): Promise<Response>
  export async function handleDeleteComment(request: Request, ctx: ApiContext, id: string): Promise<Response>

  // src/api/context.ts (배선만)
  export function createApiContext(request: Request, env: Env, options: { devOwner: boolean; postExists: (slug: string) => boolean }): ApiContext

  // src/api/test-utils.ts
  export function testContext(db: D1Database, overrides?: Partial<ApiContext>): ApiContext
  // 기본값은 다음과 같다
  //   now 고정 2026-10-20T03:00:00Z, ip '203.0.113.7', userAgent 'Mozilla/5.0'
  //   isOwner false, verifyTurnstile 'ok', postExists slug === '261020'
  //   pepper 'test-pepper', viewSalt 'test-salt', ownerName 'eunsol', turnstileSiteKey '1x00000000000000000000AA'
  ```

- 처리 순서. 이 순서 자체가 요구 사항이다. 특히 PBKDF2 전에 Turnstile 과 시도 제한을 둔다.
  - **작성** (남)
    1. 입력 검증 → 400
    2. 글 존재 → 404
    3. 예약 이름 → 403
    4. Turnstile (`failed` → 403, `unavailable` → 503)
    5. `hashPassword`
    6. insert → 201
  - **작성** (은솔): 입력 검증 → 글 존재 → `author = ownerName`, `is_owner = 1`, 비밀번호 NULL → 201
  - **수정·삭제** (남)
    1. 입력 검증 → 400
    2. Turnstile → 403 / 503
    3. 댓글 조회 → 404
    4. `isLimited([{ key: 'visitor:' + hmacHex(pepper, 'attempt:' + ip), max: 5 }, { key: 'comment:' + id, max: 10 }])` → 429
    5. 은솔 댓글이면 비밀번호를 대조하지 않고 실패를 기록한 뒤 403 `wrong_password`
    6. `verifyPassword`. 틀리면 `recordFailure` 후 403
    7. 맞으면 수정 200 / 삭제 204
  - **수정·삭제** (은솔): 입력 검증 → 댓글 조회 → 404 → 수정 200 / 삭제 204. 시도 제한, Turnstile, 비밀번호는 건너뛴다.
  - `id` 는 `crypto.randomUUID()` 로, 시각은 `ctx.now().toISOString()` 으로 만든다.

- [ ] **Step 1: 실패하는 테스트를 쓴다** (`comments.test.ts`, 실제 D1 + `testContext`)
  - 작성
    - 남의 댓글은 201 이고, 응답 `comment` 에 해시가 없다.
    - DB 의 `password_hash` 에 평문 비밀번호가 없다.
    - 은솔 댓글은 author 가 `'eunsol'`, `isOwner` true, `password_hash` NULL 이다. 요청에 author·password 가 없어도 된다.
    - 예약 이름 → 403 `reserved_name`. 은솔이 같은 이름으로 쓰면 201 이다.
    - Turnstile `failed` → 403 `turnstile_failed`, `unavailable` → 503 `unavailable`
    - 없는 글 → 404, 입력 오류 → 400
  - 목록: 두 개를 쓴 뒤 GET 하면 오래된 순서다.
  - 수정·삭제
    - 맞는 비밀번호로 수정하면 200 이고 `updatedAt` 이 채워진다. 삭제하면 204 이고 목록에서 사라진다.
    - 틀린 비밀번호 → 403 `wrong_password`
    - `남은 은솔 댓글을 고칠 수 없다`: is_owner 댓글에 아무 비밀번호나 넣으면 수정·삭제 모두 403 이다.
    - `제한에 걸리면 맞는 비밀번호도 429`: 같은 IP 로 틀린 비밀번호 5번 → 6번째는 맞는 비밀번호여도 429 다.
    - 다른 IP 여러 개로 한 댓글에 10번 틀리면 그 댓글은 429 다.
    - 시도 제한에 걸린 상태에서 맞는 비밀번호로 삭제를 보내면 429 이고 댓글이 남아 있다. 제한 판정이 비밀번호 검증보다 앞선다는 증거다. ESM named export 는 `vi.spyOn` 으로 바꿀 수 없으므로 호출 여부는 보지 않는다. PBKDF2 앞에 판정이 있는지는 코드 순서로 리뷰한다.
    - 은솔은 남의 댓글을 비밀번호 없이 수정·삭제한다.
    - 없는 id → 404
  - `handleMe` → `{ owner: false, turnstileSiteKey: '1x00000000000000000000AA' }`. isOwner 가 true 면 `owner: true` 다.
- [ ] **Step 2: 라우터 테스트를 쓴다** (`router.test.ts`)
  - `GET /api/me` 200
  - `POST /api/posts/261020/comments` 에 Origin 이 없거나 다르면 403 `forbidden_origin` 이고, DB 에 행이 생기지 않는다.
  - `content-type: text/plain` → 400
  - `PUT /api/comments/x` → 405, `GET /api/nope` → 404
  - 마이그레이션을 적용하지 않은 DB(`createTestDb({ migrate: false })`)로 `GET /api/posts/261020/comments` → 503 `unavailable`. `console.error` 가 불린다(spy).
  - 경로의 slug·id 는 `decodeURIComponent` 한다. `/api/posts/%E0/comments` 처럼 디코딩할 수 없으면 404 다.

- [ ] **Step 3: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/api/comments.test.ts src/api/router.test.ts`
  - 기대: FAIL

- [ ] **Step 4: 핸들러와 라우터를 구현하고 `context.ts` 를 쓴다**
  - `context.ts` 가 env 를 엮는 방법
    - `isOwner`: `isOwnerRequest(request, { config: { teamDomain: env.ACCESS_TEAM_DOMAIN, audience: env.ACCESS_AUD, ownerEmail: env.OWNER_EMAIL }, keys: () => remoteAccessKeys(env.ACCESS_TEAM_DOMAIN), devOwner: options.devOwner })` 를 처음 부를 때 한 번만 계산한다.
    - `verifyTurnstile`: `token => verifyTurnstile(token, { secret: env.TURNSTILE_SECRET_KEY, remoteIp: clientIp(request) })`

- [ ] **Step 5: 실행해서 통과를 확인한다**
  - 실행: Step 3 과 같다
  - 기대: PASS

- [ ] **Step 6: 커밋한다**: `feat: 댓글 API(목록·작성·수정·삭제·me)와 라우터 추가`

### Task 7: 조회수 API

**Files:**
- Create: `src/api/views.ts`
- Test: `src/api/views.test.ts`
- Modify: `src/api/router.ts` (`POST /api/views`), `src/api/router.test.ts`

**Interfaces:**
- Consumes: `ApiContext`, `routeApi` (Task 6), `sha256Hex`·`hmacHex` (Task 2)
- Produces

  ```ts
  export function kstDay(date: Date): string                         // 'YYYY-MM-DD' (Asia/Seoul)
  export async function visitorKey(secret: string, day: string, ip: string, userAgent: string): Promise<string>
  // sha256Hex(`${hmacHex(secret, day)}|${ip}|${userAgent}`)
  export function isBotUserAgent(userAgent: string): boolean
  // 빈 UA, /bot|crawl|spider|slurp|preview|headless|lighthouse|python-requests|curl|wget|httpclient|facebookexternalhit|embedly/i
  export async function recordView(db: D1Database, input: { slug?: string; day: string; visitor: string }): Promise<ViewCountsDto>
  export async function readViews(db: D1Database, slug?: string): Promise<ViewCountsDto>
  export async function pruneViews(db: D1Database, now: Date): Promise<number>   // day < kstDay(now - 1일) 인 view_dedupe 행을 지운다 (오늘·어제만 남김)
  export async function handleRecordView(request: Request, ctx: ApiContext): Promise<Response>
  // 본문 { slug?: string }. slug 가 있는데 postExists 가 아니면 404 이고 아무것도 올리지 않는다
  // 봇 UA 면 올리지 않고 readViews 결과를 200 으로 돌려준다
  ```

- `recordView` 는 다음 문장들을 **한 batch** 로 보낸다(스펙 4.8 정정: batch 안에서는 앞 문장의 `changes` 를 볼 수 없어서, 조건을 SQL 안에 넣는다).
  - slug 가 없으면 3·4번만 보낸다.

  ```sql
  -- 1. 오늘 처음 온 방문자일 때만 글별 수를 올린다
  INSERT INTO post_views(slug, count) SELECT ?1, 1
    WHERE NOT EXISTS (SELECT 1 FROM view_dedupe WHERE day = ?2 AND slug = ?1 AND visitor = ?3)
    ON CONFLICT(slug) DO UPDATE SET count = count + 1;
  -- 2.
  INSERT OR IGNORE INTO view_dedupe(day, slug, visitor) VALUES (?2, ?1, ?3);
  -- 3.
  INSERT INTO site_views(id, count) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET count = count + 1;
  -- 4. 5.
  SELECT count FROM site_views WHERE id = 1;
  SELECT count FROM post_views WHERE slug = ?1;
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다** (`views.test.ts`)
  - `kstDay(new Date('2026-10-20T14:59:59Z'))` = `'2026-10-20'`, `'2026-10-20T15:00:00Z'` = `'2026-10-21'`
  - `visitorKey`
    - 같은 입력이면 같은 64자 hex 다.
    - day 가 바뀌면 다른 값이다.
    - 결과에 ip 문자열이 들어 있지 않다.
  - `isBotUserAgent`
    - true: `''`, `'Googlebot/2.1'`, `'Mozilla/5.0 (compatible; bingbot/2.0)'`, `'curl/8.0'`, `'HeadlessChrome'`
    - false: 일반 Chrome·Safari UA
  - `recordView` (실제 D1)
    - 같은 방문자가 두 번 보면 post 는 1, site 는 2 다.
    - 다른 방문자가 보면 post 2 다.
    - 다음 날 같은 방문자가 보면 post 가 오른다.
    - slug 가 없으면 `{ site }` 만 돌려주고 `post` 키가 없다.
  - `동시 요청도 하루 1회만 센다`: 같은 방문자로 `Promise.all` 두 번 → post 1, site 2
  - `pruneViews` 는 그제 행을 지우고 어제·오늘 행은 남긴다.
  - `handleRecordView`
    - 일반 → 200 `{ site, post }`
    - 봇 UA → 200 이지만 수가 오르지 않는다.
    - 없는 slug → 404 이고 site 도 오르지 않는다.
    - 잘못된 본문(`{ slug: 3 }`) → 400
  - `router.test.ts` 에 더할 것
    - `POST /api/views` 는 Origin 이 다르면 403 이다.
    - 마이그레이션 없는 DB 면 503 이다. 0 을 돌려주지 않는다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/api/views.test.ts src/api/router.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 라우터에 연결한다.**

- [ ] **Step 4: 실행해서 통과를 확인한다**
  - 실행: Step 2 와 같다
  - 기대: PASS

- [ ] **Step 5: 커밋한다**: `feat: 글별(하루 1회)·전체 조회수 API 추가`

### Task 8: 서버 엔트리 배선 (`/api` · `/admin` · Cron · 프리렌더 제외)

**Files:**
- Create: `src/api/cleanup.ts`, `src/lib/prerender.ts`
- Test: `src/api/cleanup.test.ts`, `src/lib/prerender.test.ts`, `src/lib/smoke.test.ts`(요청 옵션)
- Modify: `src/server.ts`, `src/content/posts.server.ts`(`postIndex` export), `vite.config.ts`, `src/lib/smoke.ts`, `scripts/smoke.ts`

**Interfaces:**
- Consumes: `routeApi`, `createApiContext` (Task 6), `pruneViews` (Task 7), `pruneAttempts` (Task 4), `safeReturnPath` (Task 2)
- Produces

  ```ts
  // src/api/cleanup.ts
  export async function cleanup(db: D1Database, now: Date): Promise<{ views: number; attempts: number }>

  // src/lib/prerender.ts
  export function shouldPrerender(path: string): boolean   // ? 나 # 가 있거나, /api/ 로 시작하거나, /admin 이나 /admin/... 이면 false

  // src/lib/smoke.ts: SmokeCheck 에 요청 옵션을 더한다
  export type SmokeCheck = { path: string; status: number; contains?: string[]; notContains?: string[]; location?: string;
    method?: string; headers?: Record<string, string>; body?: string }

  // src/content/posts.server.ts
  export const postIndex: PostIndex   // 이미 만드는 createPostIndex 결과를 이름 붙여 내보낸다
  ```

- `src/server.ts` 의 모양

  ```ts
  export default {
    fetch(req, env, ctx) {
      // 1. isMalformedPath → 404 (그대로)
      // 2. /admin, /admin/ → 302 Location: safeReturnPath(url.searchParams.get('return'))
      //    (Access 로그인을 마치고 돌아온 요청이다)
      // 3. /api/ 로 시작 → routeApi(req, createApiContext(req, env, {
      //      devOwner: import.meta.env.DEV && env.DEV_OWNER === '1',
      //      postExists: (slug) => postIndex.locales(slug).length > 0,
      //    }))
      // 4. 나머지 → paraglideMiddleware (그대로)
    },
    scheduled(controller, env, ctx) {
      ctx.waitUntil(cleanup(env.DB, new Date(controller.scheduledTime)))
    },
  } satisfies ExportedHandler<Env>
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `cleanup.test.ts`: 그제 `view_dedupe` 와 이전 창 `attempts` 를 지우고 `{ views: 1, attempts: 1 }` 을 돌려준다. 오늘 행은 남는다.
  - `prerender.test.ts`
    - true: `'/'`, `'/en/posts'`, `'/261020'`
    - false: `'/posts?tag=a'`, `'/261020#x'`, `'/api/me'`, `'/admin'`, `'/admin/x'`
    - true: `'/administrator'` (다른 경로)
  - `smoke.test.ts` 는 `checkResponse` 판정이 그대로인지 기존 테스트로 확인한다(타입만 넓어진다).

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/api/cleanup.test.ts src/lib/prerender.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 배선한다**
  - `vite.config.ts` 의 `prerender.filter` 를 `({ path }) => shouldPrerender(path)` 로 바꾼다.
  - `scripts/smoke.ts` 는 `method`, `headers`, `body` 를 fetch 에 넘긴다. `CHECKS` 에 다음을 더한다.
    - `{ path: '/api/me', status: 200, contains: ['"owner":false', '"turnstileSiteKey"'] }`
    - `{ path: '/api/views', method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{}', status: 403, contains: ['forbidden_origin'] }`
    - `{ path: '/admin?return=//evil.com', status: 302, location: '/' }`
    - `{ path: '/admin?return=/261020', status: 302, location: '/261020' }`
    - `{ path: '/api/nope', status: 404 }`

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check && pnpm build && pnpm db:migrate:local && pnpm preview --strictPort` (다른 셸에서 `pnpm smoke http://localhost:4173`)
  - 기대
    - 전체 테스트 PASS, 커버리지 기준 통과
    - 스모크 전부 통과
    - `ls dist/client | grep -E '^(api|admin)'` 결과가 없다(프리렌더되지 않음).
    - `grep -rl DEV_OWNER dist/` 결과를 기록한다. 있어도 `false &&` 로 막혀 있는지 번들에서 확인한다.
  - preview 를 끄고 `pkill -f "vite.js preview"; pkill -f "workerd serve"` 로 정리한다.
  - Cron 은 `pnpm dev` 에서 `curl "http://localhost:3000/cdn-cgi/local/scheduled?cron=0+19+*+*+*"` 로 한 번 실행한다. 오류 없이 끝나는지 확인한다.

- [ ] **Step 5: 커밋한다**: `feat: 서버 엔트리에 API·Access 귀환·Cron 정리 연결`

### Task 9: 조회수 화면

**Files:**
- Create: `src/lib/api-client.ts`, `src/lib/view-target.ts`, `src/components/ViewCounts.tsx`
- Test: `src/lib/api-client.test.ts`, `src/lib/view-target.test.ts`
- Modify: `src/components/Layout.tsx`, `src/routes/$slug.tsx`, `messages/ko.json`, `messages/en.json`, `src/styles/layout.css`

**Interfaces:**
- Consumes: DTO 타입 (Task 1), API 경로 (Task 6·7)
- Produces

  ```ts
  // src/lib/api-client.ts
  export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ApiErrorCode | 'network' }
  export function createApiClient(fetchFn?: typeof fetch): {
    me(): Promise<ApiResult<MeDto>>
    listComments(slug: string): Promise<ApiResult<{ comments: CommentDto[] }>>
    createComment(slug: string, input: { author?: string; body: string; password?: string; turnstileToken?: string }): Promise<ApiResult<{ comment: CommentDto }>>
    editComment(id: string, input: { body: string; password?: string; turnstileToken?: string }): Promise<ApiResult<{ comment: CommentDto }>>
    deleteComment(id: string, input: { password?: string; turnstileToken?: string }): Promise<ApiResult<null>>
    recordView(slug?: string): Promise<ApiResult<ViewCountsDto>>
  }
  // 경로 조각은 encodeURIComponent 한다. 쓰기는 content-type: application/json 으로 보낸다
  // fetch 가 throw 하면 { ok: false, status: 0, error: 'network' }
  // 오류 본문을 읽을 수 없으면 error 'unavailable'

  // src/lib/view-target.ts
  export type MatchLike = { routeId: string; status: string; params: Record<string, string>; globalNotFound?: boolean }
  export function viewTarget(matches: MatchLike[]): { slug?: string } | null
  // 매치가 없거나, 어느 매치든 status === 'notFound' 이거나 globalNotFound 면 null (404 는 세지 않는다)
  // routeId '/$slug' 매치가 있으면 { slug: params.slug }, 아니면 {}

  // src/components/ViewCounts.tsx
  export function ViewCountsProvider({ children }: { children: ReactNode }): JSX.Element
  export function useViewCounts(): { site: number | null; post: { slug: string; count: number } | null }
  export function ViewCount({ label, value, order }: { label: string; value: number | null; order: 'before' | 'after' }): JSX.Element
  // <span class="view-count">{label} <span class="view-count-number" style={{visibility: value === null ? 'hidden' : 'visible'}}>{value ?? 0}</span></span>
  // order 'after' 면 숫자 다음에 레이블을 둔다. 호출하는 쪽이 locale === 'en' ? 'after' : 'before' 를 넘긴다
  ```

- 동작
  - Provider 가 라우터 상태를 구독한다.
    - `useRouterState({ select: s => ({ key: s.location.state.__TSR_key ?? s.location.href, status: s.status, matches: s.matches }) })`
  - `status === 'idle'` 일 때만 센다. key 가 직전에 센 key 와 같으면 세지 않는다(ref). StrictMode 에서 effect 가 두 번 돌아도 한 번만 센다.
  - effect cleanup 에서 요청을 취소하지 않는다. 응답이 왔을 때 key 가 이미 바뀌었으면 결과를 버린다.
  - 결과는 이렇게 쓴다.
    - `site` 는 응답값으로 갱신한다.
    - `post` 는 응답에 `post` 가 있을 때 `{ slug, count }` 로 갱신한다.
    - 실패하면 둘 다 null 이다. 숫자는 visibility 로만 감춘다.
  - 표시 위치
    - Post 헤더의 `post-meta` 끝: `ViewCount label={m.view_post_label()}`. 값은 `post?.slug === 현재 slug` 일 때만 쓴다.
    - 푸터: 이제 항상 그린다. `ViewCount label={m.view_site_label()}` 다음에 소셜 목록(있을 때)을 둔다.
  - 메시지: ko `view_post_label: "조회"`, `view_site_label: "전체 조회"` / en `"views"`, `"Total views"`
    - 영어는 `{숫자} views` 가 자연스러워서 en 은 `order="after"` 로 그린다.
  - CSS: `.view-count-number { display: inline-block; min-width: 5ch; font-variant-numeric: tabular-nums; text-align: start }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `api-client.test.ts`: 가짜 fetch 로 확인한다.
    - 메서드, 경로(`/api/posts/261020/comments`, `/api/comments/a%2Fb`), 헤더, 본문 JSON
    - 201 → `{ ok: true, data }`
    - 204 → `{ ok: true, data: null }`
    - 403 `{error:'wrong_password'}` → `{ ok: false, status: 403, error: 'wrong_password' }`
    - 503 본문이 JSON 이 아니면 → `error: 'unavailable'`
    - throw → `network`
    - `recordView()` 는 본문 `{}`, `recordView('261020')` 는 `{"slug":"261020"}`
  - `view-target.test.ts`
    - Lobby 매치 → `{}`
    - `/$slug` 매치 → `{ slug: '261020' }`
    - notFound 매치 → null
    - `globalNotFound` 매치 → null
    - 빈 배열 → null

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/lib/api-client.test.ts src/lib/view-target.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 화면에 붙인다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check`
  - 기대: PASS
  - 그다음 `pnpm dev` 를 띄우고 chrome-devtools 로 확인한다.
    - `/261020` 에서 조회수와 전체 조회수가 보인다.
    - 새로고침하면 전체 조회수만 오른다.
    - `/posts` 로 화면 안 이동을 하면 전체 조회수가 1 오르고, 요청은 한 번만 간다(네트워크 목록).
    - `/does-not-exist` 는 요청을 보내지 않는다.
    - `window.__recoverableErrors` 가 비어 있다.

- [ ] **Step 5: 커밋한다**: `feat: 글별·전체 조회수 표시 추가`

### Task 10: 댓글 화면 (목록 · 작성 · 수정 · 삭제 · Turnstile · 로그인)

**Files:**
- Create: `src/components/comments/CommentSection.tsx`, `CommentItem.tsx`, `CommentForm.tsx`, `Turnstile.tsx`, `src/styles/comments.css`
- Modify: `src/routes/$slug.tsx`, `src/styles/app.css`, `messages/ko.json`, `messages/en.json`, `src/content/date.ts`
- Test: `src/content/date.test.ts`(`formatDateTime`)

**Interfaces:**
- Consumes: `createApiClient` (Task 9), `CommentDto`·`ApiErrorCode`·`MeDto` (Task 1)
- Produces

  ```ts
  // src/content/date.ts
  export function formatDateTime(iso: string, locale: Locale): string   // dateStyle 'medium' + timeStyle 'short', Asia/Seoul

  // src/components/comments/CommentSection.tsx
  export function CommentSection({ slug }: { slug: string }): JSX.Element
  // src/components/comments/Turnstile.tsx
  export function Turnstile({ siteKey, onToken, active }: { siteKey: string; onToken: (token: string | null) => void; active: boolean }): JSX.Element
  // 항상 높이 65px 자리를 그리고, active 일 때만 스크립트를 불러 explicit render 한다
  // (size 'flexible', language 는 현재 언어)
  // 스크립트 주소는 https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit 이고, 모듈 스코프 promise 로 한 번만 넣는다
  // 언마운트하면 turnstile.remove(id)
  // 토큰을 쓴 뒤 새 토큰이 필요하면 부모가 key 를 바꿔 다시 마운트한다
  ```

- 화면 동작
  - **처음 상태**
    - `$slug.tsx` 의 article 아래에 `<CommentSection slug={post.slug} />` 를 둔다. `section` 의 `aria-labelledby` 는 `comments-title` 이다.
    - 프리렌더 HTML 에는 제목 "댓글", 목록 자리(`min-height: 6rem`), 작성 폼 뼈대(이름·내용·비밀번호 입력, Turnstile 자리 65px, 버튼)가 들어간다.
  - **마운트되면**
    - `me()` 와 `listComments(slug)` 를 같이 부른다.
    - 목록이 실패하면 `comment_error_unavailable` 을 목록 자리에 보여 준다. 0개와 구분된다.
  - **Turnstile 지연 로드**
    - `IntersectionObserver` 로 섹션이 화면 근처(`rootMargin: '200px'`)에 오면 `active` 가 된다.
    - 은솔이면 Turnstile 을 그리지 않는다.
  - **은솔일 때**
    - 폼에서 이름과 비밀번호 입력을 빼고, "글쓴이로 쓰는 중" 표시와 로그아웃 링크(`/cdn-cgi/access/logout`)를 보여 준다.
    - 모든 댓글에 수정·삭제 버튼이 있다.
  - **은솔이 아닐 때**
    - 섹션 아래에 작은 링크 "글쓴이로 로그인" → `/admin?return=<encodeURIComponent(현재 pathname)>` 를 둔다.
  - **댓글 한 개**
    - 작성자, 글쓴이 배지(`is_owner`), 시각(`formatDateTime`), 수정됨 표시, 본문(`white-space: pre-wrap`, 텍스트 노드로만 넣는다)을 보여 준다.
    - 수정을 누르면 그 자리에 본문 textarea 를 연다. 은솔이 아니면 비밀번호와 Turnstile 도 같이 연다.
    - 삭제를 누르면 확인 패널(비밀번호 + Turnstile, 은솔은 확인 버튼만)을 연다.
    - 한 번에 하나의 패널만 열린다.
  - **제출**
    - 버튼은 요청 중에 비활성이다.
    - 성공하면 목록을 갱신하고 폼을 비운 뒤 Turnstile 을 다시 마운트한다.
    - 실패하면 `comment_error_<code>` 를 `role="alert"` 로 보여 준다. 그리고 Turnstile 을 다시 마운트한다(토큰은 한 번만 쓸 수 있다).
  - **입력 제한**: 브라우저에도 `maxLength`(20/1000/64), `minLength`(비밀번호 4), `required` 를 건다. 서버 검증이 최종이다.
- 메시지 (ko / en)

  | 키 | ko | en |
  |---|---|---|
  | comments_title | 댓글 | Comments |
  | comments_empty | 아직 댓글이 없어요. | No comments yet. |
  | comment_author | 이름 | Name |
  | comment_body | 내용 | Comment |
  | comment_password | 비밀번호 | Password |
  | comment_password_hint | 수정하거나 지울 때 써요. | Used to edit or delete. |
  | comment_submit | 댓글 남기기 | Post comment |
  | comment_edit | 수정 | Edit |
  | comment_delete | 삭제 | Delete |
  | comment_save | 저장 | Save |
  | comment_cancel | 취소 | Cancel |
  | comment_delete_confirm | 이 댓글을 지울까요? | Delete this comment? |
  | comment_owner_badge | 글쓴이 | Author |
  | comment_edited | 수정됨 | edited |
  | comment_login | 글쓴이로 로그인 | Sign in as author |
  | comment_logout | 로그아웃 | Sign out |
  | comment_writing_as_owner | 글쓴이로 쓰는 중 | Writing as author |
  | comment_turnstile_required | 스팸 확인이 끝난 뒤에 보낼 수 있어요. | Finish the spam check first. |
  | comment_error_invalid_input | 입력을 다시 확인해 주세요. | Check your input. |
  | comment_error_turnstile_failed | 스팸 확인에 실패했어요. 다시 시도해 주세요. | The spam check failed. Try again. |
  | comment_error_wrong_password | 비밀번호가 맞지 않아요. | Wrong password. |
  | comment_error_forbidden_origin | 이 페이지에서 보낸 요청이 아니에요. | This request didn't come from this site. |
  | comment_error_reserved_name | 쓸 수 없는 이름이에요. | That name is reserved. |
  | comment_error_not_found | 댓글이나 글을 찾을 수 없어요. | Comment or post not found. |
  | comment_error_too_many_attempts | 시도가 너무 많아요. 10분 뒤에 다시 해 주세요. | Too many attempts. Try again in 10 minutes. |
  | comment_error_unavailable | 댓글을 불러오지 못했어요. 잠시 뒤에 다시 해 주세요. | Comments are unavailable right now. Try again later. |
  | comment_error_network | 네트워크 연결을 확인해 주세요. | Check your connection. |

- [ ] **Step 1: `formatDateTime` 의 실패하는 테스트를 쓴다**
  - `formatDateTime('2026-10-20T05:07:00Z', 'ko')` 는 `'2026. 10. 20.'` 와 `'14:07'` 또는 `'오후 2:07'` 을 포함한다. Intl 출력 그대로 고정값으로 단언한다.
  - en 은 `'Oct 20, 2026'` 과 `'2:07'` 을 포함한다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/content/date.test.ts`
  - 기대: FAIL (`formatDateTime` 없음)

- [ ] **Step 3: `formatDateTime` 을 구현하고, 컴포넌트·메시지·CSS 를 만든다**
  - 디자인은 계획 1 의 무채색 토큰과 굵기 400/700 을 따른다.
    - 배지는 테두리만 있는 작은 칩이다.
    - 입력창은 `var(--line)` 테두리다.
    - 아이콘은 lucide 데이터 URI 를 `tokens.css` 방식으로 쓴다. 필요하면 pencil, trash-2 를 쓴다.

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check`
  - 기대: PASS
  - 그다음 `pnpm dev`(`.dev.vars` 의 `DEV_OWNER=0`)에서 chrome-devtools 로 확인한다. 이 점검은 Task 11 의 스크린샷 검증 전에 하는 기능 확인이다.
    - 작성 → 목록에 보인다.
    - 수정 → "수정됨"이 붙는다.
    - 삭제 → 사라진다.
    - Turnstile 테스트 위젯이 섹션 근처에서만 불러와진다. 네트워크에서 `challenges.cloudflare.com` 요청 시점으로 확인한다.

- [ ] **Step 5: 커밋한다**: `feat: 댓글 목록·작성·수정·삭제 화면과 Turnstile 연결`

### Task 11: 계획 2 마무리 검증

**Files:**
- Modify: `scripts/smoke.ts` (Post 페이지에 댓글·조회수 자리 레이블 확인 항목 추가)

- [ ] **Step 1: 스모크 항목을 더한다**
  - `{ path: '/261020', status: 200, contains: ['id="comments-title"', 'class="view-count"'] }`
  - `{ path: '/en/261020', status: 200, contains: ['Comments'] }`

- [ ] **Step 2: 전체 자동 검증을 돌린다**
  - 실행: `pnpm test && pnpm check && pnpm build && pnpm db:migrate:local`
  - 그다음 preview 를 띄우고 `pnpm smoke http://localhost:4173` 를 돌린다.
  - 기대: 전부 통과. 커버리지는 functions 100%, lines 90% 이상이다.

- [ ] **Step 3: 스펙 6장 로컬 검증 항목을 직접 확인하고 결과를 ledger 에 남긴다**
  - **dev, `DEV_OWNER=0`**
    - 작성, 수정, 삭제가 된다.
    - 틀린 비밀번호는 403 이다.
    - 같은 IP 에서 틀린 비밀번호를 6번 보내면 429 다. curl 에 `Origin: http://localhost:3000` 과 `turnstileToken: "XXXX.DUMMY.TOKEN.XXXX"` 를 넣어 보낸다.
    - 예약 이름은 403 이다.
    - Origin 이 다르면 403 이다.
  - **평문 없음**: `pnpm exec wrangler d1 execute DB --local --command "SELECT password_hash, password_salt FROM comments"` 결과에 테스트에 쓴 비밀번호 문자열이 없다.
  - **dev, `DEV_OWNER=1`** (재시작)
    - 배지 댓글이 써진다.
    - 남의 댓글을 비밀번호 없이 지울 수 있다.
    - 확인한 뒤 `.dev.vars` 를 `DEV_OWNER=0` 으로 되돌린다.
  - **조회수**
    - 새로고침해도 글별 수는 그대로이고 전체 수만 오른다.
    - D1 장애 흉내
      - `pnpm exec wrangler d1 execute DB --local --command "ALTER TABLE site_views RENAME TO site_views_off"` 를 실행한다.
      - `/api/views` 가 503 이고 숫자 자리 높이가 변하지 않는지 본다(chrome-devtools 로 레이블 요소의 `getBoundingClientRect().height` 를 전후 비교).
      - `ALTER TABLE site_views_off RENAME TO site_views` 로 되돌린다.
  - **CLS**: `/261020` 을 다시 불러온 뒤 `PerformanceObserver({ type: 'layout-shift', buffered: true })` 합계를 기록한다. 목표는 0 이다.
  - **화면**: 1280px 과 390px(iframe) 에서 댓글 영역 스크린샷을 찍어 은솔에게 보여 줄 수 있게 남긴다.
    - 위치: `./temp.local/plan2-screens/`
  - **hydration**: 4개 화면 × 2개 언어에서 `window.__recoverableErrors` 가 비어 있다.
  - **로컬 데이터 정리**: `.wrangler/state` 의 로컬 D1 은 커밋되지 않는다. 확인용 댓글은 지우지 않아도 된다.

- [ ] **Step 4: 커밋한다**: `test: 계획 2 스모크 항목 추가와 마무리 검증`

---

## 다음 계획으로 넘기는 것

- **계획 5 (배포)**
  - `wrangler d1 create eunsol-blog` 로 DB 를 만들고 `database_id` 를 커밋한다. 자동 생성(auto-provisioning)은 쓰지 않는다.
  - 원격 마이그레이션은 deploy 보다 먼저 적용한다.
  - 커스텀 도메인을 붙인 뒤 `workers_dev: false`, `preview_urls: false` 로 둔다. 둘 다 Access 를 우회하는 길이다.
  - Access 앱(`/admin`), 세션 시간(짧게), `ACCESS_*`·`OWNER_EMAIL` 값을 정한다.
    - 허용 이메일을 공개 저장소의 vars 에 둘지 시크릿으로 둘지 은솔에게 묻는다.
  - Turnstile 위젯을 만들고 `TURNSTILE_SITE_KEY` 를 실제 키로 바꾼다. `.dev.vars` 는 계속 테스트 키를 쓴다.
  - 시크릿 셋(`TURNSTILE_SECRET_KEY`, `COMMENT_PEPPER`, `VIEW_SALT_SECRET`)을 등록한다.
  - **PBKDF2 반복 횟수를 Workers Logs 의 CPU 시간으로 실측해 `PASSWORD_ITERATIONS` 를 정한다.**
  - Bot Fight Mode 는 켜지 않는다. 조회수 POST 가 막힐 수 있다.
- **계획 3 (SEO)**: robots 에서 `/api/`, `/admin` 을 막는다(스펙 4.9).
