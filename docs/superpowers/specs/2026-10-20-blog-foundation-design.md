# eunsol 블로그 기반 설계

- 작성일: 2026-10-20
- 상태: 승인됨 (2026-10-20)
- 표기
  - **[은솔]**: 은솔이 직접 정한 것
  - **[이로하]**: 이로하가 정한 기본값. 승인할 때 같이 확인한다
  - **[배포 때]**: 배포 단계에서 은솔에게 물어볼 것

## 1. 의도

은솔(Nabi)의 개인 블로그를 처음부터 다시 만든다. 직전 Next.js + Supabase 버전은 커밋 `9eae95c` 에서 통째로 비웠고, 그 글·화면·코드는 하나도 가져오지 않는다 [은솔]. 예전 글은 문체 분석 자료로만 썼다.

스택 [은솔]:

- TanStack Start + Tailwind CSS + Content Collections(MDX)
- Cloudflare Workers 배포, Cloudflare D1
- Paraglide JS 다국어. Intlayer 와 직접 구현을 비교한 뒤 골랐다.

이번 범위는 "포스트를 띄우는 것"에서 시작해 댓글·조회수·SEO/GEO·다국어·자동 배포·글쓰기 에이전트 커맨드까지 포함한다 [은솔].

## 2. 목표 / 비목표 / 안티골

### 목표

1. 세 화면 [은솔]. 영어는 같은 구조를 `/en` 아래에 둔다.
   - `/` Lobby: 짧은 글 목록
   - `/posts` Posts: 전체 목록
   - `/posts/$slug` Post: 글 상세
2. MDX 글: 코드 하이라이팅, Callout, Figure(이미지+캡션), 목차(TOC) [은솔].
3. SUIT 기반 무채색 모던 디자인, lucide-react 아이콘, 라이트 모드만 [은솔].
4. 댓글 [은솔]
   - 누구나 작성자명 + 내용 + 비밀번호로 쓰고, 비밀번호로 수정·삭제한다.
   - 은솔은 Cloudflare Access 세션으로 구분한다.
   - 대댓글은 없다.
5. 조회수: 글별(같은 방문자는 하루 1회) + 사이트 전체 PV [은솔].
6. SEO/GEO: jihoon-blog 를 참고해 메타, 구조화 데이터, sitemap, robots, RSS, llms.txt 등 [은솔].
7. 다국어: 한국어(기본, 접두사 없음) + 영어(`/en/...`), 이번에 전부 구현 [은솔].
8. 에이전트 커맨드: write-post, refine-post, translate-post, audit [은솔]. 문체 가이드는 은솔 예전 글 기반 [은솔].
9. `nabichan.me` 배포 [은솔]
   - 첫 배포는 이로하가 한다.
   - 이후는 main push 에 GitHub Actions 로 자동 배포한다.
   - `nabi.kim` 은 `nabichan.me` 로 리다이렉트한다.

### 비목표

- 대댓글, 관리자 페이지, 다크 모드, 태그 전용 페이지, 페이지네이션, 사이트 검색, 뉴스레터
- 브라우저 언어 감지 자동 리다이렉트 [은솔]
- 영어 글의 "번역본입니다" 표시 [은솔]
- 예전 글·디자인 이전
- Sentry 같은 외부 에러 모니터링, GA 같은 외부 분석 도구
- R2 이미지 저장소
- 한국어·영어 외 언어

### 안티골 (동작은 해도 이렇게 되면 실패다)

- 익명 댓글에 스팸이 쌓이거나, 비밀번호를 대입해서 남의 댓글을 고칠 수 있다.
- 다른 사람이 은솔인 척 댓글을 쓸 수 있다.
- 영어 페이지의 링크가 한국어 글로 새거나, hreflang 이 404 를 가리킨다.
- 로컬에서는 되는데 배포하면 다르게 동작한다 (Workers 런타임 제약, dev 전용 동작).
- 조회수가 0 으로 보이는데 실제로는 장애다.
- 첫 로드에 폰트 수백 KB 를 통째로 받거나, 모든 글이 클라이언트 번들에 실린다.
- 숫자·댓글이 늦게 들어오면서 레이아웃이 흔들린다 (CLS).
- 댓글 비밀번호가 평문이나 쉽게 되돌릴 수 있는 형태로 저장된다.

## 3. 제약

### 버전 (2026-10-20 레지스트리 확인값)

| 항목 | 값 | 비고 |
|---|---|---|
| Node.js | 26 (로컬 26.12.0) [은솔] | 2026-10-28 LTS 전환 예정 |
| pnpm | 12 (12.14.0) [은솔] | `packageManager` 와 `engines` 에 고정 |
| @tanstack/react-start | ≥1.169 (첫 stable) | `.inputValidator()` 가 없어지고 `.validator()` 로 바뀜. Vite 8 필수 |
| vite / @vitejs/plugin-react | 8.x / 6.x | |
| @cloudflare/vite-plugin | **^1** (1.64.x) | v2 는 베타이고 wrangler deploy 를 지원하지 않음 |
| wrangler | 최신 4.x (≥4.107) | 4.107 미만은 Node 26 에서 메시지 없이 exit 1 |
| tailwindcss / @tailwindcss/vite | 4.3.x | `@tailwindcss/typography` 0.5.x 는 `@plugin` 으로 |
| @content-collections/core / vite | 0.15.x / 0.3.x | |
| @inlang/paraglide-js | **정확한 버전으로 고정** (현재 2.29.1) | 최근 5주 동안 8번 릴리스 |
| lucide-react | 1.x | v1 부터 브랜드 아이콘 없음 |

- 공식 문서 중 낡은 예시가 있다. 그대로 복사하지 않는다.
  - Content Collections 의 TanStack quickstart (vinxi 시절)
  - TanStack 의 rendering-markdown 가이드 (`app.config.ts`, 런타임 Shiki)
- pnpm 11+ 기본값
  - `minimumReleaseAge` 가 하루라서 어제 나온 패키지는 설치되지 않는다.
  - `strictDepBuilds` 때문에 `workerd`·`esbuild` 등의 postinstall 을 승인해야 한다 (`allowBuilds`, `pnpm approve-builds`).
  - 설정은 `pnpm-workspace.yaml` 에 둔다.

### 런타임

- **Workers 는 `eval` / `new Function` 을 막는다.** 그래서 `@content-collections/mdx` 의 `MDXContent`(런타임 평가)는 쓸 수 없다. MDX 는 빌드 시점에 실제 JS 모듈로 컴파일한다 (4.4).
- **프리렌더된 페이지는 정적 에셋이 Worker 보다 먼저 서빙한다.** 정적 페이지 요청은 Worker 미들웨어를 타지 않는다.
- **Paraglide 서버 미들웨어는 AsyncLocalStorage 를 쓴다.** 공식 문서가 "Cloudflare Workers 에서 Node 호환이 켜져 있으면 기본값 그대로"라고 한다. 우리는 `nodejs_compat` 을 켠다.
- Paraglide + TanStack Start 공식 가이드는 있지만 Cloudflare Workers 와 프리렌더 조합은 언급이 없다. 가장 먼저 검증한다 (7).
- **Workers 무료 플랜 기준으로 설계한다** [이로하]. 유료 플랜인지 배포 때 확인한다.
  - 요청당 CPU 10ms
  - Worker 압축 후 3MB
