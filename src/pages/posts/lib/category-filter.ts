import { KEY_PATTERN } from '~/shared/config'

// 목록 필터는 React 렌더 결과를 바꾸지 않고 <html data-category> 속성과 CSS 로만 건다.
// 프리렌더된 /posts 를 ?category= 로 열어도 hydration 이 어긋나지 않게 하려는 것이다
export function categoryFilterCss(keys: string[]): string {
  return keys
    .filter((key) => KEY_PATTERN.test(key))
    .map(
      (key) =>
        `html[data-category="${key}"] [data-post]:not([data-categories~="${key}"]){display:none}` +
        `html[data-category="${key}"] [data-chip="${key}"]{color:var(--ink);font-weight:700;text-decoration:underline}`,
    )
    .join('')
}

export function readCategoryParam(search: string): string | undefined {
  const category = new URLSearchParams(search).get('category')
  return category !== null && KEY_PATTERN.test(category) ? category : undefined
}

type ChipLike = { setAttribute(name: string, value: string): void; removeAttribute(name: string): void }
type DocumentLike = {
  documentElement: { dataset: Record<string, string | undefined> }
  querySelector(selector: string): ChipLike | null
}

// /posts 의 선택 상태를 브라우저에서 건다. 정리 함수를 돌려주는 effect 본문이다.
// StrictMode(dev)는 effect 를 "적용 → 정리 → 다시 적용" 하므로, 인라인 스크립트가 붙인 data-category 도 여기서 다시 세운다
export function applyCategorySelection(doc: DocumentLike, search: string): () => void {
  const category = readCategoryParam(search)
  if (category) doc.documentElement.dataset.category = category
  const chip = doc.querySelector(`.category-filter [data-chip="${category ?? ''}"]`)
  chip?.setAttribute('aria-current', 'page')
  return () => {
    chip?.removeAttribute('aria-current')
    delete doc.documentElement.dataset.category
  }
}
