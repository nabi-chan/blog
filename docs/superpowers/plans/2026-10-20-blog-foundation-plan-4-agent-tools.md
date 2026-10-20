# 블로그 기반 계획 4: 에이전트 작업 도구 (audit · 커맨드 · AGENTS.md · 샘플 글) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 은솔과 에이전트가 글을 쓰고, 번역하고, 저장소를 점검하는 도구를 갖춘다. 샘플 글은 은솔 문체로 다시 쓴다.
- 도구: `pnpm audit:repo`, `pnpm content:check`, Claude 커맨드 4개, AGENTS.md
- 샘플 글: ko 를 다시 쓰고, en 은 translate-post 흐름으로 만든다
- 첫 배포(계획 5) 전에 저장소가 FAIL 없이 점검된다.

**Architecture:**
- 점검 판단은 순수 함수로 둔다. 테스트가 붙고 커버리지에 든다.
  - `src/content/translation-structure.ts`: 번역 구조 비교
  - `src/content/content-checks.ts`: 빠진 태그·용어, 깨진 내부 링크, 메시지 키
  - `src/lib/audit.ts`: 결과 모으기, 예산, live 판정
- 스크립트는 셸 명령과 파일 읽기만 엮는다.
  - `scripts/content-check.ts`: 커맨드가 부르는 글 단위 검사
  - `scripts/audit.ts`: 저장소 전체 검사
- 커맨드(`.claude/commands/*.md`)와 AGENTS.md 는 한국어 문서다. 문체 가이드는 `docs/writing/style-guide.md` 한 곳에 두고 커맨드가 가리킨다.
- 계획 3 리뷰에서 넘긴 SEO 마감 6건을 샘플 글보다 먼저 고친다. 샘플 글에서 바로 드러나는 문제들이다.
  - OG 넘침
  - RSS 인라인 코드 변형
  - en `.md` 링크
  - 사이트 OG 생성 위치
  - llms 언어 링크
  - 언어별 lastmod

**Tech Stack:** 기존 그대로 + `github-slugger`(헤딩 앵커 계산, rehype-slug 와 같은 규칙)

**Spec:** `docs/superpowers/specs/2026-10-20-blog-foundation-design.md`
- 5장(5.1 AGENTS.md, 5.2 커맨드와 audit, 5.3 문체 가이드)을 구현한다.
- 4.3 의 dev draft 배지, 4.11 의 샘플 글, 6 의 `pnpm audit:repo` 완료 조건도 구현한다.
- 미룬 지적을 처리한다.
  - 계획 1: dev draft 배지, 깨진 내부 링크 검사, 번들 예산, 표 넘침
  - 계획 3: 위 SEO 마감 6건
- 실제 배포, `--live` 의 프로덕션 실행, 보안 헤더 설정은 계획 5 에서 한다.

## Global Constraints

- 스펙 5.2 의 `scripts/audit.mjs` 는 이 저장소 관례대로 `scripts/audit.ts` 로 둔다. Node 26 이 TS 를 바로 실행하고, 다른 스크립트도 `.ts` 다.
- Node 로 바로 실행하는 스크립트가 부르는 lib 은 `~/` 별칭 대신 상대 경로(`../x.ts`)로 import 한다(계획 3 판정).
- **Worker 크기 한도는 압축 전 64 MiB 다** (스펙 3장 정정). 스펙 5.2 의 "무료 플랜 3MB 대비"는 낡은 값이라 쓰지 않는다.
- audit 결과 단계
  - FAIL: 배포를 막는다. exit 1
  - WARN: 고쳐야 하지만 막지는 않는다
  - INFO: 기록만 한다
  - PASS
  - 결과는 `.audit-report.json` 에 쓴다(이미 gitignore).
- 커맨드는 **커밋하지 않는다.** 글·번역 파일과 `tags.yaml`·`glossary.yaml` 변경만 만들고, 바꾼 것을 은솔에게 보여 준다.
- 샘플 글은 은솔 이름으로 나간다. 사실관계는 이 저장소의 실제 구현과 커밋 이력에만 기대고, 지어낸 경험·수치는 쓰지 않는다.
- 첫 배포 전에 은솔이 내용을 확인한다(스펙 4.11). 이 계획의 마지막 단계는 은솔에게 확인을 받는 것이다.
- 커밋은 계획 2·3 과 같다. main 에 바로 커밋하고, 메시지는 한국어로 쓰고, `Co-Authored-By` / `Claude-Session` 두 줄을 붙인다.

## Review Focus

1. **낡은 번역 판정과 구조 비교가 정상 번역을 막지 않는다.** 대상: 링크 텍스트·이미지 대체 텍스트·Callout 본문·코드 주석은 번역해도 통과해야 하고, 코드 블록 개수·언어나 `:::original` 글자가 바뀌면 FAIL 이어야 한다
   - Task 2 테스트
2. **CI 환경(`.dev.vars` 없음, 얕은 clone)에서도 audit 기본 검사가 같은 결론을 낸다.** 대상: wrangler types diff, 마이그레이션 수정 검사
   - Task 4 테스트와 `.dev.vars` 를 치운 상태 실행