- WebCrypto PBKDF2 는 Workers 에서 반복 횟수 상한(100,000)이 있고, CPU 한도 안에 들어야 한다 (4.7).
- **Cloudflare Access 쿠키의 성질** (공식 문서)
  - 경로 속성을 끄면(기본값) `CF_Authorization` 쿠키가 호스트 단위로 잡혀서 같은 호스트의 다른 경로 요청에도 실린다.
  - SameSite 는 앱 설정에서 고른다.
  - Worker 는 요청 헤더로 쿠키를 받아 JWT 를 직접 검증한다.

### 라이선스

- **SUIT 폰트**
  - OFL-1.1 이고 **Reserved Font Name "SUIT"** 가 선언돼 있다.
  - 서브셋은 OFL 상 수정본이라 원래 이름을 쓸 수 없다.
  - 그래서 서브셋 파일의 내부 폰트 이름을 바꾸고, OFL 전문과 원저작자 표기를 함께 둔다 [이로하].
- Simple Icons(브랜드 아이콘 SVG 경로)는 CC0 이다.
- jihoon-blog 에는 라이선스 파일이 없다. 구조와 아이디어만 참고하고, 문장이나 코드는 옮기지 않는다 [이로하].
- 이 블로그 글의 라이선스는 **CC BY-NC 4.0** 이다 [은솔].

## 4. 설계

### 4.1 렌더링 전략

- **글·목록 페이지는 빌드 시 프리렌더한다** [이로하]. Lobby, Posts, Post × ko/en 이 대상이고, Workers 정적 에셋으로 서빙한다.
- **댓글과 조회수는 브라우저가 Worker API 를 호출해서 채운다.** 프리렌더된 HTML 에는 숫자와 댓글 없이 자리(레이블, 높이)만 있다.
- **SEO/GEO 산출물도 빌드할 때 만든다.** sitemap, robots, RSS, llms.txt, `.md` 원문, OG 이미지가 대상이다. 서버 라우트 + 프리렌더로 할지 빌드 스크립트로 할지는 빌더 재량이지만, 요청마다 Worker 에서 다시 만들지 않는다.
- **메타에 실리는 URL 은 리다이렉트되면 안 된다.**
  - canonical, hreflang, OG 이미지, sitemap 에 들어가는 URL 은 전부 200 이어야 한다.
  - 정적 에셋의 trailing slash 처리(`html_handling`)와 프리렌더 출력 형식(`autoSubfolderIndex`)을 맞춰, `/posts/foo` 와 `/posts/foo/` 사이에 리다이렉트가 생기지 않게 한다.
  - 정규 형태는 **슬래시 없음**이다.

### 4.2 라우트

| 경로 | 화면 |
|---|---|
| `/`, `/en` | Lobby |
| `/posts`, `/en/posts` | Posts (`?tag=` 로 태그 필터) |
| `/posts/<slug>`, `/en/posts/<slug>` | Post |
| `/posts/<slug>.md`, `/en/posts/<slug>.md` | 글 원문 (GEO) |
| `/rss.xml`, `/en/rss.xml` | RSS |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/en/llms.txt`, `/llms-full.txt` | SEO/GEO |
| `/admin` | Cloudflare Access 로그인 입구 (4.7) |
| 그 외 | 404. 해당 언어 레이아웃, 상태 코드 404 |

- **라우트 파일은 언어 없이 한 벌만 정의한다** (`src/routes/index.tsx`, `posts/index.tsx`, `posts/$slug.tsx`).
  - 언어 접두사는 TanStack Router 의 `rewrite` 옵션과 Paraglide 의 `deLocalizeUrl` / `localizeUrl` 로 처리한다 (4.5).
  - `{-$locale}` 파라미터는 쓰지 않는다.
- 깨진 퍼센트 인코딩(`/posts/%E0`)과 없는 언어 접두사(`/fr/posts`)는 500 이 아니라 404 로 끝나야 한다.
- 영어 번역본이 없는 글의 `/en/posts/<slug>` 는 404 다 [은솔: 번역 없으면 숨김].

### 4.3 콘텐츠 모델

```
content/posts/<slug>/
  index.ko.mdx      # 필수, 원문
  index.en.mdx      # 선택, 번역본
  diagram.png       # 글 옆 이미지 [은솔]
