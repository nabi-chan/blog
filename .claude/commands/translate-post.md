---
description: 한국어 글을 영어로 번역하거나 낡은 번역을 갱신한다
argument-hint: <slug>
---

# /translate-post

`content/posts/$ARGUMENTS/index.ko.md` 를 영어로 번역해 `index.en.md` 를 만들거나 갱신한다.

시작하기 전에 `AGENTS.md` 를 읽는다. **커밋하지 않는다.**

## 0. 새 번역인지 갱신인지 판정하기

- `index.en.md` 가 없으면 **새 번역**이다.
- 있으면 `pnpm content:check --post <slug> --no-build` 를 돌린다. "en 번역이 낡았습니다" 가 나오면 **갱신**이다.
- 갱신이면 번역본을 마지막으로 바꾼 커밋 이후의 ko 변경만 다시 번역한다.

  ```sh
  git log -1 --format=%H -- content/posts/<slug>/index.en.md
  git diff <그 커밋> -- content/posts/<slug>/index.ko.md
  ```

## 1. 읽기

- `content/glossary.yaml`: 용어는 en 이름으로 통일한다.
- ko 원문과 기존 en 을 읽는다.

## 2. 1차 번역하기

- frontmatter 는 `title`, `description`, `sourceHash`, `translationStatus` 만 둔다. `date`, `updated`, `tags`, `draft` 는 ko 에서 상속하므로 쓰지 않는다.

  ```yaml
  ---
  title: "..."
  description: "... (160자 이하)"
  sourceHash: "<아래 명령으로 넣는다>"
  translationStatus: machine
  ---
  ```

- `description` 과 제목은 영어 검색 의도에 맞게 현지화한다. 직역하지 않는다.
- 그림 안에 한국어 글자가 있으면 영어판 그림을 따로 만든다. 글 폴더에 `<이름>.en.svg` 처럼 확장자 앞에 `.en` 을 붙여 두고 en 에서는 그 경로를 쓴다. 구조 검사는 언어 접미사를 뺀 경로로 비교하므로 `?w=` 같은 쿼리는 ko 와 같게 둔다. 그림 안의 글자에는 1인칭을 쓰지 않는다(문체 가이드 3절).
- 내부 링크는 ko 와 같은 경로(`/<slug>`)로 둔다. `/en` 은 빌드가 붙인다.
  - 같은 글 안 앵커(`#…`)는 영어 헤딩의 앵커로 바꾼다.
- 코드 블록 안 주석과 예시 문자열은 영어로 번역해도 된다. **코드 자체는 바꾸지 않는다.**
- `:term` 은 라벨만 번역하고 `key` 는 그대로 둔다.
- `:::original` 안 글자는 한 글자도 바꾸지 않는다.
- `sourceHash` 는 손으로 계산하지 않는다.

  ```sh
  pnpm content:rehash --post <slug>
  ```

## 3. 구조 검사 통과시키기

```sh
pnpm content:check --post <slug>
```

"en 구조:" 항목이 0개가 될 때까지 맞춘다. 대상은 다음과 같다.

- 헤딩 깊이, 링크 목적지, 이미지 경로, Callout 종류
- 코드 블록의 개수와 언어
- 디렉티브 구조, `:term` key, `:::original` 원문

## 4. 2차 리뷰 받기

새 컨텍스트의 서브에이전트에게 원문 경로와 번역 경로를 넘겨 **지적만** 받는다. 수정은 메인이 한다.

서브에이전트에게 보게 할 것:

- 누락, 확신 정도의 변화(단정 ↔ 추측)
- 수치·인과, 용어(용어집과 일치)
- 자연스러움, 영어 검색 의도
- 코드가 바뀌지 않았는지(주석 말고)

지적을 반영하고 3단계를 다시 통과시킨다.

## 5. 태그·용어집 채우기

번역하면서 새로 필요해진 태그 en 표시 이름이나 용어 en 이름·정의가 비어 있으면 채운다.

- 태그: `content/tags.yaml`
- 용어: `content/glossary.yaml`

## 6. 넘기기

- `translationStatus` 는 `machine` 으로 둔다. **은솔이 확인한 뒤에만 `reviewed` 로 바꾼다.**
- 다음을 보여 준다.
  - 바꾼 파일
  - 2차 리뷰 지적과 반영 결과
  - 채운 태그·용어
