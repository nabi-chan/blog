import { describe, expect, it } from 'vitest'
import { localizePath, resolvePostLink } from './link'

// 260301 은 영어 번역본이 있고 260501 은 한국어만 있다
const enSlugs = new Set(['260301'])

describe('localizePath', () => {
  it('한국어는 그대로, 영어는 /en 을 붙인다', () => {
    expect(localizePath('/', 'en')).toBe('/en')
    expect(localizePath('/posts', 'en')).toBe('/en/posts')
    expect(localizePath('/posts', 'ko')).toBe('/posts')
  })
})

describe('resolvePostLink', () => {
  it('영어 본문에서 영어 번역본이 있는 글은 /en 으로 바꾼다', () => {
    expect(resolvePostLink('/260301', 'en', enSlugs)).toEqual({ href: '/en/260301', external: false })
    expect(resolvePostLink('/260301#s', 'en', enSlugs)).toEqual({ href: '/en/260301#s', external: false })
  })

  it('영어 번역본이 없으면 한국어 글로 두고 hrefLang 을 단다', () => {
    expect(resolvePostLink('/260501', 'en', enSlugs)).toEqual({ href: '/260501', hrefLang: 'ko', external: false })
  })

  it('한국어 본문의 링크는 그대로 둔다', () => {
    expect(resolvePostLink('/260301', 'ko', enSlugs)).toEqual({ href: '/260301', external: false })
  })

  it('글이 아닌 내부 경로도 언어에 맞춘다', () => {
    expect(resolvePostLink('/posts', 'en', enSlugs)).toEqual({ href: '/en/posts', external: false })
    expect(resolvePostLink('/', 'en', enSlugs)).toEqual({ href: '/en', external: false })
  })

  it('외부 링크와 앵커는 그대로 두되 외부 여부를 알려준다', () => {
    expect(resolvePostLink('https://example.com', 'en', enSlugs)).toEqual({ href: 'https://example.com', external: true })
    expect(resolvePostLink('#top', 'en', enSlugs)).toEqual({ href: '#top', external: false })
  })
})