```

- slug 는 폴더 이름이다. 소문자 kebab-case ASCII 를 권장한다 [이로하]. 날짜는 frontmatter 에만 두고, 두 언어가 같은 slug 를 쓴다.

**ko frontmatter** [은솔: 기본 + 선택 필드]

```yaml
---
title: "oMLX로 맥북 프로에서 LLM 돌리기"
description: "..."
date: "2026-05-06 20:55:00"     # KST, 초는 생략 가능
updated: "2026-05-10 10:00"     # 선택. 의미 있는 수정일 때만
tags: ["llm", "macos"]          # 선택. 태그 키
draft: true                      # 선택
---
```

- **날짜는 KST 로 명시해서 파싱한다** [이로하].
  - 빌드(Node, 로컬 KST)와 Worker(UTC)가 같은 값을 다르게 해석하면 날짜가 하루 밀리거나 hydration 불일치가 난다.
  - 화면 표시에는 `Intl.DateTimeFormat` 에 `timeZone: 'Asia/Seoul'` 을 준다.
- **zod 스키마로 검증하고, 실패하면 빌드를 멈춘다.** `description` 길이 상한(예: 160자)은 SEO 메타를 자르는 코드와 **같은 상수**를 쓴다 [이로하].
- **태그는 키(소문자 ASCII)로 쓴다.** 표시 이름(ko/en)은 Content Collections 데이터 컬렉션(`content/tags.*`)에 두고, 표에 없으면 키를 그대로 보여준다 [이로하].
- **`draft: true` 글은 프로덕션 빌드에서 모두 빠진다.** 목록, 상세, sitemap, RSS, llms, 프리렌더가 대상이다. dev 에서는 배지를 달고 보인다 [이로하].

**en frontmatter** [이로하]

```yaml
---
title: "..."
description: "..."
sourceHash: "<ko 원문 해시>"
translationStatus: machine   # machine | reviewed
---
```

- **`date`, `updated`, `tags`, `draft` 는 ko 원문에서 상속한다.** 번역본에 다시 쓰지 않는다.
- **`sourceHash` 는 ko 원문의 본문 + title + description 해시다** [이로하]. 날짜나 태그만 고쳤을 때는 낡음으로 보지 않는다.
- **낡은 번역본이 있으면 빌드가 실패한다** [은솔].
  - 낡은 번역본은 `sourceHash` 가 현재 원문 해시와 다른 것이다.
  - GitHub Actions 배포도 막힌다. 그래서 ko 원문의 본문, 제목, 설명을 고치면 push 전에 둘 중 하나를 해야 한다.
    - `/translate-post` 로 번역을 갱신한다.
    - 번역에 영향이 없는 수정(오타 등)이면 `pnpm content:rehash --post <slug>` 로 해시만 갱신한다.
  - 이 규칙은 AGENTS.md 에 넣는다.
- `translationStatus` 는 화면에 표시하지 않는다 [은솔: 번역 표시 안 함]. 작업 흐름(은솔 검토 여부)과 audit 에만 쓴다.
- **번역본 짝 맞추기는 Content Collections 가 경로로 직접 한다.** 별도 매니페스트 파일은 두지 않는다.

### 4.4 MDX 파이프라인

- **MDX 본문은 Vite 단계에서 실제 모듈로 컴파일한다.**
  - Content Collections 는 frontmatter 와 메타데이터만 맡는다(`parser: "frontmatter-only"`).
  - MDX 본문은 `@mdx-js/rollup` 이 컴파일하고, 컬렉션 `transform` 에서 그 모듈을 연결한다.
  - Content Collections 공식 샘플 `samples/tanstack-start-cf-mdx` 구성을 기준으로 하되, TanStack Start 1.169+ / Vite 8 에 맞춘다.
- **글별 동적 import 로 쪼갠다.** Lobby 가 전체 글 본문을 내려받으면 안 된다.
- remark/rehype 처리는 전부 빌드 시점에 한다.
  - GFM
  - 헤딩 id + 앵커 링크, TOC 데이터 추출 (h2~h3)
  - 코드 하이라이팅: rehype-pretty-code + shiki, 무채색 테마, 파일명·줄 강조 [은솔]
  - 글 옆 이미지(`![](./a.png)`)는 import 로 바꿔 Vite 가 해시된 에셋으로 처리하게 한다. width/height 를 넣고, 첫 이미지만 즉시 로드하고 나머지는 lazy 로 둔다.
- MDX 에서 import 없이 쓸 수 있는 컴포넌트 [은솔]
  - `<Callout type="note|tip|warn">`
  - `<Figure src alt caption>`
  - `a`: 내부 링크 현지화
    - 작성자는 `/posts/<slug>` 로 쓴다.
    - 영어 페이지에서 렌더할 때 대상 글에 영어 번역본이 있으면 `/en/posts/<slug>` 로 바꾸고, 없으면 한국어 글로 두고 `hreflang="ko"` 를 단다.
    - 외부 링크는 새 탭 + `rel="noopener"`.
- 산출물에 Shiki 런타임이 들어가면 안 된다.

### 4.5 다국어 (Paraglide JS)

**역할 분담**: 글은 Content Collections, UI 문자열·현재 언어·URL 현지화는 Paraglide.

**설정**

| 항목 | 값 |
|---|---|
| inlang 프로젝트 | `project.inlang/settings.json` |
| 언어 | baseLocale `ko`, locales `["ko", "en"]` [은솔] |
| 메시지 | `messages/ko.json`, `messages/en.json` |
| 컴파일 결과 | `src/paraglide/` (gitignore). 빌드와 타입 검사 전에 컴파일 |
| strategy | **`["url", "baseLocale"]`** |
| urlPatterns | ko 는 접두사 없음, en 은 `/en/...` 이 되도록 명시 |

- strategy 에 쿠키나 브라우저 언어를 넣지 않는다. 그래서 자동 리다이렉트가 생기지 않고, 프리렌더 결과도 URL 로만 정해진다 [은솔: 자동 리다이렉트 안 함].

**연결**

- 라우터에 `rewrite: { input: deLocalizeUrl, output: localizeUrl }` 를 넣는다.
- Worker 엔트리(`src/server.ts`)는 TanStack 핸들러를 `paraglideMiddleware` 로 감싼다. 같은 파일에 Cron 핸들러도 둔다 (4.8).
- `<html lang>` 은 `getLocale()` 에서 가져온다.
- 프리렌더 페이지 목록은 각 경로를 `localizeHref` 로 두 언어로 펼쳐 넣는다.

**언어별 노출**

- 영어 Posts/Lobby 에는 영어 번역본이 있는 글만 보인다 [은솔].
- 언어 전환 [이로하]
  - Post 에서는 상대 언어 번역본이 있을 때만 전환 링크를 보인다.
  - 다른 화면은 같은 화면의 상대 언어로 보낸다.
- hreflang 과 sitemap alternate 는 **실제로 있는 번역 쌍끼리만** 잇는다.
- 댓글과 조회수는 언어와 무관하게 slug 단위로 공유한다 [이로하]. 한 글에 대한 대화는 하나다.

**스파이크 탈출 규칙** [은솔]

스파이크(7)에서 다음 중 하나라도 막히면 이로하가 **직접 구현**으로 되돌리고 은솔에게 알린다.

- 프리렌더된 `/en/...` 이 rewrite 를 제대로 타는지
- Worker 에서 `getLocale()` 이 요청별로 맞는지
- hydration 이 일치하는지

직접 구현안은 이렇다.

- 타입 붙은 ko/en 사전 객체
- 경로 헬퍼 (`localizePath`, `getLocaleFromPath`)
- 라우터 `rewrite` + 현재 언어 컨텍스트

메시지는 JSON 키-값 그대로 옮긴다.

### 4.6 화면과 디자인

- **디자인 기조**: 무채색(흰색·회색·검정), SUIT, 라이트 모드만, lucide-react [은솔]. 브랜드 아이콘(GitHub 등)은 Simple Icons SVG 경로로 작은 컴포넌트를 만든다 [이로하].
- **공통 레이아웃** [이로하]
  - 헤더: 사이트 이름 `eunsol`, Posts 링크, 언어 전환
  - 푸터: 사이트 전체 조회수, RSS 링크, 소셜 링크(값이 없으면 숨김), "CC BY-NC 4.0" 라이선스 링크
- **Lobby**: 한 줄 소개 + 최근 글 5개 + "전체 글 보기" [은솔]. 한 줄 소개는 아직 정해지지 않아서 ko/en 각각 자리표시 문구를 넣는다 [은솔: 미정].
- **Posts**: 상단 태그 칩 필터 + 연도별 전체 목록 [은솔].
  - 필터는 `?tag=` 쿼리를 쓰고, 필터된 화면의 canonical 은 `/posts` 다 [이로하].
  - 프리렌더된 HTML 위에 필터가 적용될 때 목록이 번쩍이지 않게 처리한다.
- **Post**: 제목, 날짜(수정일), 태그, 조회수, TOC, 본문, 댓글. TOC 를 어디에 둘지는 빌더 재량.
- **404**: 해당 언어 레이아웃으로 완전한 문서와 상태 코드 404 를 낸다. `/없는글`, `/en/없는글`, `/fr/posts` 모두 해당한다.
- **글이 0편일 때**의 빈 상태 화면도 만든다 [이로하].
- 본문 폭, 타이포 스케일, 간격 같은 세부 디자인은 빌더 재량이다. 구현 중 스크린샷으로 은솔에게 보여준다.
- 코드 폰트는 시스템 monospace 스택 [이로하].

### 4.7 댓글

**입력과 표시**

- 입력: 작성자명(1~20자), 내용(1~1000자), 비밀번호(4~64자) [은솔 + 길이 제한은 이로하].
- 표시: 글 아래 오래된 순으로 [이로하].
  - 텍스트 그대로 보여주고(마크다운 없음) 줄바꿈만 유지한다.
  - 대댓글은 없다 [은솔].

**은솔 구분: Cloudflare Access** [은솔]

- **로그인 입구**
  - `nabichan.me/admin` 경로에 Access 애플리케이션을 건다.
  - 쿠키 경로 속성은 끈다(기본값). 그래서 로그인 뒤 `CF_Authorization` 쿠키가 사이트 전체 요청에 실린다.
  - SameSite 는 Lax 로 둔다 [이로하].
- **로그인 흐름**
  - 댓글 영역의 "글쓴이로 로그인" 링크가 `/admin?return=<현재 경로>` 로 보낸다.
  - Access 로그인 뒤 Worker 가 그 경로로 되돌린다. 같은 사이트 경로만 허용해서 open redirect 를 막는다.
  - 로그아웃은 `/cdn-cgi/access/logout` 이다.
- **검증**: Worker 가 API 요청의 `CF_Authorization` JWT 를 직접 검증한다.
  - 서명: `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` (JWKS 캐시)
  - `aud`(애플리케이션 AUD 태그), `iss`, `exp`
  - 이메일 클레임이 허용된 은솔 이메일과 같은지
  - 팀 도메인, AUD, 허용 이메일은 Worker 변수로 둔다.
- **화면 상태**: `GET /api/me` 가 `{ owner: boolean }` 을 돌려준다. 페이지가 프리렌더라서 브라우저가 물어본다.
- **은솔 댓글**
  - 비밀번호와 Turnstile 없이 작성하고, **"글쓴이" 배지**를 단다.
  - 은솔은 모든 댓글을 수정·삭제할 수 있다.
- **이름 예약**: 은솔이 아닌 사람은 `eunsol`, `nabi`, `은솔`, `나비`(대소문자·공백 무시)를 작성자명으로 쓸 수 없다 [이로하].
- **관리자 마스터 비밀번호(`ADMIN_PASSWORD`)는 없앤다** [이로하].
  - Access 세션이 관리자 역할을 대신한다.
  - 대입으로 뚫릴 수 있는 공용 관리자 비밀번호가 사라진다.
- **로컬 dev**: Access 가 없으니 `.dev.vars` 의 dev 전용 스위치로 은솔 상태를 흉내 낸다. 프로덕션 설정에는 절대 넣지 않는다.

**스팸과 대입 방어** [은솔: Turnstile + 시도 제한]

- **Turnstile**
  - 은솔이 아닌 사람의 작성·수정·삭제 모두에 Cloudflare Turnstile 토큰을 요구하고, 서버에서 siteverify 로 검증한다.
  - 위젯 스크립트는 댓글 영역이 화면에 들어올 때 불러온다 [이로하].
  - 로컬은 공식 테스트 키를 쓴다.
- **시도 제한**: 비밀번호 실패를 방문자(IP 해시)별로 제한한다(예: 10분에 5회). 넘으면 429 를 돌려준다.
  - 구현은 Workers Rate Limiting 바인딩이 플랜에서 쓸 수 있으면 그걸 쓰고, 안 되면 D1 테이블로 한다 (빌더 재량).
- **CSRF**: 쓰기 API 는 `Origin` 헤더가 사이트 origin 과 같을 때만 받는다 [이로하].

**비밀번호 저장** [이로하]

- 댓글마다 랜덤 솔트 + PBKDF2-SHA256 (WebCrypto) + 서버 시크릿 pepper(HMAC) 를 쓴다.
- pepper 가 있어서 DB 만 유출돼서는 오프라인 대입이 안 된다.
- 반복 횟수는 **무료 플랜 CPU 한도 안에서 실측해서** 정한다 (상한 100,000).
- 원본 IP 는 저장하지 않는다.

**API 와 응답**

- API: 목록(GET), 작성(POST), 수정(PATCH), 삭제(DELETE), `GET /api/me`. 서버 함수로 할지 서버 라우트로 할지는 빌더 재량.
- 응답 코드

| 상황 | 코드 |
|---|---|
| 검증 실패 | 400 |
| Turnstile 실패, 비밀번호 불일치, Origin 불일치, 예약 이름 | 403 |
| 없는 댓글 | 404 |
| 시도 초과 | 429 |
| D1 실패 | 503 |

- 삭제는 실제로 지운다 [이로하].

**스키마** (D1, wrangler SQL 마이그레이션)

```sql
comments(
  id            TEXT PRIMARY KEY,
  post_slug     TEXT NOT NULL,
  author        TEXT NOT NULL,
  body          TEXT NOT NULL,
  is_owner      INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,            -- 은솔 댓글은 NULL
  password_salt TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT,
  CHECK (is_owner = 1 OR (password_hash IS NOT NULL AND password_salt IS NOT NULL))
)  -- index on (post_slug, created_at)
```

### 4.8 조회수

**정의** [은솔]

- **글별 조회수**: 같은 방문자가 같은 글을 보면 KST 하루에 1회만 센다.
- **사이트 전체 조회수**: 모든 페이지 조회(PV)의 합이고, 중복을 거르지 않는다 [이로하: PV 의 일반적 단위]. 404 는 세지 않는다.

**세는 방법** [이로하, 참고 저장소 교훈]

- **브라우저가 `POST` 로 센다.** 프리렌더 페이지라 서버 렌더 시점에는 셀 수 없다. `GET` 으로 세면 프리페치나 미리보기 봇까지 센다.
- **클라이언트 라우트 이동마다 한 번 센다.** 증가 호출은 루트 한 곳에서만 해서 한 화면을 두 번 세지 않는다.
- **봇은 세지 않는다.** User-Agent 로 거른다. JS 를 실행하지 않는 크롤러는 원래 세어지지 않는다.

**방문자 식별**

- 그날의 솔트는 `HMAC(시크릿, KST 날짜)` 로 만든다.
- 방문자 키는 `hash(솔트 + IP + UA)` 다. 원본 IP 는 저장하지 않는다.
- 솔트가 매일 바뀌므로 날짜를 넘어 추적할 수 없다.

**저장** (D1, 원자적 증가)

```sql
post_views(slug TEXT PRIMARY KEY, count INTEGER NOT NULL)
site_views(id INTEGER PRIMARY KEY CHECK (id = 1), count INTEGER NOT NULL)
view_dedupe(day TEXT, slug TEXT, visitor TEXT, PRIMARY KEY (day, slug, visitor))
```

- `INSERT OR IGNORE` 로 중복을 판정하고, 새로 들어갔을 때만 `post_views` 를 `ON CONFLICT DO UPDATE SET count = count + 1` 로 올린다. 이 둘은 D1 batch 로 묶는다.
- **`view_dedupe` 는 계속 쌓이니까 Cron Trigger 로 하루 한 번 이틀 지난 행을 지운다.** 핸들러는 `src/server.ts` 에 둔다.

**응답과 표시**

- 증가 응답이 `{ site, post? }` 를 돌려주고, 화면은 그 값을 쓴다.
- **실패하면 503 을 돌려준다.** 0 을 보내면 "고장"과 "아직 아무도 안 옴"이 같아진다.
- **레이블은 프리렌더 HTML 에 미리 넣고, 숫자 자리만 비워 둔다.** "조회", "전체" 같은 레이블이 HTML 에 들어 있다.
  - 숫자 자리는 `tabular-nums` 와 최소 폭으로 잡는다.
  - 실패했거나 응답 전이면 `visibility` 로만 감춘다.
  - **목표는 CLS 0** 이다.
- 표시 위치: Post 에 글별 조회수, 푸터에 사이트 전체 [은솔: 기본안].

### 4.9 SEO / GEO

**사이트 정보** [은솔]: `src/site.ts` 한 곳에 모은다.

| 항목 | 값 |
|---|---|
| 이름 | `eunsol` |
| 도메인 | `https://nabichan.me` |
| 작성자 | `eunsol (Nabi)` |
| 한 줄 소개 | 미정 (자리표시) |
| 소셜 링크 | 미정 (비우면 숨김) |
| 라이선스 | CC BY-NC 4.0 |
| Google / 네이버 사이트 인증 메타 | 자리만 둔다 |