3. **깨진 내부 링크 검사가 한글 헤딩 앵커와 `/en` 링크를 맞게 다룬다.** 대상: `/261020#구성`, `/en/261020#structure`, 번역 없는 글로 가는 en 링크
   - Task 2 테스트
4. **OG 카드가 어떤 제목에서도 날짜 줄을 덮지 않는다.** 대상: 긴 라틴 단어, 띄어쓰기 없는 긴 한글, 135자 제목
   - Task 1 테스트(어림 줄 수)와 PNG 세 장 눈 확인
5. **샘플 글에 지어낸 사실이 없다.** 대상: 수치, 날짜, 기능 설명
   - Task 8 에서 문장마다 근거(파일·커밋)를 표로 남기고, 은솔 확인 전에 스스로 대조한다

---

### Task 1: SEO 마감 (계획 3 리뷰에서 넘긴 6건)

**Files:**
- Modify: `src/og/card.ts`, `src/og/card.test.ts`, `src/seo/rss.ts`, `src/seo/rss.test.ts`, `src/markdown/agent-markdown.ts`, `src/markdown/agent-markdown.test.ts`, `content-collections.ts`, `vite.config.ts`, `src/seo/llms.ts`, `src/seo/llms.test.ts`, `src/seo/sitemap.ts`, `src/seo/sitemap.test.ts`
- Create: `src/og/site-plugin.ts`

**Interfaces:**
- Produces

  ```ts
  // src/og/card.ts
  export function fitOgTitle(title: string): { text: string; fontSize: number; lines: number }
  // 1. 18자를 넘는 공백 없는 라틴 토큰에 18자마다 U+200B 를 넣어 줄을 나눌 수 있게 한다
  // 2. [76, 68, 60, 52, 44] 중 어림 줄 수 3 이하인 가장 큰 크기를 고른다
  // 3. 44 에서도 넘치면 3줄에 들 만큼 잘라 '…' 를 붙인다
  // postCard 는 fitOgTitle 결과를 쓰고, 제목 상자에 maxHeight = 3줄 높이 + overflow: 'hidden' 을 준다
  // ogTitleFontSize 는 fitOgTitle(title).fontSize 를 돌려주는 래퍼로 남긴다

  // src/seo/rss.ts: absolutizeHtml 은 실제 태그(<태그 …>) 안의 속성만 바꾼다. 글자(&lt;a href="#x"&gt;)는 그대로 둔다

  // src/markdown/agent-markdown.ts
  export function localizeMarkdownLinks(markdown: string, locale: Locale, enSlugs: ReadonlySet<string>): string
  // link·definition 노드의 url 이 사이트 내부 글 링크면 resolvePostLink(src/markdown/link.ts) 규칙으로 바꾼다
  // ko 는 입력 그대로다. 위치 기반 교체라 나머지 글자는 그대로 둔다
  // content-collections 의 enPosts.markdown 은 absolutizeMarkdownImages 다음에 이 함수를 거친다

  // src/og/site-plugin.ts
  export function ogSitePlugin(): Plugin   // vite 플러그인. buildStart 에서 언어마다 public/og/<locale>/site.png 를 만든다
  // lobbyIntros 변환에서 만들던 것을 옮긴다. 소개글이 없어도 사이트 기본 OG 가 생긴다

  // src/seo/sitemap.ts
  export type SitemapEntry = { path: string; lastmod?: Partial<Record<Locale, string>>; locales: Locale[] }
  // 언어마다 따로 lastmod
  // 목록 페이지: 그 언어 목록의 최근 수정일
  // 글: 두 언어 같은 값

  // src/seo/llms.ts: buildLlmsTxt 에 다른 언어 llms.txt 링크를 더한다
  //   ko: "- [English](https://nabichan.me/en/llms.txt)"
  //   en: "- [한국어](https://nabichan.me/llms.txt)"
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `card.test.ts`
    - `fitOgTitle` 이 다음 세 제목에서 모두 `lines <= 3` 이다.
      - `'Supercalifragilisticexpialidocious'.repeat(3)`
      - `'띄어쓰기없는아주긴한글제목'.repeat(8)`
      - 135자 문장
    - 135자 문장은 `text.endsWith('…')` 이다.
    - 짧은 제목은 그대로이고 76 이다.
    - postCard 제목 상자에 `overflow: 'hidden'` 과 `maxHeight` 가 있다.
  - `rss.test.ts`
    - `<p><code>&lt;a href="#top"&gt;</code></p>` 는 그대로 나온다.
    - 같은 문서의 실제 `<a href="#x">` 는 바뀐다.
  - `agent-markdown.test.ts`
    - `localizeMarkdownLinks('[구조](/261020#structure) [외부](https://x.com)', 'en', new Set(['261020']))` → `/en/261020#structure` 로 바뀌고 외부 링크는 그대로다.
    - 번역 없는 글(`/261021`)은 그대로 둔다(resolvePostLink 규칙).
    - ko 는 입력 그대로다.
  - `sitemap.test.ts`
    - ko 전용 글이 더 최근이면 en `/` 의 lastmod 는 en 글 날짜다.
    - 기존 테스트를 새 `lastmod` 모양으로 고친다.
  - `llms.test.ts`: ko 결과에 `/en/llms.txt`, en 결과에 `/llms.txt` 링크가 있다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/og src/seo src/markdown/agent-markdown.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현한다**
  - `ogSitePlugin` 은 `vite.config.ts` 의 `contentCollections()` 다음에 둔다.
  - `content-collections.ts` 의 lobbyIntros 에서 site.png 생성을 뺀다.
  - `OG_VERSION` 을 2 로, `RENDER_VERSION` 을 4 로 올린다.

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check && pnpm build`
  - 기대: PASS
  - 위 세 제목으로 카드를 그려 `temp.local/plan4-og/` 에 저장하고 눈으로 본다. 날짜 줄을 덮지 않아야 한다.
  - `dist/client/en/261020.md` 의 내부 링크가 `/en/261020#…` 다.

