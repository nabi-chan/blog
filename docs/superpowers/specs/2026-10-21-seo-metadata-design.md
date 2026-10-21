# SEO 메타 분리 설계

글 frontmatter 에 검색용 제목(`seoTitle`)과 검색 키워드(`keywords`)를 넣고, 태그(`tags`)를 큰 분류인 카테고리(`categories`)로 바꾼다.

## 1. 왜 하나

지금은 글 제목 하나가 화면 제목, `<title>`, `og:title` 을 모두 맡는다. 태그도 독자에게 보이는 분류와 검색 키워드(JSON-LD `keywords`, `article:tag`) 역할을 같이 한다. 은솔은 이 둘을 떼어 내려 한다.

- 화면에 보이는 제목은 짧게 두고, 검색 결과에는 핵심 검색어가 들어간 긴 제목을 보인다.
- 독자에게는 몇 안 되는 큰 분류만 보이고, 잘게 나뉜 주제어는 검색 엔진만 본다.

참고한 예시는 `jiji-hoon96/jihoon-blog` 의 frontmatter 다. 필드의 역할만 가져오고 형식(공백으로 구분한 `categories` 문자열, `emoji`, `updatedAt`)은 따르지 않는다.

```yaml
title: "LZ77과 LZ78의 차이"
seoTitle: "LZ77과 LZ78의 차이: sliding window, 명시적 사전, DEFLATE의 뿌리"
categories: 소박한궁금증 소프트웨어
keywords: "LZ77, LZ78, LZ77 LZ78 차이, LZ77 알고리즘, sliding window 압축, LZW, DEFLATE 원리, 사전 기반 압축"
```

### 성공 기준

- 글 페이지의 `<title>`·`og:title`·`twitter:title` 이 `seoTitle` 이고, 화면 제목·OG 카드·브레드크럼은 `title` 이다.
- 글 페이지에 `<meta name="keywords">` 가 있고, 키워드는 화면 어디에도 보이지 않는다.
- `/posts` 필터와 글 페이지가 태그 대신 카테고리를 보인다.
- `seoTitle`·`keywords`·`categories` 중 하나라도 빠진 글은 빌드가 멈춘다.
- ko 의 `seoTitle`·`keywords` 를 고치면 en 번역이 낡은 것으로 잡힌다.

## 2. 목표·비목표·반목표

**목표**
- ko·en frontmatter 에 `seoTitle`, `keywords` 를 필수로 넣는다.
- ko frontmatter 의 `tags` 를 `categories` 로 바꾸고 1개 이상을 강제한다. en 은 ko 에서 상속한다(지금 `tags` 와 같다).
- `content/tags.yaml` 을 `content/categories.yaml` 로 바꾼다.
- 태그를 쓰던 코드·검사·문서·커맨드를 모두 카테고리로 옮긴다.

**비목표**
- 카테고리별 페이지(`/categories/<key>`)는 만들지 않는다. 필터(`/posts?category=<key>`)로만 간다.
- 카테고리 위계(상위·하위 분류)는 두지 않는다.
- 키워드를 독자 화면에 보이지 않는다.
- 옛 `?tag=` 주소의 리다이렉트는 두지 않는다. 첫 글이 2026-10-21 에 나와서 밖에서 걸린 필터 링크는 거의 없고, 걸려 있어도 필터 없는 목록이 보일 뿐이다(이로하의 결정).
- 예시의 `emoji`, `updatedAt` 은 넣지 않는다.
- 홈·글 목록 등 글이 아닌 페이지의 `<title>` 은 바꾸지 않는다.