**페이지 메타** (TanStack Start 라우트 `head()`)

- title 템플릿 `%s | eunsol`. 글 페이지는 글 제목만 쓴다.
- description, canonical(절대 URL, 슬래시 없음).
- Open Graph: 글은 `og:type` article 에 published/modified time.
- Twitter: `summary_large_image`.
- hreflang: 실제 번역 쌍끼리만, 절대 URL 로. `x-default` 는 ko.
- 메타 길이를 넘는 값은 코드포인트 기준으로 자르고 `…` 을 붙인다. 상한은 zod 스키마와 같은 상수를 쓴다.

**구조화 데이터 (JSON-LD)**

- `@graph` 하나에 넣는다.
  - 공통: `WebSite`(`/#website`), `Person`(`/#person`)
  - 글: `BlogPosting` + `BreadcrumbList`
  - Posts: `CollectionPage` + `ItemList`
- 노드는 `@id` 로 서로 잇는다. `Person` 은 한 곳에서만 만든다.
- `BlogPosting` 필드
  - headline, description, datePublished, dateModified(`updated ?? date`)
  - author/publisher 는 `#person` 참조
  - image(OG), inLanguage, mainEntityOfPage, isPartOf(`#website`)
  - keywords(태그), wordCount
  - `license` (CC BY-NC 4.0 URL)