- [ ] **Step 5: 커밋한다**: `fix: 계획 3 리뷰에서 넘긴 SEO 마감 (OG 넘침, RSS 코드 글자, en 원문 링크, 사이트 OG, llms 언어 링크, 언어별 lastmod)`

### Task 2: 번역 구조 비교 · 콘텐츠 검사 · `pnpm content:check`

**Files:**
- Create: `src/content/translation-structure.ts`, `src/content/content-checks.ts`, `scripts/content-check.ts`
- Test: `src/content/translation-structure.test.ts`, `src/content/content-checks.test.ts`
- Modify: `package.json`(`"content:check": "node scripts/content-check.ts"`, `pnpm add -D github-slugger@^2.0.0`)

**Interfaces:**
- Produces

  ```ts
  // src/content/translation-structure.ts — 스펙 5.2 translate-post 3단계의 검사 대상
  export type Structure = {
    headings: number[]                    // 헤딩 깊이 순서
    links: string[]                       // 링크 목적지 (이미지 제외)
    images: string[]                      // 이미지 경로
    callouts: string[]                    // '> [!TIP]' 종류 순서 (소문자)
    code: Array<string | null>            // 코드 블록 언어 순서 (개수 = 길이)
    directives: string[]                  // 컨테이너·리프 디렉티브 이름 순서 (details, see-also, quote, translation, original, widget-*)
    terms: string[]                       // :term 의 key 순서
    originals: string[]                   // :::original 안 글자 (그대로)
  }
  export function translationStructure(markdown: string): Structure
  export function compareStructure(ko: Structure, en: Structure): string[]
  // 다른 항목마다 한국어 한 줄 (예: "코드 블록 언어가 다릅니다: ko [ts, sh] / en [ts]")
  // 링크 텍스트, 대체 텍스트, 문단 글자, 코드 블록 안 글자(주석 번역 허용)는 비교하지 않는다

  // src/content/content-checks.ts
  export function missingTagLabels(tagKeys: string[], labels: Array<{ key: string }>): string[]
  export function missingTerms(termKeys: string[], glossary: Array<{ key: string }>): string[]
  export function headingAnchors(markdown: string): Set<string>   // github-slugger 로 rehype-slug 와 같은 id
  export type PostSourceInfo = { slug: string; locale: Locale; markdown: string }
  export function brokenInternalLinks(post: PostSourceInfo, site: { posts: Map<string, { ko: Set<string>; en?: Set<string> }> }): string[]
  // 사이트 내부 링크만 본다: '/', '/posts', '/<slug>', '/<slug>#앵커', '#앵커', '/en/…'
  // 없는 글이나 그 글에 없는 앵커면 "링크 → 이유" 한 줄
  // en 원문의 '/<slug>' 는 번역이 있으면 en 앵커로 본다 (현지화 규칙과 같게)
  export function messageKeyDiff(ko: Record<string, unknown>, en: Record<string, unknown>): { onlyKo: string[]; onlyEn: string[] }
  // '$schema' 는 뺀다
  ```

- `scripts/content-check.ts [--post <slug>]`: 글 폴더를 직접 읽는다(Content Collections 생성물을 import 하지 않는다).
  - 검사하는 것
    - 구조 비교(en 이 있을 때)
    - 빠진 태그 표시 이름과 용어
    - 깨진 내부 링크
  - 결과는 한국어 목록으로 내고, 하나라도 있으면 exit 1 이다.
  - `--post` 가 없으면 모든 글을 본다.
  - 마지막에 `content-collections build` 를 돌려 스키마·slug·낡은 번역 오류도 잡는다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `translation-structure.test.ts`
    - 지금 샘플 글 ko/en 쌍(테스트 안에 축약본)은 `compareStructure` 결과가 빈 배열이다.
    - 다르면 각각 한 줄씩 나온다.
      - 헤딩 깊이 다름
      - 코드 블록 하나 빠짐
      - 코드 언어 다름
      - Callout 종류 다름(TIP → NOTE)
      - 이미지 경로 다름
      - 링크 목적지 다름
      - `:term` key 다름
      - `:::original` 글자 한 글자 다름
      - widget 이름 다름
    - 통과해야 하는 것: 링크 텍스트, 대체 텍스트, Callout 본문, 코드 블록 안 주석만 다를 때는 빈 배열이다.
  - `content-checks.test.ts`
    - `missingTagLabels(['meta', 'llm'], [{key:'meta'}])` = `['llm']`
    - `missingTerms` 도 같은 방식이다.
    - `headingAnchors('## 구성\n### `code` 예시')` 에 `구성`, `code-예시` 가 있다.
    - `brokenInternalLinks`
      - `/261020#구성` 은 통과한다.
      - `/261099` 는 "없는 글"이다.
      - `/261020#없음` 은 "없는 앵커"다.
      - `#구성` 은 같은 글 앵커라 통과한다.
      - en 원문의 `/261020#structure` 는 en 앵커에서 찾는다.
      - `/posts`, `/` 는 통과한다.
      - 외부 링크는 보지 않는다.
    - `messageKeyDiff`: 한쪽에만 있는 키를 낸다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/content`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 스크립트를 만든다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check && pnpm content:check`
  - 기대: PASS. 지금 샘플 글에서 문제 0개
  - en 파일의 코드 블록 하나를 잠시 지우고 `pnpm content:check --post 261020` 이 exit 1 과 그 줄을 내는지 본 뒤 되돌린다.

