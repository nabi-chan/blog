# 블로그 기반 계획 3: SEO · GEO (메타 · 구조화 데이터 · sitemap · RSS · llms · OG · IndexNow) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 화면에 검색·공유용 메타(canonical, hreflang, OG, Twitter, JSON-LD)를 달고, 빌드 산출물로 다음을 만든다. 메타에 실린 URL 은 전부 200 이다.
- `sitemap.xml`, `robots.txt`
- 언어별 RSS
- `llms.txt`(언어별), `llms-full.txt`
- 글별 `.md` 원문
- 글 × 언어별 OG 이미지
- IndexNow 스크립트

**Architecture:**
- 판단 로직은 순수 함수로 둔다. 테스트가 붙고 커버리지에 든다.
  - `src/seo/`: 메타, JSON-LD, sitemap, robots, RSS, llms 문자열 생성
  - `src/og/`: OG 카드 구성과 렌더
- `head()` 는 `pageHead()` 결과를 그대로 쓴다.
- 텍스트 산출물은 TanStack Start 서버 라우트(`src/routes/rss[.]xml.ts` 같은 이름)가 만든다. 빌드 때 프리렌더 `pages` 목록에 넣어 정적 파일로 굳힌다.
  - 스파이크로 확인한 것: `/en/rss.xml` 은 rewrite 로 같은 라우트를 타고 `getLocale()` 이 en 이다. 출력 파일 이름은 `en/rss.xml`, `261020.md` 처럼 경로 그대로다.
  - 크롤러는 `<a href>` 만 따라간다. 그래서 `.md` 목록은 글 폴더를 읽어 만든다.
- 다음 데이터는 Content Collections 변환에서 같이 만든다.
  - `.md` 원문: 이미지 경로를 절대 URL 로 바꾼 것
  - 단어 수
  - OG PNG: satori + resvg, 디스크 캐시

**Tech Stack:** TanStack Start 서버 라우트 + 프리렌더, satori `0.62.0`(정확한 버전 고정), @resvg/resvg-js `2.6.2`, SUIT 정적 TTF(Regular·Bold, 빌드 전용), IndexNow(`https://api.indexnow.org/indexnow`)

**Spec:** `docs/superpowers/specs/2026-10-20-blog-foundation-design.md`
- 4.9 SEO/GEO 전체를 구현한다. 4.1(산출물은 빌드할 때 만든다)과 4.2(경로) 규칙을 따른다.
- 계획 1 에서 미룬 것 중 둘을 여기서 고친다.
  - 404 문서에 `<title>` 이 두 개다.
  - Lobby 에 h1 이 없다.
- GitHub Actions 연결(IndexNow `--submit` 실행)과 Cloudflare AI 봇 설정 확인은 계획 5 에서 한다.

## Global Constraints

### 버전·의존성

| 대상 | 버전·조건 |
|---|---|
| `satori` | `0.62.0` 정확히 고정. 0.61~0.63.1 이 나흘 사이에 나왔고, 0.63.x 는 pnpm 하루 대기 규칙에 걸린다 |
| `@resvg/resvg-js` | `2.6.2` (2.7 은 alpha) |
| 폰트 | `assets/fonts/SUIT-Regular.ttf`, `SUIT-Bold.ttf`, `SUIT-OFL.txt` |

- 폰트는 SUIT v2.0.5 릴리스의 `SUIT-ttf.zip` 에서 원본 그대로 가져온다. 이름을 바꾸지 않으니 RFN 문제가 없다.
- 사이트로 내보내지 않는다(`public/` 밖에 둔다).

### URL

- 메타·sitemap·RSS·llms·JSON-LD 의 URL 은 전부 `site.url` 기준 절대 URL 이다. 끝 슬래시는 없다. 루트만 `https://nabichan.me/` 다.
- 언어 경로는 `localizePath(path, locale)`(`src/markdown/link.ts`)로 만든다. ko 는 접두사가 없고, en 은 `/en`.
- 메타에 싣는 URL 은 리다이렉트되면 안 된다. 스모크가 전부 200 인지 확인한다.

### 콘텐츠 규칙

- draft 는 sitemap, RSS, llms, `.md`, IndexNow 어디에도 넣지 않는다. 프로덕션에서는 원래 빠지고, dev 에서도 `!post.draft` 로 거른다.
- 영어 번역이 없는 글은 en 목록, en RSS, en llms, `/en/<slug>.md`, en hreflang 에서 빠진다. `/en/<slug>.md` 는 404 다.
- 글 라이선스는 어디에도 쓰지 않는다. JSON-LD 의 `license`, RSS 의 `copyright` 도 마찬가지다.
- 출력 이스케이프
  - XML(sitemap·RSS): `& < > " '` 를 엔티티로 바꾼다.
  - RSS `content:encoded`: CDATA 로 감싸고, 본문 안의 `]]>` 는 `]]]]><![CDATA[>` 로 나눈다.
  - JSON-LD: `<` 를 `<` 로 바꾼다.
- 시각
  - sitemap `lastmod` 와 JSON-LD: frontmatter ISO(+09:00) 그대로
  - RSS: `new Date(iso).toUTCString()` (RFC 822)
- 가짜 날짜는 쓰지 않는다. 글이 0편이면 목록 페이지의 `lastmod`, RSS `lastBuildDate` 를 뺀다.

### 테스트 규칙 (계획 1·2 규칙에 더한다)

- 커버리지 대상에 `src/seo`, `src/og` 를 더한다.
- 서버 라우트 파일(`src/routes/*[.]*.ts`)은 데이터를 엮기만 한다. 판단은 `src/seo` 함수에 둔다. 확인은 스모크가 한다.
- OG 렌더 테스트는 실제 satori + resvg 로 PNG 를 만든다. PNG 서명과 IHDR 크기(1200×630)를 본다.

### 커밋

- 계획 2 와 같다. main 에 바로 커밋하고, 메시지는 한국어로 쓰고, `Co-Authored-By` / `Claude-Session` 두 줄을 붙인다.