- `<` 는 `<` 로 이스케이프한다.

**크롤링·피드**

- **`sitemap.xml`**
  - 글, Lobby, Posts 를 넣고, 번역 쌍에는 `xhtml:link` alternate 를 단다.
  - `lastmod` 는 `updated ?? date`. 가짜 날짜를 넣지 않는다.
  - draft 는 빼고, priority/changefreq 는 쓰지 않는다.
- **`robots.txt`**
  - 전부 허용한다. AI 검색·사용자 요청·학습 크롤러(GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot 등)는 명시적으로 허용한다.
  - `/api/`, `/admin` 은 막는다 [이로하].
  - 맨 아래에 sitemap 줄을 둔다.
- **RSS**: 언어별로 둔다(`/rss.xml`, `/en/rss.xml`) [이로하].
  - 제목, 요약, 링크, 날짜, `<copyright>` 만 넣는다.
  - 전문은 `.md` 원문과 `llms-full.txt` 로 제공한다.

**GEO**

- `llms.txt`(언어별): 사이트 설명, 작성자, 라이선스, 주요 링크(RSS, sitemap), 글 목록(제목 + 설명).
- `llms-full.txt`: 공개 글 전체 원문.
- 글별 원문 `/posts/<slug>.md` 와 `<link rel="alternate" type="text/markdown">`. 원문은 MDX 소스에서 import/export 줄만 걷어낸다.
- **배포 때 Cloudflare 설정을 확인한다.** AI 봇 차단(AI Crawl Control)과 managed robots.txt 가 꺼져 있어야 한다.

**OG 이미지**

- **빌드할 때** 글 × 언어별 PNG(1200×630)와 사이트 기본 이미지를 만든다.
  - Node 에서 Satori + resvg 를 쓴다.
  - 폰트는 TTF/WOFF 를 쓴다(woff2 아님).
- 디자인은 무채색 타이포 카드다.
  - 제목 폭으로 글자 크기를 정한다(한글은 전각, 라틴은 반각으로 어림).
  - 줄바꿈은 `keep-all`.
- URL 은 고정이고 리다이렉트되지 않는다.

**IndexNow** [이로하]

- `pnpm indexnow` 스크립트가 바뀐 글 URL 만 Bing 등에 알린다. `--all` 을 주면 전부 보낸다.
- **기본은 미리보기만 한다.** 실제 전송은 `--submit` 을 줄 때만 하고, draft·noindex 는 보내지 않는다.
- GitHub Actions 배포가 성공하면 그 push 에서 바뀐 글만 `--submit` 으로 보낸다.
- 키 파일은 `public/` 에 공개로 둔다(프로토콜상 비밀이 아니다).
- Google 은 이 프로토콜을 쓰지 않는다. 네이버가 받는지는 구현 때 확인한다.

### 4.10 폰트

- **SUIT Variable 하나만** 본문과 제목에 쓴다 [은솔]. 위계는 크기와 굵기로 준다.
- **글자 범위(unicode-range)별 조각으로 나눈다** [은솔].
  - 구글 폰트의 한국어 분할 방식처럼, 페이지에 쓰인 글자의 조각만 내려받는다.
  - 조각은 fonttools(pyftsubset) 스크립트로 한 번 만들고, 결과(woff2 조각들 + CSS)를 저장소에 커밋한다 [이로하]. 빌드와 CI 에 Python 이 필요 없게 하려는 것이다. 업스트림 버전을 올릴 때만 다시 돌린다.
  - RFN 때문에 조각 파일의 내부 폰트 이름을 바꾼다. `public/fonts/` 에 OFL 전문과 원저작자 표기를 둔다.
  - `font-display: swap`. 가장 자주 쓰는 조각(라틴 + 기본 한글)은 preload 한다.
- **폰트는 self-host 한다.** 첫 렌더를 막는 요청이 다른 origin 에 걸리지 않게 하기 위해서다.

### 4.11 인프라와 배포

**`wrangler.jsonc`** (이름 `eunsol-blog` [이로하])

| 키 | 값 |
|---|---|
| `main` | 커스텀 엔트리 `src/server.ts` (paraglide 미들웨어 + fetch + scheduled) |
| `compatibility_date` / flags | 오늘, `nodejs_compat` |
| `observability.enabled` | `true` |
| D1 | 바인딩 `DB`, `migrations_dir: migrations` |
| Cron | 트리거 1개 |
| 도메인 | `nabichan.me`. `www.nabichan.me` 는 apex 로 리다이렉트 [이로하] |
| 변수 | Turnstile 사이트 키, Access 팀 도메인·AUD·허용 이메일 (전부 공개 값) |

- **시크릿**: `TURNSTILE_SECRET_KEY`, `COMMENT_PEPPER`, `VIEW_SALT_SECRET`
- **로컬**
  - `.dev.vars` 에 테스트 키와 dev 전용 은솔 스위치를 둔다.
  - 마이그레이션은 `wrangler d1 migrations apply --local` 로 적용한다.
  - vite dev 와 wrangler 가 같은 `.wrangler/state` 를 쓴다.