**반목표** — 아래 중 하나라도 생기면 겉으로 돌아가도 실패다.
- 필수 필드가 빠진 글이 조용히 빌드된다.
- ko 의 `seoTitle`·`keywords` 가 바뀌었는데 en 번역이 낡은 것으로 잡히지 않는다.
- 글 목록 등 글 페이지가 아닌 곳의 loader 데이터에 `seoTitle`·`keywords` 가 실려 클라이언트로 내려간다.
- 태그 흔적(`tags` 필드, `tags.yaml`, `?tag=`, `data-tags`, `.tag-filter`, 메시지 키 `posts_all_tags`·`posts_tag_filter` 등)이 코드·문서·커맨드에 남는다. 일반 단어 "tag"(HTML 태그, `<meta>` 태그)는 해당하지 않는다. `docs/superpowers/specs`·`docs/superpowers/plans` 의 지난 설계서·계획서는 그때 결정의 기록이라 고치지 않는다(이로하의 결정).

## 3. 은솔이 정한 것

| 항목 | 결정 |
|---|---|
| `seoTitle` | `<title>`·`og:title` 용. 글 제목과 다르다. **필수** |
| `keywords` | `<meta name="keywords">` 용. 화면에 보이지 않는다. **필수** |
| `categories` | 태그를 **완전히 대체**한다. 성격이 바뀌어 몇 안 되는 큰 분류가 된다. 1개 이상 |
| 카테고리 표시 이름 | `content/categories.yaml` 에 키 + ko/en. frontmatter 에는 키를 적는다 |
| 카테고리 위계 | 없다 |
| 카테고리 화면 | `/posts` 필터로만 간다. 별도 페이지는 없다 |
| 영어판 | `index.en.md` 도 `seoTitle`·`keywords` 를 따로 갖고 `/translate-post` 가 번역한다 |
| 낡은 번역 | ko 의 `seoTitle`·`keywords` 가 바뀌면 `sourceHash` 가 달라진다 |
| OG 카드 | 지금처럼 `title` 을 그린다 |

## 4. 지금 상태(소스로 확인)

- 스키마는 `content-collections.ts` 의 `koPosts`·`enPosts` 에 있다. ko 는 `tags: z.array(z.string().regex(TAG_PATTERN)).default([])` 이고, en 은 `title`·`description`·`sourceHash`·`translationStatus` 만 받는다. 표시 이름은 `tagLabels` 컬렉션(`content/tags.yaml`)이다.
- `TAG_PATTERN` 은 `src/shared/config/content.ts` 에 있다.
- `sourceHash` 는 `src/entities/post/source/source-hash.ts` 의 `computeSourceHash({ title, description, body })` 다. 부르는 곳은 `content-collections.ts`(ko 변환), `resolve-en-post.ts`(빌드 시 비교), `content-checks.ts`(`content:check`), 그리고 `content:rehash` 스크립트다.
- `scripts/content-check.ts`·`scripts/audit.ts` 는 frontmatter 를 직접 파싱하고 `tags.yaml` 을 읽어 `collectContentProblems` 에 넘긴다. 빠진 표시 이름은 `missingTagLabels` 가 잡는다.
- 글 데이터 흐름: `PostMeta.tags` → `post-queries.ts` 의 `tagRefs`(키 → `TagRef { key, label }`) → `PostPage.tags`, `listPosts().tags`, `FeedItem.tags`.
- 메타: `src/app/routes/$slug.tsx` 가 `pageHead({ title: post.title, tags: labels, ... })` 와 `postGraph({ ...post, tags: labels })` 를 부른다. `head.ts` 는 `input.title` 을 `<title>`·`og:title`·`og:image:alt`·`twitter:title` 에, `tags` 를 `article:tag` 에 쓴다. `json-ld.ts` 는 `title` 을 `headline` 과 브레드크럼에, `tags` 를 `keywords` 에 쓴다. 글 페이지 `<title>` 에는 사이트 이름 접미사가 없다.
- RSS(`src/app/seo/rss.ts`)는 태그 표시 이름을 `<category>` 로 낸다.
- 화면: `/posts` 의 `TagFilter`(`src/pages/posts/ui/`)와 `src/pages/posts/lib/tag-filter.ts` 가 `?tag=` → `<html data-tag>` → CSS 로 필터한다(hydration 을 깨지 않으려고 React 렌더를 바꾸지 않는다). `PostList` 가 `data-tags` 를 단다. 글 페이지는 `.post-tags` 목록에 표시 이름을 글자로만 보인다(링크 아님).
- 문서: `.claude/commands/write-post.md`, `.claude/commands/translate-post.md`, `docs/writing/style-guide.md`, `AGENTS.md` 의 "글 쓰기" 절이 태그를 말한다.
- 공개 글은 `261021-hermes-agent-personal-assistant` 한 편이다(2026-10-21 배포). ko 는 `tags: ["hermes-agent", "mcp", "automation"]` 이고, en 은 `translationStatus: reviewed` 다.
- `content/tags.yaml` 에는 `meta`(블로그), `cloudflare`, `hermes-agent`, `mcp`, `automation` 다섯 개가 있다.

