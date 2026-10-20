// 검색 결과 설명 길이 상한. SEO 메타를 자르는 코드와 zod 스키마가 같이 쓴다
export const DESCRIPTION_MAX = 160
// 글 slug = 폴더 이름. YYMMDD(KST 작성일) 뒤에 선택적으로 -kebab 접미사
export const SLUG_PATTERN = /^(\d{6})(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$/
export const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// 본문 최대 폭(px). 이미지 sizes 와 디자인(prose 폭)이 같이 쓴다
export const PROSE_MAX_WIDTH = 720
export const IMAGE_VARIANT_WIDTHS = [720, 1440]
