import { TAG_PATTERN } from '~/content/constants'

// 목록 필터는 React 렌더 결과를 바꾸지 않고 <html data-tag> 속성과 CSS 로만 건다.
// 프리렌더된 /posts 를 ?tag= 로 열어도 hydration 이 어긋나지 않게 하려는 것이다
export function tagFilterCss(keys: string[]): string {
  return keys
    .filter((key) => TAG_PATTERN.test(key))
    .map(
      (key) =>
        `html[data-tag="${key}"] [data-post]:not([data-tags~="${key}"]){display:none}` +
        `html[data-tag="${key}"] [data-year]:not(:has([data-tags~="${key}"])){display:none}` +
        `html[data-tag="${key}"] [data-chip="${key}"]{font-weight:700;text-decoration:underline}`,
    )
    .join('')
}

export function readTagParam(search: string): string | undefined {
  const tag = new URLSearchParams(search).get('tag')
  return tag !== null && TAG_PATTERN.test(tag) ? tag : undefined
}
