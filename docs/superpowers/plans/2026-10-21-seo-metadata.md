# SEO 메타 분리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 태그를 카테고리로 바꾸고, 글마다 필수 `seoTitle`·`keywords` 를 받아 글 페이지 메타에 싣는다.

**Architecture:** 작업 1은 이름과 의미를 바꾼다(`tags` → `categories`, 1개 이상). 작업 2는 새 필드를 스키마 → 해시 → 조회(`PostPage`) → `pageHead`·`postGraph` 순서로 흘린다. `seoTitle`·`keywords` 는 `PostMeta` 에 넣지 않고 `PostPage` 에만 싣는다. 작업 3은 글쓰기 문서를 맞춘다.

**Tech Stack:** TanStack Start, Content Collections(zod), vitest, Paraglide

**Spec:** `docs/superpowers/specs/2026-10-21-seo-metadata-design.md`

## Global Constraints

- 주석·커밋 메시지는 한국어로 쓴다. 규칙 문서는 문어체 규정 말투로 쓴다.
- Node 쪽 소비자(`scripts/*`, `content-collections.ts`, `index.scripts.ts`·`index.build.ts` 경로)는 상대 경로 + `.ts` 로 import 한다.
- 공개 API 는 이름을 하나씩 적어 재수출한다(`export *` 금지).
- 커버리지는 함수 100%, 줄 90%를 유지한다.
- `RENDER_VERSION`·`OG_VERSION` 은 올리지 않는다.
- dev 서버를 띄운 채 빌드하지 않는다.
- 카테고리 키 정규식은 `KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/`(지금 `TAG_PATTERN` 값)이다.

## Review Focus

1. **다른 페이지의 메타가 그대로인가**: 홈·`/posts`·404 의 `<title>`·`og:title`·`og:image:alt` 는 지금과 같아야 한다. 작업 2의 `pageHead` 테스트가 `imageAlt` 없이 부르면 `title` 을 쓰는지 확인한다.
2. **`/posts` 목록 데이터에 `seoTitle`·`keywords` 가 실리지 않는가**: 작업 2의 `listPosts` 테스트가 결과 글 객체에 두 키가 없음을 단언한다.
3. **키워드 순서만 바꿔도 번역이 낡은 것으로 잡히는가**: 스펙은 이를 받아들인다. 작업 2의 해시 테스트에 넣는다.
4. **표시 이름이 없는 카테고리 키**: `content:check` 가 잡는다(작업 1). 화면은 키를 그대로 보인다(지금 `tagRefs` 동작).
5. **`?category=` 에 정규식 밖의 값**: 무시되고 필터 없는 목록이 보인다(작업 1의 `readCategoryParam` 테스트).

---

### Task 1: 태그를 카테고리로 바꾸기

**Files:**
- Modify: `src/shared/config/content.ts`, `src/shared/config/index.ts` (`TAG_PATTERN` → `KEY_PATTERN`), `src/entities/post/markdown/remark-term.ts`
- Create: `content/categories.yaml` / Delete: `content/tags.yaml`
- Modify: `content-collections.ts` (ko 스키마 `categories`, 컬렉션 `categoryLabels`, en 변환)
- Modify: `src/entities/post/source/resolve-en-post.ts`, `content-checks.ts` (+ 테스트)
- Modify: `src/entities/post/model/post-index.ts`, `post-queries.ts`, `api/posts.server.ts`, `index.ts`, `ui/PostList.tsx` (+ 테스트)
- Rename: `src/pages/posts/lib/tag-filter.ts` → `category-filter.ts`, `ui/TagFilter.tsx` → `CategoryFilter.tsx` (+ 테스트), Modify: `ui/PostsPage.tsx`, `ui/posts.css`
- Modify: `src/pages/post/ui/PostPage.tsx`, `ui/post.css`
- Modify: `src/app/routes/posts/index.tsx`, `src/app/routes/$slug.tsx`, `src/app/seo/head.ts`, `json-ld.ts`, `rss.ts` (+ 테스트), `llms.test.ts`, `sitemap.test.ts`
- Modify: `messages/ko.json`, `messages/en.json`
- Modify: `scripts/content-check.ts`, `scripts/audit.ts`, `scripts/smoke.ts`
- Modify(예시 쿼리만): `src/app/build/prerender.ts`·`prerender.test.ts`, `src/shared/api/http.server.test.ts`, `src/shared/i18n/url.test.ts`, `src/entities/post/markdown/link.test.ts`, `src/features/view-count/lib/view-target.test.ts` — `?tag=a`/`?tag=meta` → `?category=a`/`?category=software`
- Modify: `content/posts/261021-hermes-agent-personal-assistant/index.ko.md`