## 5. 설계

### 5.1 frontmatter

ko:

```yaml
title: "LZ77과 LZ78의 차이"
seoTitle: "LZ77과 LZ78의 차이: sliding window, 명시적 사전, DEFLATE의 뿌리"
description: "…"
date: "2026-10-21"
categories: ["software"]
keywords: ["LZ77", "LZ78", "LZ77 LZ78 차이", "sliding window 압축", "DEFLATE 원리"]
```

en: `title`, `seoTitle`, `description`, `keywords`, `sourceHash`, `translationStatus`. `date`·`updated`·`categories`·`draft` 는 지금처럼 ko 에서 상속한다.

- `seoTitle`: `z.string().min(1)`.
- `keywords`: `z.array(z.string().min(1)).min(1)`. YAML 배열로 쓴다(이로하의 결정: `categories` 와 모양을 맞추고 쉼표 분리 규칙을 따로 두지 않으려는 것).
- `categories`: `z.array(z.string().regex(KEY_PATTERN)).min(1)`. `TAG_PATTERN` 은 용어집 키 검사도 같이 쓰므로 `KEY_PATTERN` 으로 이름을 바꾸고 값은 그대로 둔다(이로하의 결정).
- `tags` 는 스키마에서 뺀다.

### 5.2 카테고리 표시 이름

`content/categories.yaml`:

```yaml
categories:
  - key: software
    ko: 소프트웨어
    en: Software
```

컬렉션 이름은 `categoryLabels` 로 바꾼다. frontmatter 의 카테고리 키가 이 파일에 없으면 지금 태그처럼 `content:check`(와 `audit:repo` 의 콘텐츠 검사)가 문제로 잡는다.

초기 항목은 은솔이 정했다. 키와 영어 이름은 이로하의 결정이다. `tags.yaml` 의 다섯 항목은 옮기지 않는다.

| 키 | ko | en |
|---|---|---|
| `software` | 소프트웨어 | Software |
| `hardware` | 하드웨어 | Hardware |
| `ai` | AI | AI |
| `frontend` | 프론트엔드 | Frontend |
| `backend` | 백엔드 | Backend |
| `infra` | 인프라 | Infrastructure |
| `hermes-agent` | Hermes Agent | Hermes Agent |
| `home-server` | 홈 서버 | Home Server |

### 5.3 sourceHash

`computeSourceHash` 입력에 `seoTitle` 과 `keywords` 를 더한다. 키워드 순서를 바꿔도 해시가 바뀌는데, 이건 받아들인다. 부르는 네 곳(4장)을 모두 맞춘다. 이미 있는 글의 en `sourceHash` 는 무효가 되므로 5.9 에서 같이 고친다.

### 5.4 메타(글 페이지)

