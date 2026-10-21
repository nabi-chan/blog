---
description: 저장소를 점검하고 확인된 문제를 고친다
argument-hint: [--live]
---

# /audit

저장소 전체를 점검한다. 옵션: $ARGUMENTS

시작하기 전에 `AGENTS.md` 를 읽는다.

## 0. 자동 점검 (혼자 직렬로)

```sh
pnpm audit:repo --build          # 인자에 --live 가 있으면 뒤에 --live 를 붙인다
```

- 다른 빌드, dev 서버, 병렬 작업과 같이 돌리지 않는다.
- 결과는 `.audit-report.json` 에 있다. FAIL·WARN 을 목록으로 옮겨 둔다.

## 1. 읽기 전용 레인 4개를 병렬로

서브에이전트 4개를 동시에 띄운다.

모든 레인의 공통 규칙:

- 빌드와 dev 서버를 실행하지 않는다.
- 파일을 고치지 않는다.
- 먼저 `AGENTS.md` 를 읽는다.

| 레인 | 볼 것 |
|---|---|
| 라우트·i18n | `src/app/routes/`, `src/shared/i18n/`, `project.inlang/paraglide.config.ts`, 언어 접두사, 404, hreflang, 번역 없는 글 처리, 메시지 키 |
| SEO | 프로덕션(`https://nabichan.me`)을 curl 로 본다. 메타, canonical, OG 이미지, sitemap, robots, RSS, llms, `.md` |
| 런타임·데이터 | `src/app/server/`, `src/features/*/api/`, `src/shared/api/`, `migrations/`, D1 쿼리, Access 검증(fail closed), Turnstile·시도 제한 순서, 오류 경로(503), 로그 |
| 콘텐츠·번역 | `content/`, 번역 구조, 낡은 번역, 카테고리·용어집, 깨진 링크, 문체 가이드 위반 |

레인마다 이 형식으로 보고받는다.

```
- 위치: 파일:줄 또는 URL
- 실패 시나리오: 어떤 입력·상황에서 무엇이 잘못되는지
- 심각도: Critical / Important / Minor
- 확신: CONFIRMED(재현함) / SUSPECTED(추정)
```

## 2. 검증하고 고치기

- 보고를 받은 대로 믿지 않고 직접 재현한다. SUSPECTED 는 재현되면 CONFIRMED 로 올리고, 아니면 버린다.
- 확인된 문제를 고친다. 코드를 고칠 때는 실패하는 테스트부터 쓴다.
- 고친 뒤 `pnpm audit:repo --build` 를 다시 돌린다.

## 3. 남기기

- 고친 것과 안 고친 것을 이유와 함께 은솔에게 보고한다.
- 예산 수치가 바뀌었으면 `src/shared/tooling/audit.ts` 의 `BUDGETS` 와 `AGENTS.md` 의 예산 표를 같이 고친다.
- 커밋은 은솔이 확인한 뒤에 한다.