## Review Focus

1. **draft 와 번역 없는 글이 산출물에 새지 않는다.** 대상: sitemap, RSS, llms, `.md`, hreflang
   - Task 5·6·7 의 `draft`·`번역 없음` 테스트
2. **제목·설명에 `& < " ]]>` 가 들어가도 문서가 깨지지 않는다.** 대상: XML, JSON-LD, HTML 메타
   - Task 2·5·6 의 이스케이프 테스트
3. **OG 카드가 넘치지 않고, 이상한 글자에도 빌드가 실패하지 않는다.** 대상: 긴 라틴 단어, SUIT 에 없는 글자(이모지)가 든 제목
   - Task 4 `넘치는 제목과 이모지도 PNG 를 만든다`
4. **`.md` 와 RSS 의 이미지·링크 경로가 맞는 절대 URL 이다.** 대상: `?w=` 폭 제한, 한글 파일 이름, 참조형 이미지 `![a][ref]`, `#헤딩` 링크
   - Task 3·6 테스트
5. **메타에 실린 URL 이 전부 200 이고 `<title>` 은 페이지마다 하나다.** 대상: canonical, hreflang, og:image, alternate
   - Task 8 스모크

## 파일 구조

```
assets/fonts/SUIT-Regular.ttf, SUIT-Bold.ttf, SUIT-OFL.txt   # OG 렌더 전용 (사이트로 안 나감)
public/<indexnow-key>.txt                                       # IndexNow 키 (공개 값)
src/site.ts                       # description 메시지 키, verification, indexNowKey 추가
src/seo/
  url.ts          # absoluteUrl, pageUrl
  text.ts         # truncateMeta, escapeXml
  head.ts         # pageHead → TanStack head({ meta, links, scripts })
  json-ld.ts      # siteGraph, postGraph, collectionGraph, jsonLdScript
  sitemap.ts      # buildSitemap
  robots.ts       # buildRobots, AI_CRAWLERS
  rss.ts          # absolutizeHtml, buildRss
  llms.ts         # buildLlmsTxt, buildLlmsFull
src/og/
  card.ts         # ogTitleFontSize, postCard, siteCard (satori 요소 트리)
  render.ts       # renderOgPng, writeOgImage (캐시)
src/markdown/agent-markdown.ts    # absolutizeMarkdownImages, countWords
src/lib/indexnow.ts               # selectIndexNowUrls, indexNowPayload
src/lib/prerender.ts              # (추가) SEO_PAGES, markdownPagePaths
src/lib/smoke.ts                  # (추가) extractMetaUrls
src/routes/sitemap[.]xml.ts, robots[.]txt.ts, rss[.]xml.ts, llms[.]txt.ts, llms-full[.]txt.ts, {$slug}[.]md.ts
scripts/indexnow.ts
```

---

### Task 1: 사이트 정보 · URL · 메타 문자열 도구

**Files:**
- Create: `src/seo/url.ts`, `src/seo/text.ts`
- Test: `src/seo/url.test.ts`, `src/seo/text.test.ts`
- Modify: `src/site.ts`, `messages/ko.json`, `messages/en.json`, `vitest.config.ts`, `vite.config.ts`(import 확장자)

**Interfaces:**
- Produces

  ```ts
  // src/site.ts 에 더한다
  //   verification: { google: '', naver: '' }   // 비어 있으면 메타를 그리지 않는다 (스펙 4.9: 자리만)
  //   indexNowKey: '<32자 hex>'                  // Task 9 가 같은 값의 public/<key>.txt 를 만든다
  //   locales: { ko: 'ko_KR', en: 'en_US' }      // og:locale
  // messages: site_description (ko "eunsol 개인 블로그", en "eunsol's personal blog") [은솔] — 한 줄 소개가 정해지면 바꾼다

  // src/seo/url.ts
  export function absoluteUrl(path: string): string          // new URL(path, site.url).href
  export function pageUrl(path: string, locale: Locale): string  // absoluteUrl(localizePath(path, locale))

  // src/seo/text.ts
  export function truncateMeta(text: string, max: number): string   // 코드 포인트 기준. 넘으면 max-1 자 + '…', 앞뒤 공백 정리
  export function escapeXml(text: string): string                    // & < > " '
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `absoluteUrl('/')` = `'https://nabichan.me/'`
  - `absoluteUrl('/261020')` = `'https://nabichan.me/261020'`
  - `pageUrl('/', 'en')` = `'https://nabichan.me/en'`
  - `pageUrl('/posts', 'ko')` = `'https://nabichan.me/posts'`
  - `truncateMeta('가'.repeat(161), 160)`: 길이 160 이고 `…` 로 끝난다. 160자는 그대로 둔다. 이모지 하나는 한 글자로 센다.
  - `escapeXml(`a & <b> "c" 'd'`)` = `a &amp; &lt;b&gt; &quot;c&quot; &apos;d&apos;`

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/seo`
  - 기대: FAIL

- [ ] **Step 3: 구현한다**
  - `vitest.config.ts` 의 coverage.include 에 `'src/seo/**/*.ts'`, `'src/og/**/*.ts'` 를 더한다.
  - `vite.config.ts` 의 `import { shouldPrerender } from './src/lib/prerender'` 를 `'./src/lib/prerender.ts'` 로 바꾼다. 빌드 경고(확장자 없음)를 없애기 위해서다.
  - IndexNow 키는 `node -e "console.log(crypto.randomBytes(16).toString('hex'))"` 로 한 번 만든다.

- [ ] **Step 4: 실행해서 통과를 확인한다**
  - 실행: `pnpm vitest run src/seo && pnpm check`
  - 기대: PASS

- [ ] **Step 5: 커밋한다**: `feat: SEO 용 사이트 정보·절대 URL·메타 문자열 도구 추가`

### Task 2: 페이지 메타와 JSON-LD 만들기

**Files:**
- Create: `src/seo/head.ts`, `src/seo/json-ld.ts`
- Test: `src/seo/head.test.ts`, `src/seo/json-ld.test.ts`

