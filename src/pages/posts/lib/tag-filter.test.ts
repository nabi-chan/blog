import { describe, expect, it } from 'vitest'
import { applyTagSelection, readTagParam, tagFilterCss } from './tag-filter'

describe('tagFilterCss', () => {
  it('태그마다 숨김·빈 연도·활성 칩 규칙을 만든다', () => {
    expect(tagFilterCss(['meta'])).toBe(
      'html[data-tag="meta"] [data-post]:not([data-tags~="meta"]){display:none}' +
        'html[data-tag="meta"] [data-year]:not(:has([data-tags~="meta"])){display:none}' +
        'html[data-tag="meta"] [data-chip="meta"]{color:var(--ink);font-weight:700;text-decoration:underline}',
    )
  })

  it('태그가 없으면 빈 문자열이다', () => {
    expect(tagFilterCss([])).toBe('')
  })

  it('형식에 안 맞는 키는 건너뛴다 (CSS 주입 방지)', () => {
    expect(tagFilterCss(['a"b'])).toBe('')
  })
})

describe('readTagParam', () => {
  it('?tag 값을 읽는다', () => {
    expect(readTagParam('?tag=meta')).toBe('meta')
  })

  it('형식에 안 맞거나 없으면 undefined 다', () => {
    expect(readTagParam('?tag=META')).toBeUndefined()
    expect(readTagParam('')).toBeUndefined()
  })
})

describe('applyTagSelection', () => {
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

  it('?tag 를 <html data-tag> 와 칩의 aria-current 로 옮기고, 정리하면 둘 다 지운다', () => {
    const { doc, chips } = fakeDocument()
    const cleanup = applyTagSelection(doc, '?tag=meta')
    expect(doc.documentElement.dataset.tag).toBe('meta')
    expect(chips.get('meta')?.attributes.get('aria-current')).toBe('page')
    cleanup()
    expect(doc.documentElement.dataset.tag).toBeUndefined()
    expect(chips.get('meta')?.attributes.has('aria-current')).toBe(false)
  })

  it('정리한 뒤 다시 적용하면 data-tag 가 되살아난다 (StrictMode 의 effect 재실행)', () => {
    const { doc } = fakeDocument()
    applyTagSelection(doc, '?tag=meta')()
    applyTagSelection(doc, '?tag=meta')
    expect(doc.documentElement.dataset.tag).toBe('meta')
  })

  it('태그가 없거나 형식이 틀리면 전체 칩을 표시하고 data-tag 를 두지 않는다', () => {
    const { doc, chips } = fakeDocument()
    applyTagSelection(doc, '?tag=<x>')
    expect(doc.documentElement.dataset.tag).toBeUndefined()
    expect(chips.get('')?.attributes.get('aria-current')).toBe('page')
  })
})
