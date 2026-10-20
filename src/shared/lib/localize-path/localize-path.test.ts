import { describe, expect, it } from 'vitest'
import { localizePath } from './localize-path'

describe('localizePath', () => {
  it('한국어는 그대로, 영어는 /en 을 붙인다', () => {
    expect(localizePath('/', 'en')).toBe('/en')
    expect(localizePath('/posts', 'en')).toBe('/en/posts')
    expect(localizePath('/posts', 'ko')).toBe('/posts')
  })
})