- **타입**
  - `wrangler types` 로 `worker-configuration.d.ts` 를 만든다.
  - 바인딩은 `import { env } from 'cloudflare:workers'` 로 읽고, 모듈 최상단에서는 읽지 않는다.
- **D1 은 ORM 없이 wrangler SQL 마이그레이션만 쓴다** [이로하].
  - 마이그레이션은 **추가만 하는 방향**으로 쓴다. CI 가 마이그레이션을 먼저 적용하고 배포하기 때문에, 그 사이에는 이전 코드가 새 스키마 위에서 돈다.

**GitHub Actions 자동 배포** [은솔]

`.github/workflows/deploy.yml` 이 담당한다. 저장소는 `nabi-chan/blog`(public)다.

- **트리거**: main push, 수동 실행. 동시 배포는 `concurrency` 로 막는다.
- **단계**
  1. checkout. 바뀐 글을 판정할 수 있게 이전 커밋까지 받는다.
  2. Node 26, pnpm 12 설치. `pnpm install --frozen-lockfile`
  3. `pnpm audit:repo --build` (게이트. 낡은 번역본도 여기서 막힌다)
  4. `wrangler d1 migrations apply DB --remote`
  5. `wrangler deploy`
  6. 배포 스모크 확인: 주요 경로 200, 배포된 CSS 존재
  7. 바뀐 글 IndexNow 전송
- **GitHub 시크릿**: `CLOUDFLARE_API_TOKEN`(Workers·D1 최소 권한), `CLOUDFLARE_ACCOUNT_ID`.
  - 토큰은 은솔이 Cloudflare 대시보드에서 만든다.
  - 등록은 은솔이 직접 한다(`! gh secret set CLOUDFLARE_API_TOKEN`).

**첫 배포** (이로하가 실행) [은솔]

1. `wrangler whoami` 로 로그인과 플랜을 확인한다.
2. `nabichan.me` zone 을 확인한다.
3. D1 을 만들고 원격 마이그레이션을 적용한다.
4. Turnstile 위젯을 만든다. API 권한이 없으면 대시보드 작업을 은솔에게 부탁한다.
5. Cloudflare Access 를 설정한다. Zero Trust 팀, `/admin` 애플리케이션, 정책을 만든다. **[배포 때]** 로그인 방식(이메일 OTP / GitHub 등)과 허용 이메일은 은솔에게 묻는다.
6. 시크릿을 등록하고 배포한다.
7. AI 봇 차단 설정을 확인한다.
8. 배포된 산출물로 스모크 확인을 한다 (6).
9. **검증용으로 원격 D1 에 남긴 댓글과 조회수를 지우고 0 으로 되돌린다** [은솔].
10. GitHub 시크릿을 준비하고 Actions 로 넘어간다.

**`nabi.kim` 리다이렉트** [은솔]

- `nabi.kim`, `www.nabi.kim` 의 웹 요청을 `https://nabichan.me/` 로 301 보낸다.
  - 방법은 Cloudflare Single Redirect 규칙이다.
  - 예전 경로는 새 사이트에 없으니 경로는 버리고 루트로 보낸다 [이로하].
- **메일 레코드(MX, SPF/DKIM 등 TXT)는 건드리지 않는다.** `hello@nabi.kim` 메일이 같은 zone 을 쓴다.
- 작업 전에 레코드를 백업 목록으로 남기고, 바꾼 것만 보고한다.

**샘플 글** [은솔: 공개]

- ko + en 샘플 글 하나를 공개한다. MDX 기능(하이라이팅, Callout, Figure + 글 옆 이미지, TOC, 내부 링크)을 모두 써 보는 글이다.
- 주제는 "이 블로그를 어떻게 만들었나"로 한다 [이로하]. 은솔 문체 가이드로 쓰고, 번역은 translate-post 흐름으로 만든다.
- **은솔 이름으로 나가는 글이니, 첫 배포 전에 은솔이 내용을 확인한다.**

### 4.12 관측과 에러 처리

- Workers Logs(observability)를 켠다. 댓글·조회수·Access 검증 API 의 catch 지점마다 원인을 로그로 남긴다 [이로하].
- **실패를 200 + 빈 값으로 덮지 않는다.**
- 외부 에러 모니터링 SDK 는 붙이지 않는다 (비목표).

## 5. 에이전트 작업 도구

### 5.1 AGENTS.md

저장소 루트에 둔다. `CLAUDE.md` 는 이 파일을 가리킨다(심볼릭 링크 또는 `@AGENTS.md`) [이로하]. 다음을 넣는다.

- 검증 순서와 명령 (`pnpm check` 등)
- **개발 서버가 떠 있을 때 빌드를 돌리지 않는다.** 빌드는 병렬 작업 전에 혼자 한 번만 돌린다. `.content-collections`, `src/paraglide`, `dist` 를 서로 덮어쓴다.
- **ko 원문의 본문·제목·설명을 고치면 push 전에 처리한다.** `/translate-post` 또는 `pnpm content:rehash` 중 하나를 하지 않으면 배포가 막힌다.
- 마이그레이션은 추가만 하는 방향으로 쓰고, 이미 커밋한 마이그레이션은 고치지 않는다.
- MDX 파이프라인, i18n, Access 검증을 수정할 때 주의할 점 (이 문서 요약)
- 새 수제 CSS 는 큰 전역 파일 꼬리에 붙이지 않고 `src/styles/` 의 별도 파일에 둔다. 배포 확인은 배포된 CSS 파일을 직접 본다.

### 5.2 Claude 커맨드 (`.claude/commands/`)

모두 한국어로 새로 쓴다. jihoon-blog 는 구조만 참고한다.

**`/write-post <초안>`**

1. 초안을 읽고 주제와 논지를 잡는다.
2. 현재 시점 기준으로 사실관계와 최신성을 웹에서 확인한다.
3. **은솔 문체 가이드**(5.3)대로 `content/posts/<slug>/index.ko.mdx` 를 쓴다. 이미지는 글 옆에 두고, frontmatter 는 스키마대로 쓴다.
4. 체크리스트를 점검한다.
   - SEO: 제목·설명 길이, 첫 문단에 대상 독자와 얻을 것
   - 사람과 AI 가 신뢰하기 쉬운 글: 1차 경험, 근거, 재현 조건, 1차 출처
   - AI 문체 신호 걷어내기
   - 맞춤법 교정 규칙 (5.3)
5. 콘텐츠 검사를 돌린다.
6. 번역은 `/translate-post` 로 넘긴다.

**`/refine-post <경로>`**

- 기존 글을 체크리스트로 다듬는다. 구조, 문체, 맞춤법, 사실·최신성, SEO, 시각 자료, 참고 자료를 본다.
- `updated` 는 의미 있는 수정일 때만 올린다.
- 영어 번역본이 있으면 다음을 안내한다.
  - 번역에 영향이 있는 수정이면 `/translate-post` 가 필요하다.
  - 영향이 없으면 `content:rehash` 로 충분하다.
  - 둘 중 하나를 하지 않으면 빌드가 실패한다.

**`/translate-post <slug>`**

