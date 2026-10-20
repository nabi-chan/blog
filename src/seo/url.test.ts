import { describe, expect, it } from 'vitest'
import { absoluteUrl, pageUrl } from '~/seo/url'

describe('absoluteUrl', () => {
  it('사이트 주소 기준 절대 URL 을 만든다. 루트만 끝 슬래시가 있다', () => {
    expect(absoluteUrl('/')).toBe('https://nabichan.me/')
    expect(absoluteUrl('/261020')).toBe('https://nabichan.me/261020')
    expect(absoluteUrl('/og/ko/261020.png')).toBe('https://nabichan.me/og/ko/261020.png')
  })
})

describe('pageUrl', () => {
  it('언어 접두사를 붙인 절대 URL 을 만든다', () => {
    expect(pageUrl('/', 'ko')).toBe('https://nabichan.me/')
    expect(pageUrl('/', 'en')).toBe('https://nabichan.me/en')
    expect(pageUrl('/posts', 'ko')).toBe('https://nabichan.me/posts')
    expect(pageUrl('/261020', 'en')).toBe('https://nabichan.me/en/261020')
  })
})