- [ ] **Step 5: 커밋한다**: `feat: 번역 구조 비교·콘텐츠 검사와 pnpm content:check 추가`

### Task 3: dev draft 배지 (스펙 4.3)

**Files:**
- Modify: `src/routes/$slug.tsx`, `src/components/PostList.tsx`, `messages/ko.json`, `messages/en.json`, `src/styles/layout.css`

- 동작
  - `post.draft` 면 글 헤더 날짜 앞과 목록 항목 제목 옆에 "초안"/"Draft" 배지를 단다.
  - 프로덕션에는 draft 글이 없으니 dev 에서만 보인다.
  - 배지 모양은 댓글 "글쓴이" 배지와 같은 테두리 칩이다.
- 메시지: `post_draft` (ko "초안", en "Draft")

- [ ] **Step 1: 확인용 draft 글을 임시로 만든다**
  - `content/posts/261021/index.ko.md` (date 2026-10-21, `draft: true`)
- [ ] **Step 2: 구현한다**
- [ ] **Step 3: 확인한다**
  - dev 에서 확인한다.
    - `/261021` 헤더와 `/posts` 목록에 배지가 있다.
    - `/261020` 에는 배지가 없다.
    - hydration 오류가 없다.
  - `pnpm build` 결과에는 261021 이 없다.
  - 확인한 뒤 임시 글 폴더를 지운다.
- [ ] **Step 4: 실행한다**
  - 실행: `pnpm test && pnpm check`
  - 기대: PASS
- [ ] **Step 5: 커밋한다**: `feat: dev 에서 draft 글에 초안 배지 표시`

### Task 4: 타입 고정과 `pnpm audit:repo` 기본 검사

**Files:**
- Create: `src/lib/audit.ts`, `scripts/audit.ts`
- Test: `src/lib/audit.test.ts`
- Modify: `wrangler.jsonc`(`secrets.required`), `worker-configuration.d.ts`(재생성), `src/server.ts`, `package.json`(`"audit:repo": "node scripts/audit.ts"`)

**Interfaces:**
- Produces

  ```ts
  // src/lib/audit.ts
  export type AuditStatus = 'PASS' | 'WARN' | 'FAIL' | 'INFO'
  export type AuditResult = { id: string; status: AuditStatus; message: string; details?: string[] }
  export function summarize(results: AuditResult[]): { counts: Record<AuditStatus, number>; exitCode: 0 | 1 }
  export function formatResult(result: AuditResult): string          // "[FAIL] 번역: 261020 낡음" + details 들여쓰기
  export function translationResults(posts: Array<{ slug: string; en: 'missing' | 'stale' | 'machine' | 'reviewed'; structure: string[] }>): AuditResult[]
  // en 없음 INFO, 낡음 FAIL, 구조 불일치 FAIL, machine INFO, reviewed PASS
  export function changedMigrations(nameStatus: string): string[]
  // `git diff --name-status` 출력에서 migrations/ 의 M·D·R 줄 → FAIL 대상. A 는 정상
  export function pendingMigrations(listOutput: string): string[]
  // `wrangler d1 migrations list` 출력에서 미적용 파일 이름. "No migrations to apply" 면 []
  ```

- **타입 고정** (Review Focus 2)
  - `wrangler.jsonc` 에 `"secrets": { "required": ["TURNSTILE_SECRET_KEY", "COMMENT_PEPPER", "VIEW_SALT_SECRET"] }` 를 둔다.
  - 그러면 `wrangler types` 가 `.dev.vars` 를 보지 않아서 CI 와 로컬 결과가 같다.
  - `DEV_OWNER` 는 Env 타입에서 빠진다. `src/server.ts` 는 `(env as Env & { DEV_OWNER?: string }).DEV_OWNER` 로 읽는다.
  - **확인**: `.dev.vars` 의 `DEV_OWNER=1` 이 dev 에서 여전히 읽히는지 `/api/me` 로 본다.
    - 읽히지 않으면 `secrets.required` 를 되돌린다.
    - 그 경우 audit 의 types 검사는 `.dev.vars.example` 을 `.dev.vars` 로 임시 복사한 상태에서 비교한다. ledger 에 Ruling 으로 남긴다.