| 자리 | 값 |
|---|---|
| `<title>`, `og:title`, `twitter:title` | `seoTitle` |
| `og:image:alt` | `title` (카드에 그린 글자와 같게) |
| `<meta name="keywords">` | `keywords` 를 `, ` 로 이음 |
| `article:tag` | 달지 않는다. TanStack 의 head 처리가 같은 `property` 메타를 하나만 남겨서 여러 개를 낼 수 없다(구현 중 확인, 이로하의 결정) |
| JSON-LD `headline`, 브레드크럼 이름 | `title` (화면 제목과 같게) |
| JSON-LD `keywords` | `keywords` |
| JSON-LD `articleSection` | 카테고리 표시 이름 배열 (이로하의 결정) |
| RSS `<category>` | 카테고리 표시 이름 |

`HeadInput` 은 `<title>` 과 이미지 alt 를 따로 받게 바꾸고, `tags` 는 `keywords` 로 이름을 바꾼다. 다른 페이지(홈·목록·404)의 메타 출력은 바뀌지 않아야 한다. 구체적인 필드 이름은 빌더가 정한다.

`seoTitle`·`keywords` 는 글 페이지 데이터(`PostPage`)에만 싣는다. `PostMeta` 에 넣으면 `/posts` 목록 loader 데이터에도 실려 클라이언트로 내려가므로, 넣는 위치는 반목표를 어기지 않는 선에서 빌더가 정한다.

### 5.5 화면

- `/posts`: `TagFilter` → `CategoryFilter`, `?tag=` → `?category=`, `<html data-tag>` → `data-category`, `data-tags` → `data-categories`, `.tag-filter` → `.category-filter`. 동작 방식(속성 + CSS, 인라인 스크립트로 페인트 전에 적용)과 칩 순서(글 수 내림차순, 같으면 키 순)는 그대로다.
- 글 페이지: `.post-tags` → `.post-categories`. 지금처럼 글자로만 보인다(링크 아님).
- 화면 문구에 "태그"가 있으면 `messages/ko.json`·`en.json` 에서 "카테고리"/"Category" 로 바꾼다.

### 5.6 검사·스크립트

- `scripts/content-check.ts`·`scripts/audit.ts` 의 frontmatter 파싱과 표시 이름 파일 경로를 바꾼다. `missingTagLabels` → `missingCategoryLabels`.
- `content:rehash` 가 새 해시 입력으로 계산하게 한다.
- 스모크(`src/shared/tooling/smoke.ts`·`scripts/smoke.ts`)의 `?tag=` 검사는 `?category=` 로 바꾼다.
- `seoTitle` 길이 상한은 두지 않는다(이로하의 결정: 필수 검사만 하고 길이는 스타일 가이드로 안내한다).

### 5.7 문서·커맨드

규칙 문서는 문어체 규정 말투로 쓴다.

- `.claude/commands/write-post.md`: frontmatter 예시를 5.1 로 바꾸고, `seoTitle`·`keywords`·`categories` 를 채우는 절차를 넣는다. 새 카테고리는 `content/categories.yaml` 에 추가하되, 큰 분류이므로 기존 카테고리로 먼저 해결한다.
- `.claude/commands/translate-post.md`: en frontmatter 필드 목록에 `seoTitle`·`keywords` 를 넣고, 영어 검색어 기준으로 번역한다(직역하지 않는다)고 적는다. 상속 목록의 `tags` 를 `categories` 로 바꾼다.
- `docs/writing/style-guide.md`: 태그 규칙을 카테고리 규칙으로 바꾸고 `seoTitle`·`keywords` 작성 기준을 넣는다. 기준(이로하의 결정, 예시에서 가져옴):
  - `seoTitle` 은 사람들이 검색할 말로 시작하고, 콜론 뒤에 글이 다루는 핵심 개념을 붙인다.
  - `keywords` 는 5~10개, 사람이 검색창에 칠 모양으로 쓴다(예: "LZ77 LZ78 차이").