**Interfaces:**
- Produces:
  - `PostMeta.categories: string[]` (`tags` 자리)
  - `collectCategories(posts: PostMeta[]): string[]` (정렬 규칙은 `collectTags` 그대로)
  - `type CategoryRef = { key: string; label: string }`, `type CategoryLabels = Array<{ key: string; ko: string; en: string }>`, `categoryRefs(keys, locale, labels): CategoryRef[]`
  - `PostPage.categories`, `FeedItem.categories`, `listPosts() → { posts, categories }`, `createPostQueries({ categoryLabels, ... })`
  - `missingCategoryLabels(keys, labels)`, `collectContentProblems({ posts, categoryKeys, termKeys })`, `ContentPostInput.ko.categories`
  - `KoSource.categories`
  - `CategoryChips({ categories, allLabel, label })`, `CategoryFilter({ categories })`, `categoryFilterCss(keys)`, `readCategoryParam(search)`, `applyCategorySelection(doc, search)`
  - `HeadInput` 에서 `tags` 를 뺀다(작업 2가 `keywords` 를 더한다). `postGraph` 입력의 `tags` → `categories: string[]`(표시 이름)
  - 메시지 키: `posts_all_categories`("전체"/"All"), `posts_category_filter`("카테고리로 거르기"/"Filter by category")

- [ ] **Step 1: 테스트를 새 이름·의미로 고친다**
  - `tag-filter.test.ts` → `category-filter.test.ts`: `html[data-category="software"] [data-post]:not([data-categories~="software"])` 규칙, `readCategoryParam('?category=software') === 'software'`, `readCategoryParam('?category=Bad Key') === undefined`, 칩 셀렉터 `.category-filter [data-chip="software"]`.
  - `CategoryFilter.test.tsx`: `href="/posts?category=software"`, `aria-label="카테고리로 거르기"`.
  - `post-index.test.ts`·`post-queries.test.ts`·`rss.test.ts`·`llms.test.ts`·`sitemap.test.ts`·`resolve-en-post.test.ts`: 픽스처의 `tags` 를 `categories` 로, `tagLabels` 를 `categoryLabels` 로 바꾼다.
  - `content-checks.test.ts`: 표시 이름이 없는 키를 `카테고리 표시 이름 없음: <key>` 로 잡는다.
  - `json-ld.test.ts`: `postGraph({ ..., categories: ['AI'] })` 의 BlogPosting 이 `articleSection: ['AI']` 를 갖고 `keywords` 키는 없다.
  - `head.test.ts`: `tags` 를 픽스처에서 빼고 `article:tag` 단언을 지운다(작업 2에서 다시 넣는다).

- [ ] **Step 2: 실패 확인**

Run: `pnpm i18n:compile && pnpm exec vitest run src/pages/posts src/entities/post src/app/seo`
Expected: FAIL (`categoryFilterCss` 등이 없음)

- [ ] **Step 3: 구현한다**
  - 이름 바꾸기는 위 Interfaces 그대로 한다. 동작은 바꾸지 않는다.
  - `content-collections.ts`: ko 스키마 `categories: z.array(z.string().regex(KEY_PATTERN)).min(1)`, `tags` 삭제. 컬렉션 `categoryLabels`(`content/categories.yaml`, 루트 키 `categories`).
  - `content/categories.yaml` 은 스펙 5.2 표의 여덟 항목을 그 순서로 넣는다.
  - `post.css`: `.post-tags` → `.post-categories`, `li::before` 의 `'#'` 규칙은 지운다(카테고리는 해시태그가 아님).
  - `posts.css`: `.tag-filter` → `.category-filter`, `html:not([data-tag])` → `html:not([data-category])`.
  - `routes/posts/index.tsx`: 인라인 스크립트가 `category` 파라미터와 `KEY_PATTERN` 을 쓰고 `validateSearch` 는 `{ category?: string }`.
  - `rss.ts`: `<category>` 는 `categories` 표시 이름.
  - `scripts/content-check.ts`·`audit.ts`: `content/categories.yaml` 의 `categories[].key` 를 읽어 `categoryKeys` 로 넘기고, frontmatter 의 `categories` 를 읽는다. 머리 주석의 "태그"를 "카테고리"로 바꾼다.
  - `scripts/smoke.ts:125`: `?tag=meta` → `?category=software`.
  - 첫 글 ko: `tags: [...]` 줄을 `categories: ["hermes-agent", "ai"]` 로 바꾼다(해시에 영향 없음).

