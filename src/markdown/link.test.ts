import { describe, expect, it } from 'vitest'
import { localizePath, resolvePostLink } from './link'

const enSlugs = new Set(['both'])

describe('localizePath', () => {
  it('한국어는 그대로, 영어는 /en 을 붙인다', () => {
    expect(localizePath('/', 'en')).toBe('/en')
    expect(localizePath('/posts', 'en')).toBe('/en/posts')
    expect(localizePath('/posts', 'ko')).toBe('/posts')
  })
})

describe('resolvePostLink', () => {
  it('영어 본문에서 영어 번역본이 있는 글은 /en 으로 바꾼다', () => {
    expect(resolvePostLink('/posts/both', 'en', enSlugs)).toEqual({ href: '/en/posts/both', external: false })
    expect(resolvePostLink('/posts/both#s', 'en', enSlugs)).toEqual({ href: '/en/posts/both#s', external: false })
  })

  it('영어 번역본이 없으면 한국어 글로 두고 hrefLang 을 단다', () => {
    expect(resolvePostLink('/posts/ko-only', 'en', enSlugs)).toEqual({
      href: '/posts/ko-only',
      hrefLang: 'ko',
      external: false,
    })
  })

  it('한국어 본문의 링크는 그대로 둔다', () => {
    expect(resolvePostLink('/posts/both', 'ko', enSlugs)).toEqual({ href: '/posts/both', external: false })
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