- `title` 규칙을 바꾼다(은솔이 정함). 지금은 `title` 에 검색 역할을 맡긴다. 앞으로는 "화면과 OG 카드에 맞게 짧게"로 쓰고(OG 카드 40자 안내는 유지), 검색어를 앞에 두는 규칙은 `seoTitle` 로 옮긴다. 바꿀 곳은 세 군데다.
  - `docs/writing/style-guide.md` 의 제목 규칙
  - `.claude/commands/write-post.md`: frontmatter 예시 `title: "검색할 말이 앞에 오는 제목"`, 체크리스트 "제목에 검색할 말이 앞쪽에 있다"
  - `.claude/commands/refine-post.md`: 5단계 SEO 점검이 `seoTitle`·`keywords` 를 보게 하고, 58행 근처의 낡은 번역 안내에 `seoTitle`·`keywords` 를 더한다
- `AGENTS.md` "글 쓰기" 절의 `content/tags.yaml` 을 `content/categories.yaml` 로 바꾼다. "꼭 지킬 것"의 "ko 원문의 본문·제목·설명을 고치면" 에 `seoTitle`·`keywords` 를 더한다.
- RSS 항목 제목은 지금처럼 `title` 이다.

### 5.8 바꾸지 않는 것

- 렌더 결과가 바뀌지 않으므로 `RENDER_VERSION` 은 그대로 둔다.
- OG 카드는 `title` 을 그대로 그리므로 `OG_VERSION` 은 그대로 둔다.
- llms.txt·글별 `.md` 원문의 내용은 바꾸지 않는다.

### 5.9 이미 있는 글 옮기기

`261021-hermes-agent-personal-assistant` 를 같은 변경에서 새 형식으로 옮긴다. 옮기지 않으면 필수 필드 때문에 빌드가 멈춘다.

- ko: `tags` 를 지우고 `categories: ["hermes-agent", "ai"]`(이로하의 결정)와 `seoTitle`·`keywords` 를 넣는다. 지금 태그(`hermes-agent`, `mcp`, `automation`)는 `keywords` 의 재료로 쓴다.
- en: `seoTitle`·`keywords` 를 영어 검색어 기준으로 넣고 `sourceHash` 를 새 해시로 바꾼다. 본문 번역은 손대지 않으므로 `translationStatus` 는 `reviewed` 를 유지한다.
- 넣을 값은 빌더가 스타일 가이드 기준으로 제안하고 은솔이 확인한다(커맨드는 커밋하지 않는다는 저장소 규칙과 같다).

## 6. 검증

- `pnpm check`, `pnpm test`(커버리지 함수 100%, 줄 90%), `pnpm audit:repo`.
- 테스트로 확인할 것:
  - 필수 필드(`seoTitle`, `keywords`, `categories`)가 빠지거나 비면 스키마가 거절한다.
  - `seoTitle`·`keywords` 를 바꾸면 해시가 바뀐다.
  - 글 페이지 메타가 5.4 표대로 나온다. 다른 페이지의 메타는 그대로다.
  - 카테고리 필터 CSS·파라미터 읽기가 지금 태그 필터 테스트와 같은 범위로 통과한다.
  - 표시 이름이 없는 카테고리 키를 `content:check` 가 잡는다.
- 빌더 몫: 임시 글 하나(ko+en)로 `pnpm dev` 에서 `<head>` 와 `/posts?category=` 동작을 확인하고, 그 글은 커밋하지 않는다.
- `grep -rni "tag"` 로 태그 흔적이 남지 않았는지 본다(HTML·메타 태그 같은 일반 단어와 `docs/superpowers/` 는 빼고).

## 7. 빌더에게 맡기는 것

- `keywords` 를 해시에 넣을 때의 직렬화 방식
- `seoTitle`·`keywords` 를 `PostPage` 의 어디에 실을지(반목표 안에서)
- `HeadInput` 의 필드 이름
- 첫 글에 넣을 `seoTitle`·`keywords` 값 제안(은솔이 확인한다)