0. 원문 해시로 새 번역인지, 낡은 번역 갱신인지 판정한다. 갱신이면 번역본을 마지막으로 바꾼 커밋 이후의 ko diff 를 뽑아 바뀐 문단만 다시 번역한다.
1. 용어집, 원문, 기존 en 을 읽는다.
2. 1차 번역을 하고 frontmatter 를 현지화한다. `sourceHash` 를 넣고, `translationStatus: machine` 으로 둔다.
3. 구조 검사가 통과할 때까지 맞춘다.
   - 검사 대상: 헤딩 레벨, 링크 목적지, 이미지, JSX 컴포넌트와 props, 코드 블록의 **개수와 언어**
   - **코드 블록 안 주석은 영어로 번역해도 된다** [은솔]. 코드 자체가 바뀌지 않았는지는 2차 리뷰가 본다.
4. 2차 리뷰를 한다.
   - 새 컨텍스트의 서브에이전트가 원문과 대조해 지적만 하고, 수정은 메인이 한다.
   - 보는 것: 누락, 확신 정도의 변화, 수치·인과, 용어, 자연스러움, 검색 의도, 코드 변경 여부
5. 은솔이 확인한 뒤에만 `reviewed` 로 바꾼다. 커밋은 자동으로 하지 않는다.

- 헬퍼 `pnpm content:rehash --post <slug>`: 번역에 영향 없는 원문 수정 뒤 해시만 갱신한다.
- 용어집: 키는 고정하고 ko/en 라벨을 둔다. Content Collections 데이터 컬렉션 + zod 로 두 언어 다 필수로 한다.

**`/audit`**

0. `pnpm audit:repo --build [--live]` 를 **혼자 직렬로** 먼저 돌린다.
1. 읽기 전용 레인 4개를 병렬로 띄운다.
   - 레인: 라우트/i18n, SEO(프로덕션 curl), 런타임/데이터(D1 스키마·쿼리, Access 검증, 오류 경로), 콘텐츠/번역
   - 공통 규칙: 빌드·dev 금지, 파일 수정 금지, AGENTS.md 먼저 읽기
   - 출력: 위치, 실패 시나리오, 심각도, CONFIRMED/SUSPECTED
2. 보고를 직접 검증한 뒤 고치고, `audit:repo` 를 다시 돌린다.
3. 고친 것과 안 고친 것을 이유와 함께 남긴다. 예산 상수와 문서의 수치를 같이 갱신한다.

**`scripts/audit.mjs` (`pnpm audit:repo`)**

결과는 PASS / WARN / FAIL / INFO 로 남기고 `.audit-report.json` 에 쓴다. FAIL 이 있으면 exit 1.

- **기본**
  - typecheck: FAIL
  - test: FAIL
  - lint: WARN (도구를 둘 경우)
  - 콘텐츠 스키마: FAIL
  - 번역: en 없음 INFO / **낡음 FAIL** / 구조 불일치 FAIL / machine INFO
  - Paraglide 메시지 ko·en 키 완전성: FAIL
  - `wrangler types` 결과와 커밋된 타입의 diff: FAIL
  - 로컬 D1 미적용 마이그레이션: FAIL
  - 이미 커밋된 마이그레이션 파일 수정: FAIL
- **`--build`**
  - 클린 빌드
  - 클라이언트 JS gzip 예산
  - Worker 크기 (무료 플랜 3MB 대비)
  - 모든 글이 한 청크에 실렸는지
- **`--live`**
  - 주요 경로 200 과 TTFB (5회 중앙값 + `cf-cache-status`)
  - 보안 헤더
  - sitemap 에 draft 유출
  - 번역 없는 `/en/posts/<slug>` 가 404 인지
  - 리다이렉트되는 메타 URL
  - 원격 D1 미적용 마이그레이션
  - API 헬스
  - `nabi.kim` 리다이렉트

### 5.3 은솔 문체 가이드 (커맨드에 넣을 내용의 근거)

예전 글 12편(약 1만 자)을 분석한 결과다. 현재 형식으로 쓴 글은 3편뿐이라 일부는 추정이다.

**문체와 어조**

- 기술·정보 글은 합니다체로 쓴다. 독자에게 말을 걸거나 괄호로 덧붙일 때는 해요체로 한 단계 내린다. 예: "(색상은 서로 다른 것을 추천드려요)"
- 1인칭은 "저/제"다. 속마음은 따옴표 안에 반말 독백으로 쓴다.
- 기술 글에도 소감이나 동기를 한 줄은 넣는다.
- 유머는 짧은 반전, 말줄임, 가벼운 감탄사로 낸다. 이모티콘은 기술 본문에 쓰지 않는다(추정).

**구조**

- 기술 글은 인사 없이 `## X?` 정의 섹션으로 시작하고, 첫 문장은 "X는 ~입니다."로 쓴다.
- 절차 소제목은 `~하기` 명사형이다. 제품명은 원어 그대로 쓰고, 본문 소제목은 `##` 부터 시작한다.
- 문장은 대부분 60자 이내, 문단은 1~3문장이다. 강조할 한 문장은 따로 뗀다.
- 결론
  - 에세이형: `## 글을 마치며` → 요약 → 의견 → 제안 질문 → `### See Also...`
  - 튜토리얼: 마지막 단계에서 끝내도 된다.

**표기**

- 기술 용어는 제품명이면 원어, 일반 개념이면 음차로 쓴다. 명령어와 API 만 인라인 코드로 쓴다.
- 코드 블록에는 언어 태그를 붙이고, 블록 앞에 목적을 한 문장으로 쓴다. 주석과 예시 값은 한국어로 쓴다(영어판에서는 번역).
- 리스트를 적극적으로 쓴다. UI 경로는 `[A] -> [B]` 로 쓴다.

**맞춤법은 표준으로 교정한다** [은솔]

- 교정하는 것
  - `이였` → `이었`
  - 의존명사 띄어 쓰기: `할수` → `할 수`, `하는것` → `하는 것`, `하는김에` → `하는 김에`
  - 명사+하다 붙여 쓰기: `시작 해줍니다` → `시작해 줍니다`
  - 영문·코드 뒤 조사 붙이기: `oMLX 를` → `oMLX를`
  - 명백한 오타
- 유지하는 것
  - 개발자 관용 외래어: 레포지토리, 어플리케이션 등
  - 일부러 귀엽게 쓴 표기: 와자뵤, 연락처루 등

**기타**

- 개인정보가 들어 있는 about/cv 원문은 커맨드 예문에 쓰지 않는다.
- jihoon-blog 고유의 조판 규칙(em dash·이탤릭·낫표 금지)은 은솔 문체에 근거가 없어서 가져오지 않는다 [이로하]. 대신 AI 문체 신호를 걷어내는 점검은 넣는다.

## 6. 완료 조건 (검증)

**로컬**

- **렌더링**: `pnpm dev` 와 프로덕션 빌드 + preview(workerd)에서 세 화면 × 두 언어가 렌더된다. 글이 0편일 때 빈 상태 화면도 확인한다.
- **404**: 세 경우와 `/posts/%E0` 가 모두 완전한 404 문서를 낸다.
- **MDX**
  - 하이라이팅, Callout, Figure, TOC, 글 옆 이미지(크기 속성 포함), 내부 링크 현지화가 동작한다.
  - Worker 번들에 `new Function`/`eval` 경로가 없다.
