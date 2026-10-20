// 검색 결과 설명 길이 상한. SEO 메타를 자르는 코드와 zod 스키마가 같이 쓴다
export const DESCRIPTION_MAX = 160
// 글 slug = 폴더 이름. YYMMDD(KST 작성일) 뒤에 선택적으로 -kebab 접미사
export const SLUG_PATTERN = /^(\d{6})(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$/
export const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// 콘텐츠 폭 = min(1200px, CONTENT_VW vw) (tokens.css 의 --content-width). 이미지 sizes 가 쓴다
export const CONTENT_VW = 90
// 화면이 이 폭 이상이면(콘텐츠 폭 1080px 이상) 글을 본문 + 목차 280px 로 나눈다. CSS(src/pages/post/ui/post.css)와 같은 값이다.
// 본문은 콘텐츠 폭 1080px 일 때 800px 이고, 콘텐츠 폭이 1200px 까지 늘면 920px 까지 늘어난다
export const SPLIT_MIN_VIEWPORT = 1200
export const BODY_MAX_WIDTH = 920
export const IMAGE_VARIANT_WIDTHS = [720, 1440]
