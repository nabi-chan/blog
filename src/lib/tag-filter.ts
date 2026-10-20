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
        `html[data-tag="${key}"] [data-chip="${key}"]{color:var(--ink);font-weight:700;text-decoration:underline}`,
    )
    .join('')
}

export function readTagParam(search: string): string | undefined {
  const tag = new URLSearchParams(search).get('tag')
  return tag !== null && TAG_PATTERN.test(tag) ? tag : undefined
}

type ChipLike = { setAttribute(name: string, value: string): void; removeAttribute(name: string): void }
type DocumentLike = {
  documentElement: { dataset: Record<string, string | undefined> }
  querySelector(selector: string): ChipLike | null
}

// /posts 의 선택 상태를 브라우저에서 건다. 정리 함수를 돌려주는 effect 본문이다.
// StrictMode(dev)는 effect 를 "적용 → 정리 → 다시 적용" 하므로, 인라인 스크립트가 붙인 data-tag 도 여기서 다시 세운다
export function applyTagSelection(doc: DocumentLike, search: string): () => void {
  const tag = readTagParam(search)
  if (tag) doc.documentElement.dataset.tag = tag
  const chip = doc.querySelector(`.tag-filter [data-chip="${tag ?? ''}"]`)
  chip?.setAttribute('aria-current', 'page')
  return () => {
    chip?.removeAttribute('aria-current')
    delete doc.documentElement.dataset.tag
  }
}
