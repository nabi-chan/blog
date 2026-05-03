## Verification

- 빌드 체크 목적으로 `pnpm build`를 실행하지 않는다. 개발 서버가 크래시를 남길 수 있다.
- 타입 검증은 `pnpm check`를 우선 사용한다.
- 정적 렌더링 확인이 꼭 필요하면 먼저 사용자에게 물어본다.

## Development

- 기존 구조와 스타일을 우선 따르고, 필요한 범위에서만 작게 변경한다.
- 새 의존성은 기존 패키지나 직접 구현으로 해결하기 어려울 때만 추가한다.
- 콘텐츠 파일 변경은 실제 글 내용에 영향을 주므로 요청이 명확할 때만 수정한다.
- 생성된 산출물이나 캐시 파일은 의도적으로 요청받지 않는 한 커밋 대상 변경으로 다루지 않는다.

## Markdown Pipeline

- 마크다운 렌더링은 `src/markdown/render.ts`의 unified 파이프라인을 기준으로 수정한다.
- TOC와 헤딩 `id`는 `src/markdown/remark-toc.ts`에서 관리한다.
- 본문 헤딩 앵커 링크는 `src/markdown/rehype-heading-links.ts`에서 관리한다.
- HTML 허용 범위를 바꿀 때는 `rehype-sanitize` 스키마를 함께 확인한다.
- Markdown 스타일은 `app/globals.css`의 `.markdown-body` 영역에 맞춰 추가한다.