- [ ] **Step 4: 통과 확인**

Run: `pnpm check && pnpm test && pnpm content:check`
Expected: 모두 PASS. `grep -rnE "tags|TagRef|tag-filter|data-tag|\?tag=|TAG_PATTERN|tags\.yaml" src scripts content-collections.ts content messages` 결과에 태그 흔적이 없다.

- [ ] **Step 5: Commit** — `refactor: 태그를 큰 분류인 카테고리로 바꿈`

### Task 2: seoTitle·keywords

**Files:**
- Modify: `src/entities/post/source/source-hash.ts` (+ 테스트), `resolve-en-post.ts` (+ 테스트), `content-checks.ts`
- Modify: `content-collections.ts` (ko·en 스키마, 반환값)
- Modify: `src/entities/post/model/post-queries.ts` (+ 테스트), `api/posts.server.ts`
- Modify: `src/app/seo/head.ts` (+ 테스트), `json-ld.ts` (+ 테스트), `src/app/routes/$slug.tsx`
- Modify: `scripts/content-rehash.ts`, `scripts/content-check.ts`, `scripts/audit.ts`
- Modify: 첫 글 `index.ko.md`, `index.en.md`

**Interfaces:**
- Consumes: Task 1 의 `PostPage`, `ContentPostInput`, `KoSource`
- Produces:
  - `computeSourceHash(input: { title: string; description: string; seoTitle: string; keywords: string[]; body: string }): string` — 해시 입력은 `` `${title}\n${description}\n${seoTitle}\n${JSON.stringify(keywords)}\n${body}` ``(본문 정규화는 지금 그대로)
  - `KoSource.seoTitle`, `KoSource.keywords`, `ContentPostInput.ko.seoTitle`, `ContentPostInput.ko.keywords`
  - `type PostSeo = { seoTitle: string; keywords: string[] }`. `createPostQueries({ seo: ReadonlyMap<BodyKey, PostSeo>, ... })`. `PostPage.seoTitle: string`, `PostPage.keywords: string[]`
  - `HeadInput.imageAlt?: string`(없으면 `title`), `HeadInput.keywords?: string[]`
  - `postGraph` 입력에 `keywords: string[]`

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `source-hash.test.ts`: `seoTitle` 만 바꿔도, `keywords` 하나를 더해도, `keywords` 순서만 바꿔도 해시가 달라진다.
  - `resolve-en-post.test.ts`: ko 의 `seoTitle` 이 바뀌면 낡은 번역으로 던진다.
  - `post-queries.test.ts`: `getPostPage('en', slug)` 가 `seo` 맵의 `seoTitle`·`keywords` 를 돌려준다. `listPosts('ko').posts[0]` 에는 `seoTitle`·`keywords` 키가 없다.
  - `head.test.ts`: `pageHead({ ...base, title: 'SEO 제목', imageAlt: '글 제목', keywords: ['a', 'b'] })` 에서 `<title>`·`og:title`·`twitter:title` 이 `'SEO 제목'`, `og:image:alt` 가 `'글 제목'`, `keywords` 메타가 `['a, b']`, `article:tag` 가 `['a', 'b']`. `imageAlt` 없이 부르면 `og:image:alt` 는 `title`. `keywords` 가 없으면 `keywords` 메타도 없다.
  - `json-ld.test.ts`: BlogPosting 의 `keywords` 가 입력 `keywords`, `headline`·브레드크럼 3번 이름은 `title`.

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec vitest run src/entities/post src/app/seo`
Expected: FAIL

- [ ] **Step 3: 구현한다**
  - ko·en 스키마: `seoTitle: z.string().min(1)`, `keywords: z.array(z.string().min(1)).min(1)`. ko·en 변환 결과에 `seoTitle`·`keywords` 를 싣는다. ko 의 `computeSourceHash` 호출과 en 의 `resolveEnPost` 에 넘기는 ko 소스에도 넣는다.
  - `posts.server.ts`: `toMeta` 는 그대로 두고(목록에 안 실리게) `seo` 맵을 docs 에서 만든다.
  - `$slug.tsx`: `pageHead({ title: page.seoTitle, imageAlt: post.title, keywords: page.keywords, ... })`, `postGraph({ ...post, keywords: page.keywords, categories: labels, ... })`. `pageHead` 의 `<title>`·`og:title`·`twitter:title` 은 `title`, `og:image:alt` 는 `imageAlt ?? title`. `keywords` 메타는 `article` 블록 밖에 둔다.
  - `content-rehash.ts`·`content-check.ts`·`audit.ts`: frontmatter 의 `seoTitle`·`keywords` 를 읽어 해시 입력에 넣는다.
  - 첫 글에 값을 넣고 en `sourceHash` 를 `pnpm content:rehash --post 261021-hermes-agent-personal-assistant` 로 갱신한다. 값(은솔 확인 대상):
    - ko `seoTitle`: `"Hermes Agent로 나만의 AI 개인 비서 만들기: 통화·메일 기억, Slack 답변, 할 일 관리"`
    - ko `keywords`: `["Hermes Agent", "Hermes Agent 사용법", "AI 개인 비서 만들기", "AI 에이전트", "MCP", "Slack AI 비서", "업무 자동화", "Nous Research"]`
    - en `seoTitle`: `"Hermes Agent: Build a Personal AI Assistant That Remembers Calls, Email, and To-Dos"`
    - en `keywords`: `["Hermes Agent", "Hermes Agent tutorial", "personal AI assistant", "AI agent", "MCP", "Slack AI assistant", "workflow automation", "Nous Research"]`

- [ ] **Step 4: 통과 확인**

Run: `pnpm check && pnpm test && pnpm content:check && pnpm audit:repo`
Expected: 모두 PASS(FAIL 없음)

- [ ] **Step 5: Commit** — `feat: 글마다 검색용 제목과 키워드를 받아 메타에 넣음`

### Task 3: 글쓰기 문서·커맨드

**Files:**
- Modify: `docs/writing/style-guide.md`, `.claude/commands/write-post.md`, `.claude/commands/translate-post.md`, `.claude/commands/refine-post.md`, `AGENTS.md`

- [ ] **Step 1: 고친다** (스펙 5.7 그대로, 문어체)
  - style-guide: 태그 규칙(178행 근처, 119행의 "제목·설명·태그·본문")을 카테고리로 바꾸고, `title`(짧게, OG 카드 40자 안내 유지)·`seoTitle`(검색할 말로 시작, 콜론 뒤 핵심 개념)·`keywords`(5~10개, 검색창 모양) 기준을 둔다. 제목의 "검색할 말을 앞쪽에" 규칙은 `seoTitle` 로 옮긴다.
  - write-post: frontmatter 예시를 스펙 5.1 로, 체크리스트 "제목에 검색할 말이 앞쪽에 있다" → `seoTitle` 기준, 새 카테고리는 기존 것으로 먼저 해결하고 없을 때만 `content/categories.yaml` 에 추가.
  - translate-post: en 필드에 `seoTitle`·`keywords`(영어 검색어 기준, 직역 금지), 상속 목록 `tags` → `categories`, 표시 이름 파일 경로.
  - refine-post: 5단계 SEO 점검에 `seoTitle`·`keywords`, 낡은 번역 안내에 두 필드.
  - AGENTS.md: "꼭 지킬 것"의 "본문·제목·설명" 에 `seoTitle`·`keywords`, "글 쓰기"의 `content/tags.yaml` → `content/categories.yaml`, `content:check` 설명의 "빠진 태그" → "빠진 카테고리".

- [ ] **Step 2: 확인**

Run: `grep -rnE "태그|tags" docs/writing .claude/commands AGENTS.md`
Expected: 카테고리 체계와 무관한 일반 용어(HTML 태그 등)만 남는다.

- [ ] **Step 3: Commit** — `docs: 글쓰기 문서를 카테고리·seoTitle·keywords 에 맞춤`