- **다국어**
  - 영어 목록에는 번역본 있는 글만 보이고, hreflang 은 실제 쌍만 가리킨다.
  - 원문을 고친 뒤 rehash 를 하지 않으면 빌드가 실패한다.
- **댓글**
  - 테스트 Turnstile 키로 작성, 수정, 삭제가 된다.
  - 틀린 비밀번호는 403 이고, 반복하면 429 가 난다.
  - 예약 이름은 거절된다.
  - Origin 이 다른 요청은 거절된다.
  - DB 에 평문 비밀번호가 없다.
  - dev 은솔 스위치로 배지 작성과 남의 댓글 삭제가 된다.
- **Access JWT 검증**: 서명, aud, 만료, 이메일이 하나라도 틀리면 은솔로 인정되지 않는다. 단위 테스트로 확인한다.
- **조회수**
  - 같은 방문자가 새로고침해도 글별 수는 하루 1회만 오른다.
  - 사이트 PV 는 페이지 이동마다 오른다.
  - D1 이 끊기면 503 이 나고, 화면 높이는 변하지 않는다.
- **SEO 산출물**
  - sitemap, robots, RSS, llms.txt, llms-full.txt, `.md` 원문, OG 이미지가 빌드 산출물에 있다.
  - 메타에 실린 URL 이 전부 200 이다.
- **성능**
  - 한국어 글 페이지에서 받는 폰트 조각과 총 용량을 기록한다.
  - Lobby 가 다른 글 본문 청크를 내려받지 않는다.
- `pnpm audit:repo` 가 FAIL 없이 끝난다.

**배포 후**

- `https://nabichan.me`, `/en`, 샘플 글이 200 이다. 배포된 CSS 와 HTML 을 직접 받아서 확인한다.
- 원격 D1 에서 댓글·조회수가 동작한다. 확인용 데이터는 지운다.
- 실제 Access 로그인으로 은솔 배지 작성과 로그아웃이 된다.
- `nabi.kim` 이 `nabichan.me` 로 301 되고, 메일 레코드는 그대로다.
- AI 봇 차단 설정을 확인한다.
- `pnpm audit:repo --live` 가 FAIL 없이 끝난다.
- 이후 main push 한 번으로 GitHub Actions 배포가 성공한다.

## 7. 구현 순서 권장 (위험한 것부터)

1. **통합 스파이크**: 다음을 엮어 글 하나와 ko/en Lobby 를 띄운다.
   - TanStack Start + Cloudflare vite plugin
   - Paraglide(rewrite, 미들웨어)
   - `@mdx-js/rollup`
   - 프리렌더 + workerd preview

   다음 항목을 확인한다.
   - 프리렌더된 `/en/...` 이 rewrite 를 제대로 타는지
   - Worker 에서 요청별 `getLocale()` 이 맞는지
   - hydration 이 일치하는지
   - 프리렌더 중 eval 이 없는지
   - trailing slash 리다이렉트가 없는지

   Paraglide 부분이 막히면 4.5 탈출 규칙대로 직접 구현으로 되돌리고 은솔에게 알린다. 그 밖의 부분이 막히면 은솔과 방향을 다시 잡는다.
2. 콘텐츠 모델, MDX 컴포넌트, 화면 세 개, 디자인, 폰트
3. 다국어 마감: 번역 쌍, 링크 현지화, hreflang, 해시 검사
4. D1, 조회수, 댓글, Turnstile, 시도 제한, Access 검증, Cron
5. SEO/GEO 산출물, OG 이미지, IndexNow
6. 샘플 글(ko/en), AGENTS.md, 커맨드 4개, `audit:repo`
7. 첫 배포, nabi.kim 리다이렉트, 배포 후 검증, GitHub Actions 전환

## 8. 빌더 재량

- 세부 비주얼: 타이포 스케일, 간격, 컴포넌트 모양, TOC 배치, OG 카드 디자인, shiki 테마. 무채색, SUIT, 라이트 모드, lucide 범위 안에서 정한다.
- 파일·폴더 구조, 작은 라이브러리 선택(rehype-slug 류, JWT 검증), 테스트 도구, lint 도구를 둘지 말지
- API 를 서버 함수로 둘지 서버 라우트로 둘지
- 산출물 생성 방식: 서버 라우트 + 프리렌더 또는 빌드 스크립트
- 실측값과 구현 방식: 폰트 조각 경계, PBKDF2 반복 횟수, 시도 제한 구현과 수치, Cron 시각

## 9. 이로하가 정한 것 (승인할 때 같이 확인해 줘)

- **관리자 마스터 비밀번호를 없애고 Cloudflare Access 세션으로 관리자 역할을 대신한다.** 은솔 배지 답변을 받으면서 생긴 변경이라, 원래 기본안과 다르다.
- 은솔이 아닌 사람은 은솔 이름(eunsol, nabi, 은솔, 나비)을 쓸 수 없다. 쓰기 API 는 Origin 헤더를 검사하고, Access 쿠키는 SameSite=Lax 로 둔다.
- 구조와 URL
  - 프리렌더 + 브라우저가 부르는 API 구조
  - 정규 URL 은 슬래시 없음
  - `www.nabichan.me` 는 apex 로 리다이렉트
- 콘텐츠 모델
  - slug 는 kebab-case 폴더 이름이고, 날짜는 frontmatter 에만 둔다(KST)
  - 태그는 키 + 표시 이름 데이터 컬렉션
  - en 번역본은 title/description 만 갖고 나머지는 상속한다. 해시 범위는 본문 + title + description, 매니페스트는 없다
- 댓글과 조회수
  - 언어와 무관하게 slug 단위로 공유
  - 댓글 길이 제한, 실제 삭제, Turnstile 지연 로드, PBKDF2 + pepper
  - 사이트 PV 는 중복을 거르지 않음
- 피드와 크롤링
  - RSS 는 요약만 담고, 전문은 `.md` 와 `llms-full.txt` 로 제공
  - robots 에서 `/api/`, `/admin` 차단
  - IndexNow 는 미리보기가 기본이고, CI 에서만 바뀐 글을 실제로 전송
- 폰트: SUIT 조각은 스크립트로 한 번 만들어 커밋하고, 내부 폰트 이름을 바꾼다. 코드 폰트는 시스템 monospace
- 인프라
  - D1 은 ORM 없이 wrangler SQL, 마이그레이션은 추가만
  - Worker 이름 `eunsol-blog`, 무료 플랜 기준 설계
- `nabi.kim` 리다이렉트는 경로를 버리고 루트로 보낸다
- 샘플 글 주제는 "이 블로그를 어떻게 만들었나"이고, 첫 배포 전에 은솔이 확인한다
- 글이 0편일 때의 빈 상태 화면
- jihoon 조판 규칙은 가져오지 않음

## 10. 배포 때 물어볼 것

- Cloudflare Access 로그인 방식(이메일 OTP / GitHub 등)과 허용할 이메일
- Cloudflare API 토큰 생성과 GitHub 시크릿 등록 (은솔이 직접)
- Turnstile 위젯 생성 권한이 없을 때의 대시보드 작업
- Lobby 한 줄 소개와 소셜 링크 (정해지면 언제든 `src/site.ts` 와 메시지에 반영)