- `scripts/audit.ts` 기본 검사

  | 검사 | 방법 | 결과 |
  |---|---|---|
  | typecheck | `pnpm check` | 실패 FAIL |
  | test | `pnpm test` | 실패 FAIL |
  | 콘텐츠 | `content:check` 와 같은 함수(구조·태그·용어·링크) + `content-collections build` | 문제 FAIL |
  | 번역 | `translationResults` | 표 그대로 |
  | 메시지 키 | `messageKeyDiff(messages/ko.json, messages/en.json)` | 차이 FAIL |
  | 타입 | `wrangler types --strict-vars=false <임시 파일>` 과 커밋된 `worker-configuration.d.ts` 비교 | 다르면 FAIL |
  | 로컬 D1 | `wrangler d1 migrations list DB --local` → `pendingMigrations` | 있으면 FAIL |
  | 마이그레이션 수정 | `git diff --name-status HEAD -- migrations`(작업 트리) + `git diff --name-status HEAD~1 HEAD -- migrations`(마지막 커밋) → `changedMigrations` | 있으면 FAIL |

  - lint 는 도구를 두지 않으므로 검사하지 않는다(스펙: 도구를 둘 경우).
  - 결과를 `.audit-report.json` 에 쓰고, 화면에 `formatResult` 로 출력한다. FAIL 이 있으면 exit 1 이다.
  - 얕은 clone 이라 `HEAD~1` 이 없으면 마지막 커밋 비교는 INFO "확인 못 함" 이다.

