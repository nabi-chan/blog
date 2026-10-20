import { describe, expect, it } from 'vitest'
import { LANGUAGE_NAMES, languageOptions } from './language-options'

const hrefFor = (locale: 'ko' | 'en') => (locale === 'ko' ? '/261020' : '/en/261020')

describe('LANGUAGE_NAMES', () => {
  it('언어 이름은 그 언어 자체 표기다', () => {
    expect(LANGUAGE_NAMES).toEqual({ ko: '한국어', en: 'English' })
  })
})

describe('languageOptions', () => {
  it('모든 언어를 순서대로 내고, 지금 언어를 표시한다', () => {
    expect(languageOptions({ locales: ['ko', 'en'], current: 'en', available: ['ko', 'en'], hrefFor })).toEqual([
      { locale: 'ko', name: '한국어', href: '/261020', current: false },
      { locale: 'en', name: 'English', href: '/en/261020', current: true },
    ])
  })

  it('번역이 없는 언어는 링크 없이 낸다', () => {
    expect(languageOptions({ locales: ['ko', 'en'], current: 'ko', available: ['ko'], hrefFor })).toEqual([
      { locale: 'ko', name: '한국어', href: '/261020', current: true },
      { locale: 'en', name: 'English', href: null, current: false },
    ])
  })
})
