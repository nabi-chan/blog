import { describe, expect, it } from 'vitest'
import { applyCategorySelection, categoryFilterCss, readCategoryParam } from './category-filter'

describe('categoryFilterCss', () => {
  it('카테고리마다 숨김·활성 칩 규칙을 만든다', () => {
    expect(categoryFilterCss(['meta'])).toBe(
      'html[data-category="meta"] [data-post]:not([data-categories~="meta"]){display:none}' +
        'html[data-category="meta"] [data-chip="meta"]{color:var(--ink);font-weight:700;text-decoration:underline}',
    )
  })

  it('카테고리가 없으면 빈 문자열이다', () => {
    expect(categoryFilterCss([])).toBe('')
  })

  it('형식에 안 맞는 키는 건너뛴다 (CSS 주입 방지)', () => {
    expect(categoryFilterCss(['a"b'])).toBe('')
  })
})

describe('readCategoryParam', () => {
  it('?category 값을 읽는다', () => {
    expect(readCategoryParam('?category=meta')).toBe('meta')
  })

  it('형식에 안 맞거나 없으면 undefined 다', () => {
    expect(readCategoryParam('?category=META')).toBeUndefined()
    expect(readCategoryParam('')).toBeUndefined()
  })
})

describe('applyCategorySelection', () => {
  function fakeDocument() {
    const chips = new Map<string, { attributes: Map<string, string>; setAttribute(name: string, value: string): void; removeAttribute(name: string): void }>()
    for (const key of ['', 'meta']) {
      const attributes = new Map<string, string>()
      chips.set(key, { attributes, setAttribute: (name, value) => attributes.set(name, value), removeAttribute: (name) => attributes.delete(name) })
    }
    const doc = {
      documentElement: { dataset: {} as Record<string, string | undefined> },
      querySelector: (selector: string) => chips.get(/data-chip="([^"]*)"/.exec(selector)?.[1] ?? 'none') ?? null,
    }
    return { doc, chips }
  }

  it('?category 를 <html data-category> 와 칩의 aria-current 로 옮기고, 정리하면 둘 다 지운다', () => {
    const { doc, chips } = fakeDocument()
    const cleanup = applyCategorySelection(doc, '?category=meta')
    expect(doc.documentElement.dataset.category).toBe('meta')
    expect(chips.get('meta')?.attributes.get('aria-current')).toBe('page')
    cleanup()
    expect(doc.documentElement.dataset.category).toBeUndefined()
    expect(chips.get('meta')?.attributes.has('aria-current')).toBe(false)
  })

  it('정리한 뒤 다시 적용하면 data-category 가 되살아난다 (StrictMode 의 effect 재실행)', () => {
    const { doc } = fakeDocument()
    applyCategorySelection(doc, '?category=meta')()
    applyCategorySelection(doc, '?category=meta')
    expect(doc.documentElement.dataset.category).toBe('meta')
  })

  it('카테고리가 없거나 형식이 틀리면 전체 칩을 표시하고 data-category 를 두지 않는다', () => {
    const { doc, chips } = fakeDocument()
    applyCategorySelection(doc, '?category=<x>')
    expect(doc.documentElement.dataset.category).toBeUndefined()
    expect(chips.get('')?.attributes.get('aria-current')).toBe('page')
  })
})
