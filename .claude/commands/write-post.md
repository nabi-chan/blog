---
description: 초안으로 은솔 문체의 새 글(ko)을 쓴다
argument-hint: <초안 또는 초안 파일 경로>
---

# /write-post

은솔의 초안으로 새 한국어 글을 쓴다. 초안: $ARGUMENTS

시작하기 전에 `AGENTS.md` 와 `docs/writing/style-guide.md` 를 읽는다. **커밋하지 않는다.**

## 1. 주제와 논지 잡기

- 초안을 읽고 다음을 한 문단으로 정리해 은솔에게 보여 준다.
  - 이 글이 답하는 질문
  - 대상 독자
  - 독자가 얻을 것
- 은솔의 경험·감정·동기는 초안에 있는 것만 쓴다. 없는 것은 지어내지 않고 물어본다.

## 2. 사실과 최신성 확인하기

- 버전, 가격, 지원 여부처럼 시간이 지나면 바뀌는 사실은 오늘 날짜 기준으로 웹에서 확인한다.
- 1차 출처(공식 문서, 저장소, 이슈)를 고른다. 확인한 출처는 글의 See Also 나 본문 링크에 쓴다.

## 3. 글 쓰기

- 글 폴더: `content/posts/<slug>/index.ko.md`
  - slug 는 `YYMMDD` 또는 `YYMMDD-kebab-case` 다. `YYMMDD` 는 frontmatter `date`(KST)와 같아야 한다.
  - 하루에 한 편만 쓴다. 같은 날짜로 시작하는 폴더가 이미 있으면 은솔에게 날짜를 묻는다.
- frontmatter

  ```yaml
  ---
  title: "검색할 말이 앞에 오는 제목"
  description: "160자 이하. 이 글이 답하는 질문"
  date: "2026-10-20 12:00"      # KST
  tags: ["llm"]                 # 태그 키 (소문자 ASCII)
  draft: true                   # 은솔이 확인하기 전까지
  ---
  ```

- 이미지는 글 폴더에 둔다. 상대 경로로 쓰고(`![대체 텍스트](./diagram.png "캡션")`), 대체 텍스트를 꼭 쓴다.
  - 한글·공백 파일 이름도 된다.
  - 폭을 줄이려면 `?w=400` 을 붙인다.
- 쓸 수 있는 문법은 `content/posts/` 의 기존 글을 본다. 모르는 디렉티브는 빌드 오류다.
  - Callout `> [!TIP]`
  - `:::details`
  - `:::see-also`
  - `::::quote` + `:::translation` / `:::original`
  - `:term[라벨]{key="..."}`
  - `:::widget-<이름>`
- 문체는 `docs/writing/style-guide.md` 를 따른다.

## 4. 체크리스트 점검하기

- **SEO**
  - 제목에 검색할 말이 앞쪽에 있다.
  - 설명은 160자 이하다.
  - 첫 문단에 대상 독자와 얻을 것이 있다.
- **신뢰**
  - 1차 경험이 있다.
  - 재현 조건(버전·날짜·환경)이 있다.
  - 1차 출처 링크가 있다.
- **AI 문체 신호**: 문체 가이드 5절 표대로 걷어낸다.
- **맞춤법**: 문체 가이드 4절대로 교정한다.

## 5. 태그·용어집 채우기

```sh
pnpm content:check --post <slug> --no-build
```

- 출력에서 "태그 표시 이름 없음", "용어집에 없는 :term" 항목을 찾는다.
  - 태그: `content/tags.yaml` 에 `{ key, ko, en }` 을 추가한다.
  - 용어: `content/glossary.yaml` 에 `{ key, ko: { name, definition }, en: { name, definition } }` 을 추가한다.
- **추가한 항목은 은솔에게 따로 보여 준다.**

## 6. 콘텐츠 검사 통과시키기

```sh
pnpm content:check --post <slug>
```

문제가 0개가 될 때까지 고친다. 이 명령은 Content Collections 빌드(스키마·slug·하루 한 편)도 같이 본다.

## 7. 넘기기

- 바꾼 파일 목록과 은솔이 확인할 것을 보여 준다.
  - 사실 확인이 필요한 문장
  - 추가한 태그·용어
  - `draft` 상태
- 번역은 `/translate-post <slug>` 로 넘긴다.