**Interfaces:**
- Consumes: `absoluteUrl`, `pageUrl`, `truncateMeta` (Task 1)
- Produces

  ```ts
  // src/seo/json-ld.ts
  type Graph = Record<string, unknown>[]
  export function siteGraph(locale: Locale): Graph           // WebSite(/#website) + Person(/#person, name site.author, url site.url)
  export function postGraph(input: {
    locale: Locale; slug: string; title: string; description: string; date: string; updated?: string
    tags: string[]; wordCount: number; image: string
  }): Graph
  // siteGraph + BlogPosting
  //   - @id `${글 URL}#article`
  //   - headline, description, datePublished, dateModified(updated ?? date)
  //   - author/publisher → {'@id': '/#person'}, isPartOf → {'@id': '/#website'}
  //   - image, inLanguage, mainEntityOfPage(글 URL), keywords(태그 표시 이름), wordCount
  // + BreadcrumbList: 처음(Lobby) → 글 목록(Posts) → 글
  export function collectionGraph(input: { locale: Locale; title: string; posts: Array<{ slug: string; title: string }> }): Graph
  // siteGraph + CollectionPage(Posts URL, isPartOf #website) + ItemList(position 1.., url, name)
  export function jsonLdScript(graph: Graph): string
  // JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) 에서 '<' → '<'

  // src/seo/head.ts — TanStack head() 가 그대로 돌려줄 값
  export type HeadInput = {
    locale: Locale
    path: string                 // 언어 접두사 없는 경로 ('/', '/posts', '/261020')
    title: string                // <title> 그대로 (템플릿은 호출하는 쪽이 붙인다)
    description?: string
    type: 'website' | 'article'
    image: string                // 절대 URL
    alternates: Locale[]         // 이 페이지가 실제로 있는 언어
    published?: string; modified?: string; tags?: string[]   // article 일 때
    jsonLd: Graph
    markdownPath?: string        // 글이면 '/261020.md' (언어 접두사는 head 가 붙인다)
  }
  export function pageHead(input: HeadInput): {
    meta: Array<Record<string, string>>
    links: Array<Record<string, string>>
    scripts: Array<{ type: string; children: string }>
  }
  ```

- `pageHead` 가 만드는 것

  | 종류 | 값 |
  |---|---|
  | meta | `{ title }` |
  | meta | `description`(truncateMeta, DESCRIPTION_MAX) — 있을 때만 |
  | meta | `og:site_name`, `og:type`, `og:title`, `og:description`, `og:url`, `og:image`(+`:width` 1200, `:height` 630, `:alt` 제목), `og:locale`, `og:locale:alternate`(다른 언어가 있을 때) |
  | meta | article 이면 `article:published_time`, `article:modified_time`(updated ?? date), `article:tag` 태그마다 |
  | meta | `twitter:card` summary_large_image, `twitter:title`, `twitter:description`, `twitter:image` |
  | links | canonical(`pageUrl(path, locale)`) |
  | links | alternates 마다 `{ rel: 'alternate', hrefLang, href }` + `x-default`(ko). alternates 가 ko 하나뿐이어도 ko 와 x-default 를 단다 |
  | links | `markdownPath` 가 있으면 `{ rel: 'alternate', type: 'text/markdown', href: localizePath(markdownPath, locale) }` |
  | scripts | `{ type: 'application/ld+json', children: jsonLdScript(jsonLd) }` |

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `json-ld.test.ts`
    - `postGraph` 결과
      - `@id` 로 서로 잇는다: BlogPosting.author 는 `{ '@id': 'https://nabichan.me/#person' }` 이다.
      - Person 노드는 하나뿐이다.
      - dateModified 는 updated 가 없으면 date 다.
      - BreadcrumbList 의 en 항목 URL 은 `/en`, `/en/posts`, `/en/261020` 이다.
    - 이스케이프
      - `jsonLdScript` 결과에 `<` 문자가 없다(제목에 `</script>` 를 넣어 확인).
      - `JSON.parse` 로 되돌리면 원래 제목이 나온다.
  - `head.test.ts`
    - en 글 `/261020`(alternates ko, en)
      - canonical 은 `https://nabichan.me/en/261020` 이다.
      - hreflang 은 ko(`/261020`), en(`/en/261020`), x-default(`/261020`) 세 개다.
      - markdown alternate href 는 `/en/261020.md` 다.
    - 번역 없는 ko 글(alternates ko)
      - hreflang 은 ko 와 x-default 뿐이다.
      - `og:locale:alternate` 가 없다.
    - website 타입: `article:*` 메타가 없다.
    - description 이 200자면 160자로 잘린다.
    - `title` 이 meta 배열에 정확히 한 번 있다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/seo`
  - 기대: FAIL

- [ ] **Step 3: 구현한다.**

- [ ] **Step 4: 실행해서 통과를 확인한다**
  - 실행: `pnpm vitest run src/seo`
  - 기대: PASS

- [ ] **Step 5: 커밋한다**: `feat: 페이지 메타(canonical·hreflang·OG·Twitter)와 JSON-LD 생성 함수 추가`

### Task 3: 글 원문(.md)·단어 수·조회 함수 (콘텐츠 데이터)

**Files:**
- Create: `src/markdown/agent-markdown.ts`
- Test: `src/markdown/agent-markdown.test.ts`, `src/content/post-queries.test.ts`(추가), `src/markdown/rehype-local-images.test.ts`(추가)
- Modify: `src/markdown/rehype-local-images.ts`, `src/markdown/render.ts`, `content-collections.ts`, `src/content/post-queries.ts`, `src/content/posts.server.ts`

**Interfaces:**
- Produces

  ```ts
  // render.ts: RenderResult 에 images 를 더한다
  export type RenderResult = { html: string; toc: TocItem[]; assets: Asset[]; terms: string[]; images: Record<string, string> }
  // images: 본문에 쓴 글 옆 이미지 src(원문 그대로, '?w=' 포함) → 공개 경로('/content-assets/<slug>/<stem>.<hash>.<ext>')
  // rehype-local-images 가 file.data.images 에 모은다

  // src/markdown/agent-markdown.ts
  export function absolutizeMarkdownImages(markdown: string, images: Record<string, string>, origin: string): string
  // remark-parse(+gfm, directive)로 image·definition 노드 위치를 찾아 그 url 부분만 바꾼다. 나머지 원문은 한 글자도 바꾸지 않는다
  export function countWords(markdown: string): number
  // mdast-util-to-string 으로 만든 글자를 공백으로 나눈 수 (코드 블록 포함, frontmatter 없음)

  // post-queries.ts
  export type PostSource = { markdown: string; wordCount: number }   // markdown 은 이미지 경로를 절대 URL 로 바꾼 원문
  // createPostQueries 입력에 sources: ReadonlyMap<BodyKey, PostSource> 를 더한다
  // PostPage 에 wordCount: number 를 더한다
  export type FeedItem = { post: PostMeta; tags: TagRef[]; html: string; markdown: string }
  // PostQueries 에 더한다
  //   listFeed(locale): FeedItem[]                   // 날짜 내림차순, draft 제외
  //   getMarkdown(locale, slug): string | null       // 없거나 draft 면 null
  ```

- **Content Collections 변경** (`content-collections.ts`)
  - koPosts·enPosts 변환 결과에 `markdown: absolutizeMarkdownImages(doc.content, body.images, site.url)`, `wordCount: countWords(doc.content)` 를 더한다.
  - 렌더 캐시 키에 `renderVersion: 2` 를 넣는다. 결과 모양(`images`)이 바뀌었으니 예전 캐시를 쓰면 안 된다.
    - 계획 1 의 미룬 지적 "의존성 업그레이드해도 렌더 캐시 무효화 안 됨"의 첫 대응이다.
    - 렌더 결과 모양이 바뀔 때마다 이 숫자를 올린다(주석으로 남긴다).

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `rehype-local-images.test.ts`: 이 경우들의 `file.data.images` 가 각각 공개 경로를 가리킨다.
    - `![a](./diagram.svg)`
    - `![b](./photo.png?w=400)`
    - 한글·공백 파일 이름 `![c](./스크린샷%202026.png)`
  - `agent-markdown.test.ts`
    - 인라인 이미지: `![a](./diagram.svg "그림")` → `![a](https://nabichan.me/content-assets/261020/diagram.abc.svg "그림")`. 제목과 대체 텍스트는 그대로다.
    - 참조형: `![a][d]` + `[d]: ./diagram.svg` → 정의 줄의 url 만 바뀐다.
    - 외부 이미지(`https://…`)와 코드 블록 안의 `![x](./y.png)` 는 그대로다.
    - 이미지가 없는 문서는 입력과 같은 문자열이다.
    - `countWords('# 제목\n\n안녕 세상 hello')` = 4
  - `post-queries.test.ts`
    - `listFeed('ko')` 는 draft 글을 빼고 날짜 내림차순이다.
    - `listFeed('en')` 는 번역 있는 글만 낸다.
    - `getMarkdown('en', <번역 없는 slug>)` 는 null, draft 도 null 이다.
    - `getPostPage` 결과에 `wordCount` 가 있다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/markdown src/content`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 Content Collections·posts.server 를 잇는다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check`
  - 기대: PASS. `.content-collections/generated` 의 글 문서에 `markdown`, `wordCount` 가 있다.

- [ ] **Step 5: 커밋한다**: `feat: 글 원문(.md)용 절대 이미지 경로·단어 수·피드 조회 추가`

### Task 4: OG 이미지 (빌드 시 생성)

**Files:**
- Create: `src/og/card.ts`, `src/og/render.ts`, `assets/fonts/SUIT-Regular.ttf`, `assets/fonts/SUIT-Bold.ttf`, `assets/fonts/SUIT-OFL.txt`
- Test: `src/og/card.test.ts`, `src/og/render.test.ts`
- Modify: `content-collections.ts`, `package.json`(`build` 스크립트, 의존성), `.gitignore`(`public/og`)

**Interfaces:**
- Produces

  ```ts
  // src/og/card.ts — satori 에 넘길 요소 트리 (JSX 없이 { type, props } 객체)
  export const OG_SIZE = { width: 1200, height: 630 } as const
  export function ogTitleFontSize(title: string): number
  // 폭 어림: 한글·CJK·전각 1em, 그 밖 0.55em. 1040px 폭에 3줄 안에 드는 가장 큰 값을 [76, 68, 60, 52, 44] 에서 고른다
  export function postCard(input: { title: string; date: string; locale: Locale }): OgNode
  // 위: site.name / 가운데: 제목(keep-all) / 아래: formatDate(date, locale) 와 도메인(nabichan.me)
  export function siteCard(input: { locale: Locale; description: string }): OgNode

  // src/og/render.ts
  export async function renderOgPng(node: OgNode): Promise<Uint8Array>         // satori → resvg, 1200×630
  export async function writeOgImage(node: OgNode, outFile: string, cacheDir: string): Promise<void>
  // 캐시 키 = sha256(JSON(node) + OG_VERSION). 캐시에 있으면 복사만, 없으면 렌더해서 캐시와 outFile 에 쓴다
  // OG_VERSION 은 카드 디자인이 바뀔 때마다 올린다
  ```

- 카드 디자인
  - 흰 바탕(#fff), 검정 글자, 보조 글자 #707070. 무채색 타이포 카드이고 장식은 없다.
  - padding 80, 굵기 400/700 만 쓴다.
- satori 지침 (스파이크에서 확인함)
  - 루트에 `boxSizing: 'border-box'` 를 준다. 안 주면 padding 이 크기 밖에 더해져 아래 줄이 잘린다.
  - 글자 상자에는 명시 폭(1040)을 준다. 안 주면 긴 라틴 단어가 오른쪽 여백을 넘는다.
  - 모든 div 에 `display: 'flex'` 를 준다.
  - 음수 자간은 쓰지 않는다.
- 파일 위치와 생성 시점
  - 글: `public/og/<locale>/<slug>.png`. koPosts·enPosts 변환이 만든다. 캐시 폴더는 `node_modules/.cache/og`.
  - 사이트 기본: `public/og/<locale>/site.png`. lobbyIntros 변환이 언어마다 만든다.
  - `public/og` 는 gitignore 하고, `build` 스크립트가 먼저 지운다(`rm -rf public/content-assets public/og && vite build`).
- 폰트
  - SUIT v2.0.5 `SUIT-ttf.zip` 에서 Regular·Bold 와 LICENSE 를 꺼낸다.
  - 받기: `gh release download v2.0.5 -R sun-typeface/SUIT -p SUIT-ttf.zip`
  - 받은 파일은 temp.local 에서 풀고, 필요한 셋만 `assets/fonts/` 로 옮긴다.
- 의존성: `pnpm add -D satori@0.62.0 @resvg/resvg-js@2.6.2`

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `card.test.ts`
    - 짧은 한글 제목은 76 이다.
    - 60자 한글 제목은 그보다 작다.
    - 같은 글자 수면 라틴 제목이 한글보다 크거나 같다.
    - `postCard` 트리에 제목·날짜(ko `2026년 10월 20일`)·`eunsol` 문자열이 들어 있다.
    - 루트 style 에 `boxSizing: 'border-box'` 가 있다.
  - `render.test.ts` (실제 렌더)
    - `renderOgPng(postCard(...))` 결과가 PNG 다. 서명은 `89 50 4E 47`, IHDR 너비 1200·높이 630 이다.
    - `넘치는 제목과 이모지도 PNG 를 만든다`: 80자 라틴 단어 + `🎉` 가 든 제목이 예외 없이 렌더된다.
    - `writeOgImage`
      - 두 번째 호출은 캐시를 쓴다. `renderOgPng` 대신 캐시 파일의 mtime 이 그대로인지로 확인한다.
      - outFile 이 생긴다. 임시 폴더는 `os.tmpdir()` 아래에 만든다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/og`
  - 기대: FAIL

- [ ] **Step 3: 의존성·폰트를 넣고 구현한 뒤 Content Collections 에 잇는다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check && pnpm build`
  - 기대
    - PASS
    - `public/og/ko/261020.png`, `public/og/en/261020.png`, `public/og/ko/site.png`, `public/og/en/site.png` 가 있다.
    - 네 장을 열어 보고 넘침·잘림이 없는지 확인한다. 스크린샷을 `./temp.local/plan3-og/` 에 복사한다.

- [ ] **Step 5: 커밋한다**: `feat: 글·사이트 OG 이미지를 빌드할 때 만든다 (satori + resvg)`

### Task 5: 화면 메타 적용 · sitemap · robots

**Files:**
- Create: `src/seo/sitemap.ts`, `src/seo/robots.ts`, `src/routes/sitemap[.]xml.ts`, `src/routes/robots[.]txt.ts`
- Test: `src/seo/sitemap.test.ts`, `src/seo/robots.test.ts`
- Modify: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/posts/index.tsx`, `src/routes/$slug.tsx`

**Interfaces:**
- Consumes: `pageHead`, `siteGraph`, `postGraph`, `collectionGraph` (Task 2), `PostPage.wordCount`·`listFeed` (Task 3), OG 경로 (Task 4)
- Produces

  ```ts
  // src/seo/sitemap.ts
  export type SitemapEntry = { path: string; lastmod?: string; locales: Locale[] }   // path 는 언어 접두사 없음
  export function buildSitemap(entries: SitemapEntry[]): string
  // locales 마다 <url> 하나: <loc>pageUrl</loc>, lastmod(있으면),
  // locales 가 둘 이상이면 각 언어 + x-default(ko) <xhtml:link rel="alternate" hreflang href/>
  // 루트에 xmlns 와 xmlns:xhtml 을 단다. priority·changefreq 는 쓰지 않는다

  // src/seo/robots.ts
  export const AI_CRAWLERS: readonly string[]
  // GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot,
  // PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot
  export function buildRobots(): string
  // 그룹 1: User-agent: * / Allow: / / Disallow: /api/ / Disallow: /admin
  // 그룹 2: AI_CRAWLERS 를 User-agent 줄로 나열하고 같은 Allow·Disallow 를 반복한다
  //   (UA 를 지정한 그룹은 * 그룹을 물려받지 않기 때문이다)
  // 마지막 줄: Sitemap: https://nabichan.me/sitemap.xml
  ```

- 화면별 head

  | 화면 | title | 타입·이미지 | JSON-LD | 기타 |
  |---|---|---|---|---|
  | Lobby | `site.name` | website, `/og/<locale>/site.png` | `siteGraph` | `<h1 className="sr-only">{site.name}</h1>` 추가(계획 1 미룬 지적) |
  | Posts | `${m.posts_title()} \| ${site.name}` | website, site.png | `collectionGraph` | |
  | Post | 글 제목만 (스펙 4.9) | article, `/og/<locale>/<slug>.png` | `postGraph` | `markdownPath`, alternates 는 `available` |
  | root | 제목을 두지 않는다 | | | 공통 항목만 둔다(아래) |
  | 404 | 지금처럼 `<title>` | | | `<meta name="robots" content="noindex">` |

  - root head 의 공통 항목
    - charset, viewport, 폰트 preload, CSS
    - RSS alternate: `localizeHref('/rss.xml')`, title `site.name`
    - `google-site-verification`, `naver-site-verification`: 값이 있을 때만
  - root head 에서 제목을 빼면 404 문서의 `<title>` 이 하나만 남는다(계획 1 미룬 지적).
  - 404 의 `<title>` 과 noindex meta 는 notFoundComponent 안에 React 19 hoisting 으로 넣는다.
- 서버 라우트(`sitemap[.]xml.ts`, `robots[.]txt.ts`)
  - `GET` 만 처리한다.
  - `getLocale() !== 'ko'` 면 404 다. `/en/sitemap.xml` 같은 중복 경로를 막는다.
  - content-type
    - sitemap: `application/xml; charset=utf-8`
    - robots: `text/plain; charset=utf-8`
  - sitemap 항목
    - `/`, `/posts`: locales `['ko', 'en']`, lastmod 는 그 목록의 가장 최근 `updated ?? date`
    - 글마다: locales `postIndex.locales(slug)`, lastmod `updated ?? date`
    - draft 는 뺀다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `sitemap.test.ts`
    - 번역 쌍 글은 `<url>` 두 개다. 각각 ko·en·x-default `xhtml:link` 가 붙는다.
    - 번역 없는 글은 `<url>` 하나이고 `xhtml:link` 가 없다.
    - lastmod 가 없으면 태그가 없다.
    - `&` 가 든 경로는 `&amp;` 로 나온다.
    - 결과가 `<?xml version="1.0" encoding="UTF-8"?>` 로 시작한다.
  - `robots.test.ts`
    - 모든 AI 크롤러 이름이 `User-agent:` 줄로 있다.
    - `*` 그룹과 AI 그룹 모두에 `Disallow: /api/` 와 `Disallow: /admin` 이 있다.
    - 마지막 줄은 `Sitemap: https://nabichan.me/sitemap.xml` 이다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/seo`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 라우트 head·서버 라우트를 잇는다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check`. 그다음 dev 에서 아래를 curl 로 확인한다.
    - `/261020`
      - `<title>이 블로그를 어떻게 만들었나</title>` 가 하나다.
      - canonical, hreflang 3개, `og:image` `https://nabichan.me/og/ko/261020.png`, `application/ld+json` 이 있다.
    - `/does-not-exist`: `<title>` 하나와 noindex 가 있다.
    - `/sitemap.xml`, `/robots.txt` 의 응답과 콘텐츠 타입을 본다.
    - `/en/sitemap.xml` 은 404 다.
  - 기대: 전부 맞음

- [ ] **Step 5: 커밋한다**: `feat: 화면별 메타·JSON-LD 적용, sitemap·robots 추가, 404 제목 중복과 Lobby h1 정리`

### Task 6: RSS

**Files:**
- Create: `src/seo/rss.ts`, `src/routes/rss[.]xml.ts`
- Test: `src/seo/rss.test.ts`

**Interfaces:**
- Consumes: `listFeed` (Task 3), `escapeXml`·`pageUrl` (Task 1)
- Produces

  ```ts
  export function absolutizeHtml(html: string, pageUrl: string): string
  // 본문은 우리가 빌드한 HTML 이라 속성 문자열만 바꾼다
  //   src="/…", href="/…" → origin 붙임
  //   href="#id" → `${pageUrl}#id`
  //   srcset 의 각 '/…' 항목 → origin 붙임
  //   '//' 로 시작하는 값과 외부 URL 은 그대로
  export function buildRss(input: { locale: Locale; title: string; description: string; items: FeedItem[] }): string
  // RSS 2.0 + xmlns:atom, xmlns:content
  //   channel: title, link(pageUrl('/', locale)), description, language(ko|en),
  //            atom:link rel=self(pageUrl('/rss.xml', locale)), lastBuildDate(첫 항목의 updated ?? date, 없으면 생략)
  //   item: title, link·guid(isPermaLink="true", 글 URL), pubDate(date), description(요약),
  //         content:encoded(CDATA, absolutizeHtml(html, 글 URL)), category(태그 표시 이름마다)
  ```

- 서버 라우트: `getLocale()` 언어의 `listFeed` 로 만든다. content-type 은 `application/rss+xml; charset=utf-8` 이다.
  - 정적 에셋으로 굳은 뒤에는 Cloudflare 가 확장자로 `application/xml` 을 붙인다. RSS 리더는 둘 다 받는다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `absolutizeHtml`
    - `<img src="/content-assets/a.png" srcset="/content-assets/a.720w.webp 720w, /content-assets/a.1440w.webp 1440w">` → 두 경로 모두 `https://nabichan.me` 가 붙는다.
    - `<a href="#intro">` → `https://nabichan.me/261020#intro`
    - `<a href="/261021">` → `https://nabichan.me/261021`
    - `<a href="https://x.com">`, `<a href="//cdn.x/y">` 는 그대로다.
  - `buildRss`
    - 제목 `A & <B>` 가 `A &amp; &lt;B&gt;` 로 나온다.
    - 본문의 `]]>` 는 `]]]]><![CDATA[>` 로 나뉜다.
    - en 피드의 link 는 `/en/...` 이다.
    - 항목이 없으면 `lastBuildDate` 가 없다.
    - pubDate 는 `Tue, 20 Oct 2026 03:00:00 GMT` 형식이다(`2026-10-20T12:00:00+09:00` 입력).

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/seo/rss.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 라우트를 잇는다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check`
  - 기대: PASS
  - dev `/rss.xml`, `/en/rss.xml` 을 `xmllint --noout` 으로 검사한다(macOS 기본 탑재). 오류가 없어야 한다.

- [ ] **Step 5: 커밋한다**: `feat: 언어별 RSS(본문 전문, 절대 URL) 추가`

### Task 7: llms.txt · llms-full.txt · 글별 .md

**Files:**
- Create: `src/seo/llms.ts`, `src/routes/llms[.]txt.ts`, `src/routes/llms-full[.]txt.ts`, `src/routes/{$slug}[.]md.ts`
- Test: `src/seo/llms.test.ts`

**Interfaces:**
- Consumes: `listFeed`, `getMarkdown` (Task 3), `pageUrl` (Task 1)
- Produces

  ```ts
  export function buildLlmsTxt(input: { locale: Locale; description: string; items: FeedItem[] }): string
  // # eunsol
  // > {description}
  // 작성자 줄 (ko "작성자: eunsol (Nabi)", en "Author: eunsol (Nabi)")
  // ## 링크 / ## Links: RSS(언어별), Sitemap, 전체 원문(llms-full.txt)
  // ## 글 / ## Posts: - [제목](https://nabichan.me[/en]/<slug>.md): 설명
  export function buildLlmsFull(input: { ko: FeedItem[]; en: FeedItem[] }): string
  // 한국어 글 다음 영어 번역. 글마다:
  //   # 제목
  //   URL: … / Date: … (updated 가 있으면 Updated: …) / Language: ko
  //   빈 줄, 원문 markdown, 빈 줄, ---
  ```

- 서버 라우트
  - `llms[.]txt.ts`: `getLocale()` 언어. content-type `text/plain; charset=utf-8`
  - `llms-full[.]txt.ts`: ko 에서만 응답하고 en 이면 404
  - `{$slug}[.]md.ts`: `getMarkdown(getLocale(), slug)`. null 이면 404(`text/plain`), 아니면 `text/markdown; charset=utf-8`
    - 스파이크에서 없는 글의 `.md` 가 200 이 나는 걸 봤다. 404 처리를 꼭 한다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `buildLlmsTxt('en')`
    - 글 링크가 `https://nabichan.me/en/261020.md` 다.
    - RSS 링크가 `/en/rss.xml` 이다.
    - 항목이 없으면 `## Posts` 아래가 비어 있지 않고 `- (none)` 이다.
  - `buildLlmsFull`
    - ko 글이 en 글보다 앞이다.
    - 글마다 URL 줄과 원문이 있다.
    - draft 는 입력 단계에서 이미 빠지므로 여기서는 받은 것만 쓴다.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/seo/llms.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 라우트를 잇는다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check`
  - 기대: PASS
  - dev 에서 확인한다.
    - `/261020.md`: 200, `text/markdown`. 이미지 경로가 `https://nabichan.me/content-assets/...` 다.
    - `/en/261020.md`: 200
    - `/261099.md`: 404
    - `/llms.txt`, `/en/llms.txt`, `/llms-full.txt`: 200
    - `/en/llms-full.txt`: 404

- [ ] **Step 5: 커밋한다**: `feat: llms.txt·llms-full.txt·글별 Markdown 원문 추가`

### Task 8: 프리렌더 목록 · 메타 URL 스모크

**Files:**
- Modify: `src/lib/prerender.ts`, `src/lib/prerender.test.ts`, `src/lib/smoke.ts`, `src/lib/smoke.test.ts`, `vite.config.ts`, `scripts/smoke.ts`

**Interfaces:**
- Produces

  ```ts
  // src/lib/prerender.ts
  export const SEO_PAGES: readonly string[]
  // ['/sitemap.xml', '/robots.txt', '/rss.xml', '/en/rss.xml', '/llms.txt', '/en/llms.txt', '/llms-full.txt']
  export function markdownPagePaths(postsDir: string, options: { production: boolean }): string[]
  // content/posts/<slug>/index.ko.md 마다 '/<slug>.md'. index.en.md 가 있으면 '/en/<slug>.md' 도
  // production 이면 frontmatter draft: true 인 글(과 그 en)은 뺀다. frontmatter 는 yaml 패키지로 읽는다
  // 목록이 실제 데이터와 어긋나면 .md 라우트가 404 를 내고, failOnError 로 빌드가 멈춘다 (조용히 빠지지 않는다)

  // src/lib/smoke.ts
  export function extractMetaUrls(html: string): string[]
  // <link rel="canonical|alternate" href>, <meta property="og:image"|name="twitter:image" content> 의 값
  ```

- `vite.config.ts` 의 prerender `pages`
  - `[{path:'/'}, {path:'/en'}, ...SEO_PAGES, ...markdownPagePaths('content/posts', { production: mode === 'production' })]`
  - `defineConfig` 를 함수 형태로 바꿔 `mode` 를 받는다.
- `scripts/smoke.ts`
  - 기존 CHECKS 뒤에 메타 URL 검사를 더한다.
    1. `/`, `/en`, `/posts`, `/en/posts`, `/261020`, `/en/261020` HTML 에서 `extractMetaUrls` 를 모은다.
    2. `/sitemap.xml` 의 `<loc>` 와 `href` 도 모은다.
    3. `https://nabichan.me` 를 baseUrl 로 바꿔 `redirect: 'manual'` 로 요청한다.
    4. 전부 200 인지 본다.
  - CHECKS 에 더할 항목
    - `/sitemap.xml`: 200, `<urlset`, `/261020</loc>`
    - `/robots.txt`: 200, `Disallow: /api/`
    - `/rss.xml`: 200, `<rss`, `content:encoded`
    - `/en/rss.xml`: 200, `/en/261020`
    - `/llms.txt`: 200, `/261020.md`
    - `/llms-full.txt`: 200
    - `/261020.md`: 200, `https://nabichan.me/content-assets/`
    - `/en/261020.md`: 200
    - `/og/ko/261020.png`: 200
    - `/261020`: `<title>` 이 정확히 한 번 나온다. `SmokeCheck` 에 `count?: Record<string, number>` 를 더해 판정한다.
    - `/does-not-exist`: `<title>` 한 번, `noindex`

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `markdownPagePaths`: 임시 폴더에 세 글을 만든다.
    - 번역 있음 → `.md` 두 개
    - 번역 없음 → 하나
    - draft → production 에서 0개, dev 에서 포함
  - `extractMetaUrls`
    - canonical, hreflang 3개, og:image, twitter:image, markdown alternate, RSS alternate 를 모두 뽑는다.
    - `<a href>` 는 뽑지 않는다.
  - `checkResponse` 의 `count`: `<title>` 이 두 번이면 `"<title" 가 1번 있어야 합니다 (실제 2번)`.

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/lib/prerender.test.ts src/lib/smoke.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 vite 설정·스모크를 바꾼다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm check && pnpm build`
  - 기대
    - 빌드 로그 `Prerendered` 목록에 SEO 경로 7개와 `.md` 2개가 있다.
    - `dist/client/` 에 `sitemap.xml`, `robots.txt`, `rss.xml`, `en/rss.xml`, `llms.txt`, `en/llms.txt`, `llms-full.txt`, `261020.md`, `en/261020.md`, `og/ko/261020.png` 가 있다.
    - preview 를 띄워 `pnpm smoke http://localhost:4173` 을 돌린다. 전부 통과하고, 메타 URL 은 전부 200 이다.
    - `.txt` 의 콘텐츠 타입을 기록한다.

- [ ] **Step 5: 커밋한다**: `feat: SEO·GEO 산출물을 프리렌더하고 메타 URL 200 을 스모크로 확인`

### Task 9: IndexNow

**Files:**
- Create: `src/lib/indexnow.ts`, `scripts/indexnow.ts`, `public/<key>.txt`
- Test: `src/lib/indexnow.test.ts`
- Modify: `package.json`(`"indexnow": "node scripts/indexnow.ts"`)

**Interfaces:**
- Produces

  ```ts
  export function sitemapUrls(xml: string): string[]                 // <loc> 값
  export function changedSlugs(files: string[]): string[]            // 'content/posts/<slug>/…' 경로에서 slug (중복 없이)
  export function selectIndexNowUrls(input: { sitemap: string[]; slugs: string[]; all: boolean }): string[]
  // all 이면 sitemap 전부
  // 아니면 sitemap 중 경로가 '/<slug>' 또는 '/en/<slug>' 인 것
  // sitemap 에 없는 URL(draft·삭제된 글)은 보내지 않는다
  export function indexNowPayload(urls: string[]): { host: string; key: string; keyLocation: string; urlList: string[] }
  // host 'nabichan.me', keyLocation `https://nabichan.me/<key>.txt`
  ```

- `scripts/indexnow.ts`
  - 사용법: `node scripts/indexnow.ts [--all] [--submit] [--base <sha>] [--head <sha>]`
  - URL 은 `dist/client/sitemap.xml` 에서 읽는다(빌드 뒤에 실행). 바뀐 파일은 `git diff --name-only <base> <head> -- content/posts` 로 구한다. 기본 base 는 `HEAD~1`, head 는 `HEAD` 다.
  - **기본은 미리보기다.** 보낼 URL 과 payload 를 출력하고 끝난다.
  - `--submit` 일 때만 `POST https://api.indexnow.org/indexnow`(`content-type: application/json; charset=utf-8`)로 보낸다.
    - 응답 200/202 면 성공이고, 그 밖은 exit 1 이다.
    - URL 이 0개면 보내지 않는다.
  - 네이버·Bing 등 참여 검색엔진은 이 엔드포인트로 같이 받는다(indexnow.org 확인). Google 은 받지 않는다.
- 키 파일: `public/<site.indexNowKey>.txt` 내용은 키 문자열 하나다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**
  - `sitemapUrls`: 예시 XML 에서 `<loc>` 둘을 뽑는다. `xhtml:link` 의 href 는 뽑지 않는다.
  - `changedSlugs(['content/posts/261020/index.ko.md', 'content/posts/261020/a.png', 'src/x.ts'])` = `['261020']`
  - `selectIndexNowUrls`
    - slugs `['261020']` 이면 ko·en 두 URL 이다.
    - 목록에 없는 slug 는 빈 배열이다.
    - all 이면 전부다.
  - `indexNowPayload` 의 keyLocation 과 host

- [ ] **Step 2: 실행해서 실패를 확인한다**
  - 실행: `pnpm vitest run src/lib/indexnow.test.ts`
  - 기대: FAIL

- [ ] **Step 3: 구현하고 키 파일과 스크립트를 만든다.**

- [ ] **Step 4: 확인한다**
  - 실행: `pnpm test && pnpm build && pnpm indexnow --all`
  - 기대: 미리보기만 출력한다(전송 없음). URL 목록이 sitemap 과 같다.
  - preview 에서 `/<key>.txt` 가 200 이고 키 문자열을 돌려준다.

- [ ] **Step 5: 커밋한다**: `feat: 바뀐 글을 알리는 IndexNow 스크립트 추가 (기본은 미리보기)`

### Task 10: 계획 3 마무리 검증

**Files:** 없음 (검증과 ledger 기록. 고칠 것이 나오면 해당 파일)

- [ ] **Step 1: 자동 검증**
  - 실행: `pnpm test && pnpm check && pnpm build`, preview 스모크
  - 기대: 전부 통과. 커버리지는 functions 100%, lines 90% 이상이다.
- [ ] **Step 2: 산출물 직접 확인** (결과를 ledger 에 남긴다)
  - `xmllint --noout dist/client/sitemap.xml dist/client/rss.xml dist/client/en/rss.xml`
  - JSON-LD: preview `/261020`, `/posts` 의 `application/ld+json` 을 꺼내 `JSON.parse` 한다. `@graph` 의 `@id` 참조가 모두 그래프 안에 있는지 node 한 줄로 확인한다.
  - OG 이미지 네 장을 눈으로 확인한다(Task 4 스크린샷).
  - `llms.txt`, `/261020.md` 내용을 훑는다. 이미지 절대 URL 과 frontmatter 가 없는지 본다.
  - hydration: 4화면 × 2언어에서 `window.__recoverableErrors` 가 비어 있다(head 변경 확인).
- [ ] **Step 3: 커밋한다**: 고친 것이 있을 때만 `test: 계획 3 마무리 검증`

---

## 다음 계획으로 넘기는 것

- **계획 4**
  - `audit:repo` 에 넣는다: 메타 URL 200 검사, 산출물 존재 검사
  - 샘플 글 본문을 은솔 문체로 다시 쓴다. OG 카드도 그 제목으로 다시 확인한다.
- **계획 5**
  - GitHub Actions 배포 성공 뒤 `pnpm indexnow --submit --base ${{ github.event.before }} --head ${{ github.sha }}`
  - Cloudflare AI Crawl Control 과 managed robots.txt 가 꺼져 있는지 확인한다.
  - Google Search Console·네이버 서치어드바이저 인증 값을 `site.verification` 에 넣을지 은솔에게 묻는다.