- [ ] **Step 1: 실패하는 테스트를 쓴다** (`audit.test.ts`)
  - `summarize`: FAIL 하나면 exitCode 1, WARN·INFO 만이면 0
  - `formatResult`: details 를 두 칸 들여 쓴다.
  - `translationResults`: 다섯 상태가 각각 표의 단계로 나온다. 구조 불일치는 details 에 줄이 있다.
  - `changedMigrations("M\tmigrations/0001_a.sql\nA\tmigrations/0003_b.sql\nR100\tmigrations/0002_x.sql\tmigrations/0002_y.sql")` = 첫째와 셋째
  - `pendingMigrations`
    - wrangler 표 출력(`│ 0003_x.sql │`) 에서 파일 이름을 뽑는다.
    - "✅ No migrations to apply!" 는 `[]` 다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/lib/audit.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 타입 고정과 구현을 한다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm audit:repo`
  - 기대: FAIL 0. `.audit-report.json` 이 생긴다.
  - `.dev.vars` 를 잠시 다른 이름으로 옮긴 뒤 `pnpm audit:repo` 를 다시 돌려 타입 검사가 같은 결론인지 본다. 끝나면 되돌린다.

- [ ] **Step 5: 커밋한다**: `feat: pnpm audit:repo 기본 검사와 wrangler 타입 고정`

### Task 5: `audit:repo --build` 와 `--live`

**Files:**
- Modify: `src/lib/audit.ts`, `src/lib/audit.test.ts`, `scripts/audit.ts`

**Interfaces:**
- Produces

  ```ts
  export const BUDGETS = { clientJsGzipBytes: <측정값의 1.3배를 10KB 단위로 올림>, workerBytes: 64 * 1024 * 1024 } as const
  export function budgetResults(input: { clientJsGzipBytes: number; workerBytes: number }): AuditResult[]
  // 클라이언트 JS: 넘으면 FAIL
  // Worker: 넘으면 FAIL, 절반 넘으면 WARN
  export function leakedPostText(assetTexts: string[], posts: Array<{ slug: string; marker: string }>): string[]
  // 클라이언트 에셋에 글 본문 문장이 실린 글 slug. marker 는 본문의 긴 문장 하나
  export function median(values: number[]): number
  export function securityHeaderGaps(headers: Headers): string[]
  // strict-transport-security, x-content-type-options, referrer-policy, content-security-policy 중 없는 것
  export function liveResults(input: {
    pages: Array<{ path: string; status: number; ttfbMs: number[]; cache: string | null }>
    headers: Headers
    sitemapUrls: string[]
    draftSlugs: string[]
    untranslated: Array<{ slug: string; status: number }>
    metaUrlStatuses: Array<{ url: string; status: number }>
    apiStatus: number
    redirect?: { status: number; location: string | null }
  }): AuditResult[]
  // 주요 경로가 200 이 아니면 FAIL, TTFB 중앙값·cf-cache-status 는 INFO
  // 보안 헤더 빠짐 WARN
  // sitemap 에 draft FAIL
  // 번역 없는 /en/<slug> 가 404 가 아니면 FAIL
  // 메타 URL 이 200 이 아니면 FAIL
  // /api/me 가 200 이 아니면 FAIL
  // nabi.kim 이 301 → https://nabichan.me/ 가 아니면 FAIL (redirect 가 없으면 INFO "건너뜀")
  ```

- `--build`
  1. 클린 빌드(`pnpm build`)
  2. `dist/client/assets/*.js` 의 gzip 합(node:zlib) → 예산
  3. `dist/server` 전체 바이트 → Worker 예산
  4. `leakedPostText`: 글마다 본문에서 40자 넘는 첫 문단 문장을 marker 로 고른다.
  5. 산출물 존재: sitemap, robots, rss 두 개, llms 셋, 글별 `.md`·OG, 사이트 OG
  6. preview 를 띄워 `scripts/smoke.ts` 를 돌린다(메타 URL 200 포함). 끝나면 preview 를 닫는다.
- `--live [--base-url <url>]`
  - 기본 대상은 `https://nabichan.me` 다.
  - 원격 D1 미적용 마이그레이션: `wrangler d1 migrations list DB --remote`. 인증이 없거나 DB 가 없으면 WARN "확인 못 함"이다.
  - `nabi.kim` 검사는 기본 대상일 때만 한다.
- 처음 `--build` 를 돌린 측정값으로 `BUDGETS.clientJsGzipBytes` 를 정한다. 숫자는 AGENTS.md(Task 6)에도 적는다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `budgetResults`: 예산 안이면 PASS, 넘으면 FAIL, Worker 가 절반을 넘으면 WARN
  - `leakedPostText`: marker 가 든 에셋이면 그 slug 를 낸다.
  - `median([30, 10, 20])` = 20, `median([4, 1, 3, 2])` = 2.5
  - `securityHeaderGaps`: 비어 있으면 네 개를 모두 낸다.
  - `liveResults`
    - 모든 항목이 정상이면 FAIL 이 없다.
    - draft slug 가 sitemap 에 있으면 FAIL 이다.
    - 번역 없는 en 이 200 이면 FAIL 이다.
    - redirect 가 없으면 INFO 다.
- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/lib/audit.test.ts`
  - 기대: FAIL
- [ ] **Step 3: 구현한다.**
- [ ] **Step 4: 확인한다**
  - `pnpm audit:repo --build`: FAIL 0. 측정값을 ledger 에 남긴다.
  - preview 를 띄운 상태에서 `pnpm audit:repo --live --base-url http://localhost:4173`
    - 기대: FAIL 0
    - 보안 헤더는 WARN(계획 5 범위), 원격 D1 은 WARN(아직 없음), nabi.kim 은 INFO 다.
- [ ] **Step 5: 커밋한다**: `feat: audit:repo --build(예산·유출·산출물·스모크)와 --live 검사`

### Task 6: AGENTS.md · CLAUDE.md · 문체 가이드

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md`(`@AGENTS.md` 한 줄), `docs/writing/style-guide.md`

- `AGENTS.md` (한국어, 스펙 5.1 항목 + 이 저장소에서 실제로 밟은 것)
  - 명령과 검증 순서
    - `pnpm check` → `pnpm test` → `pnpm audit:repo` (`--build` 는 혼자 직렬로)
    - 그 밖: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm smoke <url>`, `pnpm content:check`, `pnpm content:rehash --post <slug>`, `pnpm db:migrate:local`, `pnpm indexnow`
  - 빌드 금지 상황
    - 개발 서버가 떠 있을 때 빌드를 돌리지 않는다. `.content-collections`, `src/paraglide`, `dist`, `public/og`, `public/content-assets` 를 서로 덮어쓴다.
    - `pnpm check`·`pnpm test` 의 Paraglide 컴파일은 `project.inlang/paraglide.config.ts` 를 읽는다. 설정은 거기에만 둔다.
  - ko 원문의 본문·제목·설명을 고치면 push 전에 `/translate-post` 또는 `pnpm content:rehash --post <slug>` 를 한다.
  - 마이그레이션은 추가만 하고, 커밋한 파일은 고치지 않는다.
  - 영역별 주의
    - Markdown 파이프라인: 렌더 결과 모양이 바뀌면 `RENDER_VERSION`, OG 카드가 바뀌면 `OG_VERSION` 을 올린다.
    - i18n: 언어는 URL 로만 정한다. 서버 함수에는 locale 을 입력으로 넘긴다.
    - Access: 은솔 판정은 fail closed 다. `DEV_OWNER` 는 dev 전용이다.
    - API: 쓰기 요청은 Origin 과 JSON 만 받는다. PBKDF2 전에 Turnstile 과 시도 제한을 둔다.
  - 프리렌더
    - `/api/*`, `/admin` 은 프리렌더하지 않는다.
    - SEO 산출물과 `.md` 는 `src/lib/prerender.ts` 목록으로 넣는다.
  - CSS: 새 수제 CSS 는 `src/styles/` 의 별도 파일에 두고 `app.css` 에서 import 한다. 배포 확인은 배포된 CSS 파일을 직접 본다.
  - 예산 수치(Task 5 측정값)와, 그 수치를 바꿀 때 `BUDGETS` 를 같이 고친다는 규칙
  - 로컬 준비: `cp .dev.vars.example .dev.vars`, `pnpm db:migrate:local`
- `docs/writing/style-guide.md`: 스펙 5.3 을 커맨드가 따라 쓸 수 있는 규칙 목록으로 옮긴다.
  - 각 규칙에 짧은 좋은 예·나쁜 예를 하나씩 둔다. 예문은 새로 지어 쓰고, about/cv 원문은 쓰지 않는다.
  - AI 문체 신호 점검 목록을 넣는다.
    - 빈 수사, 과한 접속사
    - "~할 수 있습니다" 남발, 번역투
    - 같은 문장 틀 반복
- [ ] **Step 1: 세 파일을 쓴다.**
- [ ] **Step 2: AGENTS.md 의 명령을 하나씩 실제로 돌려 본다.** 문서에 적은 명령 이름과 동작이 맞는지 본다. `build`·`dev` 는 이미 확인한 결과를 쓴다.
- [ ] **Step 3: 커밋한다**: `docs: AGENTS.md·문체 가이드 추가`

### Task 7: Claude 커맨드 4개

**Files:**
- Create: `.claude/commands/write-post.md`, `refine-post.md`, `translate-post.md`, `audit.md`

- 공통
  - frontmatter 에 `description`, `argument-hint` 를 둔다. 본문은 한국어다.
  - 인자는 `$ARGUMENTS` 로 받는다.
  - 문체는 `docs/writing/style-guide.md` 를 읽게 한다.
  - 커밋하지 않는다. 마지막에 바꾼 파일과 은솔이 확인할 것을 목록으로 보여 준다.
- `write-post`: 스펙 5.2 의 1~7단계를 그대로 옮긴다.
  - 슬러그 규칙(YYMMDD = date, 하루 한 편), frontmatter 스키마, 이미지는 글 폴더에 둔다는 규칙을 넣는다.
  - 5단계: `pnpm content:check --post <slug>` 출력의 "빠진 태그·용어"를 `content/tags.yaml`·`content/glossary.yaml` 에 ko/en 으로 채우고, 추가한 항목을 따로 보여 준다.
  - 6단계: `pnpm content:check --post <slug>` 가 통과할 때까지 고친다.
- `refine-post`: 스펙 5.2 그대로 옮긴다. `updated` 규칙과 번역 영향 판단(translate-post / content:rehash)을 넣는다.
- `translate-post`: 스펙 5.2 의 0~6단계를 옮긴다.
  - 0단계 판정 방법
    - 새 번역: `index.en.md` 가 없다.
    - 갱신: `sourceHash` 가 다르다.
    - 갱신이면 `git log -1 --format=%H -- <en 파일>` 이후의 ko diff 를 쓴다.
  - 3단계: `pnpm content:check --post <slug>` 의 구조 비교로 확인한다.
  - 4단계: 2차 리뷰는 새 서브에이전트에게 지적만 시킨다(원문·번역 경로를 넘긴다).
  - `sourceHash` 는 `pnpm content:rehash --post <slug>` 로 넣는다(손으로 계산하지 않는다).
  - `translationStatus: machine` 으로 두고, `reviewed` 는 은솔 확인 뒤에만 바꾼다.
- `audit`: 스펙 5.2 의 0~3단계를 옮긴다.
  - 레인 4개(라우트/i18n, SEO, 런타임/데이터, 콘텐츠/번역)
  - 서브에이전트 공통 규칙: 빌드·dev 금지, 파일 수정 금지, AGENTS.md 먼저 읽기
  - 출력 형식: 위치, 실패 시나리오, 심각도, CONFIRMED/SUSPECTED
- [ ] **Step 1: 네 파일을 쓴다.**
- [ ] **Step 2: 문서와 실제 명령·경로를 대조한다.** 커맨드에 적은 모든 `pnpm` 명령과 파일 경로가 실제로 있는지 `grep` 과 실행으로 확인한다.
- [ ] **Step 3: 커밋한다**: `feat: write-post·refine-post·translate-post·audit 커맨드 추가`

### Task 8: 샘플 글 다시 쓰기 (ko)

**Files:**
- Modify: `content/posts/261020/index.ko.md`, `content/posts/261020/diagram.svg`(실제 구성도), `content/tags.yaml`, `content/glossary.yaml`, `src/styles/prose.css`(표 넘침)
- Create: `content/posts/261020/<화면 캡처>.png`
- Delete: `content/posts/261020/screenshot.png`(자리표시)

- 글 원칙
  - 주제: "이 블로그를 어떻게 만들었나" (스펙 4.11)
  - `/write-post` 커맨드 흐름을 그대로 따른다. 이 작업이 커맨드의 첫 실사용 검증이다.
  - 쓸 것: 은솔 문체(합니다체, `## X?` 정의로 시작, 짧은 문장, 마지막에 `## 글을 마치며` → `### See Also...`)
  - 사실 근거: 스펙, 계획 1~4, 커밋 이력, 실제 코드에만 기댄다. 은솔의 감정이나 동기는 지어내지 않는다. 동기 문장은 스펙 1장 "의도"에 있는 것만 쓴다.
- 반드시 들어갈 기능 (스모크·기능 확인용)
  - 코드 블록(하이라이팅)과 Callout 하나 이상
  - Figure + 글 옆 이미지
    - 구성도 SVG: 무채색, 직접 그린다
    - 실제 화면 캡처 PNG: chrome-devtools 로 dev 화면을 찍는다
  - `?w=` 로 폭을 줄인 인라인 이미지 하나
  - 목차가 생길 만큼의 `##`/`###`
  - 같은 글 안 내부 링크(`/261020#…`)
  - details, see-also, 원문 병기 quote, `:term`, `:::widget-counter-demo`
  - 표 하나(스택 요약). 390px 폭에서 가로 넘침을 확인하고, 넘치면 `.prose table` 에 가로 스크롤을 준다.
  - 알 수 없는 텍스트 디렉티브가 글자로 남는 경우 하나. 예: 언어 쌍을 말하는 문장의 `ko:en`
- 근거 표: 글의 사실 문장마다 근거(파일 경로 또는 커밋)를 `temp.local/plan4-sample/sources.md` 에 표로 남긴다(Review Focus 5).
- 태그·용어: 커맨드 5단계대로 빠진 항목을 `tags.yaml`·`glossary.yaml` 에 ko/en 으로 넣는다.

- [ ] **Step 1: 근거 표와 개요(소제목 목록)를 먼저 쓴다.**
- [ ] **Step 2: 구성도 SVG 와 화면 캡처를 만든다.**
- [ ] **Step 3: 본문을 쓰고 커맨드 4단계 체크리스트(SEO, 신뢰, AI 문체 신호, 맞춤법)를 점검한다.**
- [ ] **Step 4: 확인한다**
  - 실행: `pnpm content:check --post 261020`
  - 기대: ko 만 바뀌었으니 en 은 낡음 FAIL 이 맞다. 이건 Task 9 가 푼다. 그 밖의 문제는 0개여야 한다.
- [ ] **Step 5: 커밋한다**: `content: 샘플 글을 은솔 문체로 다시 씀 (ko)`
  - en 이 낡아 빌드가 실패하는 상태로 커밋된다. Task 9 와 같은 날 이어서 하고, push 는 Task 9 뒤에만 한다.

### Task 9: 샘플 글 번역 (translate-post 흐름) · 스모크 갱신

**Files:**
- Modify: `content/posts/261020/index.en.md`, `content/tags.yaml`, `content/glossary.yaml`, `scripts/smoke.ts`

- `/translate-post 261020` 커맨드 흐름을 그대로 따른다.
  - 0단계: 판정은 "갱신"이다. 이번에는 ko 가 통째로 바뀌어서 전체를 번역한다.
  - 1·2단계: `sourceHash` 는 `pnpm content:rehash --post 261020` 으로 넣는다. `translationStatus: machine` 이다.
  - 3단계: `pnpm content:check --post 261020` 의 구조 비교가 통과할 때까지 맞춘다.
  - 4단계: 새 서브에이전트에게 원문 대조 리뷰(지적만)를 맡긴다. 지적은 메인이 고친다.
  - 5단계: 빠진 en 태그·용어를 채운다.
  - `reviewed` 로 바꾸지 않는다(은솔 확인 뒤).
- 스모크 갱신: 자리표시 문구(`kitchen-sink-ko`, `kitchen-sink-en`, `key:value`)에 기대던 항목을 실제 글에 맞게 바꾼다.
  - 제목: 글의 실제 제목 문자열
  - 알 수 없는 디렉티브 보존: 글에 쓴 `ko:en`
  - 나머지 구조 표식(data-callout, figcaption, picture, details, see-also, bilingual-quote, data-term-key, data-widget)은 그대로 둔다.

- [ ] **Step 1: 번역하고 구조 검사를 통과시킨다.**
- [ ] **Step 2: 2차 리뷰를 맡기고 지적을 반영한다.**
- [ ] **Step 3: 스모크를 고친다.**
- [ ] **Step 4: 확인한다**
  - 실행: `pnpm content:check && pnpm test && pnpm build`, 그다음 preview 스모크
  - 기대: 전부 통과
  - OG 카드 ko/en 을 눈으로 본다.
  - 390px 폭에서 표·이미지·코드가 넘치지 않는지 확인한다.
- [ ] **Step 5: 커밋한다**: `content: 샘플 글 영어 번역(translate-post 흐름)과 스모크 갱신`

### Task 10: 계획 4 마무리 검증 · 은솔 확인 요청

- [ ] **Step 1: 자동 검증**
  - `pnpm audit:repo --build`: FAIL 0
  - preview 를 띄워 `pnpm audit:repo --live --base-url http://localhost:4173`: FAIL 0
  - 결과 요약을 ledger 에 남긴다.
- [ ] **Step 2: 화면 확인**
  - `/261020`, `/en/261020` 을 1280px·390px 로 본다.
  - hydration 오류가 없어야 한다.
  - 스크린샷을 `temp.local/plan4-sample/` 에 저장한다.
- [ ] **Step 3: 은솔에게 확인을 요청한다** (스펙 4.11: 은솔 이름으로 나가는 글)
  - 함께 보여 줄 것
    - ko·en 본문 경로
    - 스크린샷
    - 근거 표
    - "지어내지 않으려고 뺀 것"
  - 은솔이 고칠 점을 주면 반영한다. ko 를 고치면 en 도 다시 translate-post 흐름을 탄다.
  - `translationStatus: reviewed` 는 은솔이 en 을 확인했다고 말한 뒤에만 바꾼다.

---

## 다음 계획으로 넘기는 것

- **계획 5 (배포)**
  - `--live` 를 프로덕션에 실행한다.
  - `public/_headers` 로 보안 헤더를 단다(CSP 에 Turnstile 도메인 포함).
  - GitHub Actions 에 `pnpm audit:repo --build` 게이트와 IndexNow `--submit` 을 넣는다(`fetch-depth`, `before` 가 0 인 경우 처리).
- **미룬 지적 (계획 3)**: 에러 화면(errorComponent)에 `<title>` 이 없다.
