---
title: "이 블로그를 어떻게 만들었나"
description: "TanStack Start와 Cloudflare Workers로 만든 이 블로그의 구성을 정리합니다. 글을 빌드할 때 만드는 방식, 댓글과 조회수, 두 언어 지원, 검색·AI용 파일까지 다룹니다."
date: "2026-10-20 12:00"
tags: ["meta", "cloudflare"]
---

## 이 블로그는?

이 블로그는 TanStack Start로 만들고 Cloudflare Workers에서 서빙하는 개인 블로그입니다.
글은 한국어로 쓰고, 영어 번역이 있는 글은 `/en` 아래에서도 읽을 수 있습니다.
글마다 댓글과 조회수가 있습니다.

예전 Next.js + Supabase 버전은 모두 비우고 처음부터 다시 만들었습니다.
이 글에는 무엇을 골랐고 어떻게 엮었는지를 적었습니다.

> [!TIP]
> 전체 그림부터 보고 싶다면 [구성](/261020#구성)으로 바로 가세요.

## 구성

![이 블로그의 구성도](./diagram.svg "글은 빌드할 때 정적 파일로 만들고, 댓글·조회수는 Worker와 D1이 처리합니다")

글과 화면은 빌드할 때 정적 파일로 만들어 둡니다.
주소를 처음 열면 이 파일이 그대로 나갑니다.
Worker는 그 밖의 일을 맡습니다.

- 댓글·조회수 API
- 사이트 안에서 페이지를 옮길 때 쓰는 글 데이터
- 없는 주소의 404 페이지
- 하루 한 번 도는 기록 정리(Cron)

| 역할 | 고른 것 |
|---|---|
| 프레임워크 | TanStack Start |
| 배포 | Cloudflare Workers |
| 글 | Markdown + Content Collections |
| 데이터 | Cloudflare D1 |
| 다국어 | Paraglide JS |
| 스타일 | Tailwind CSS |
| 폰트 | SUIT |

처음에는 MDX를 쓰려고 했습니다.
글 안에 React 컴포넌트를 넣을 계획이 없어서 일반 Markdown으로 바꿨습니다.
다국어 도구는 Intlayer, 직접 구현과 비교한 뒤 Paraglide JS로 정했습니다.

## 글은 빌드할 때 HTML로 만듭니다

글 페이지와 목록 페이지는 :term[프리렌더]{key="prerender"}해 둡니다.
Cloudflare Workers는 `eval`과 `new Function`을 막습니다.
무료 플랜은 요청 하나에 CPU 시간을 10ms까지만 줍니다.
그래서 Markdown을 요청마다 해석하지 않고, 빌드할 때 HTML로 만들어 둡니다.

글 하나는 폴더 하나입니다.
폴더 이름이 곧 주소이고, 형식은 `YYMMDD`입니다.
글 머리에는 이런 정보를 적습니다.

```yaml
---
title: "이 블로그를 어떻게 만들었나"
description: "검색 결과에 보일 설명 (160자 이하)"
date: "2026-10-20 12:00"   # 한국 시간
tags: ["meta"]
---
```

:::details
빌드할 때 하는 일

- 폴더 이름(`YYMMDD`)이 날짜와 같은지, 같은 날짜 글이 둘인지 확인합니다.
- 본문을 HTML로 만들고 코드 블록에 색을 입힙니다.
- 글 옆 이미지를 해시 이름으로 복사하고 WebP 사본을 만듭니다.
- 영어 번역이 원문과 맞는지 확인합니다.
- 공유할 때 보일 OG 이미지를 그립니다.
:::

![글 목록 화면](./posts.png "글 목록. 위쪽 태그로 글을 거를 수 있습니다")

글 데이터는 서버에만 있습니다.
브라우저가 받는 JavaScript에는 글 본문이 들어가지 않습니다.
그 JavaScript는 지금 gzip으로 128.9KB입니다.

폰트는 SUIT 하나만 씁니다.
글자 범위별로 94개 조각으로 나눠 두고, 페이지에 쓰인 글자의 조각만 받습니다.

![좁은 화면에서 본 이 글](./mobile.png?w=360 "390px 폭에서 본 이 글")

## 댓글과 조회수

댓글은 누구나 이름, 내용, 비밀번호로 남길 수 있습니다.
비밀번호는 댓글을 고치거나 지울 때 씁니다.

- 비밀번호는 평문으로 저장하지 않습니다. 솔트와 PBKDF2, 서버만 아는 값(pepper)을 함께 씁니다.
- 스팸은 Cloudflare Turnstile로 막습니다.
- 비밀번호를 10분 안에 다섯 번 틀리면 잠시 더 시도할 수 없습니다.
- 글쓴이는 Cloudflare Access로 로그인해서 구분하고, 댓글에 배지가 붙습니다.

조회수는 같은 사람을 하루에 한 번만 셉니다.
새로고침해도 숫자는 오르지 않습니다.
방문자는 그날만 쓰는 솔트와 IP, 브라우저 정보를 해시해서 구분하고, 원본 IP는 저장하지 않습니다.

페이지는 미리 만들어 둔 것이라 숫자와 댓글은 브라우저가 API로 받아서 채웁니다.
:term[하이드레이션]{key="hydration"}이 끝나면 요청을 보내고, 기다리는 동안 숫자 자리에는 회색 상자를 보여 줍니다.

## 두 언어로 씁니다

한국어가 기본이고, 영어 번역은 `/en` 아래에 둡니다.
지금 쓰는 언어 쌍은 ko:en 하나입니다.
번역이 없는 글은 영어 목록에 보이지 않습니다.

영어 번역본은 원문의 해시를 기록해 둡니다.
원문의 본문이나 제목을 고치고 번역을 갱신하지 않으면 빌드가 실패합니다.
낡은 번역이 조용히 남지 않게 하려는 장치입니다.

## 검색과 AI를 위한 파일

빌드할 때 이런 파일도 함께 만듭니다.

- `sitemap.xml`, `robots.txt`: robots는 AI 크롤러를 이름으로 허용합니다.
- RSS: 언어별로 두고 본문 전체를 담습니다.
- `llms.txt`, `llms-full.txt`: AI가 읽기 좋은 글 목록과 전체 원문입니다.
- 글마다 Markdown 원문: 글 주소 뒤에 `.md`를 붙이면 됩니다.
- OG 이미지: 공유할 때 보이는 카드를 글마다 그립니다.

## 본문에 쓸 수 있는 것들

원문과 번역을 함께 보여 주는 인용도 됩니다.
Edsger W. Dijkstra가 EWD498에 남긴 문장입니다.

::::quote
:::translation
단순함은 신뢰성의 전제 조건이다.
:::
:::original
Simplicity is prerequisite for reliability.
:::
::::

MDX처럼 글 안에 컴포넌트 코드를 쓰지는 않지만, 위젯을 둘 자리는 표시할 수 있습니다.
그 자리에 미리 만들어 둔 위젯을 브라우저가 붙입니다.
아래 버튼을 눌러 보세요.

:::widget-counter-demo
위젯을 쓸 수 없는 환경에서는 이 문장이 보입니다.
:::

## 글을 마치며

이 블로그는 글과 화면을 빌드할 때 만들어 두고, 댓글과 조회수는 Worker와 D1이 처리합니다.
글은 Markdown으로 쓰고, 영어 번역이 원문과 어긋나면 빌드가 멈춥니다.
아직 소개글과 소셜 링크는 정하지 않았습니다.

이 구성에서 더 궁금한 부분이 있다면 댓글로 알려 주세요.

:::see-also
- [docs] [TanStack Start](https://tanstack.com/start)
- [docs] [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [repo] [Content Collections](https://github.com/sdorra/content-collections)
- [docs] [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
:::
