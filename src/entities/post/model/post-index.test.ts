import { describe, expect, it } from 'vitest'
import { type PostMeta, collectCategories, createPostIndex, groupByYear } from './post-index'

const meta = (slug: string, locale: PostMeta['locale'], date: string, categories: string[]): PostMeta => ({
  slug,
  locale,
  title: slug,
  description: slug,
  date,
  categories,
  draft: false,
})

const ko = [
  meta('both', 'ko', '2026-03-01T00:00:00+09:00', ['a', 'b']),
  meta('ko-only', 'ko', '2026-05-01T00:00:00+09:00', ['b']),
  meta('old', 'ko', '2025-12-01T00:00:00+09:00', ['a']),
]
const en = [meta('both', 'en', '2026-03-01T00:00:00+09:00', ['a', 'b'])]
const idx = createPostIndex(ko, en)

describe('createPostIndex', () => {
  it('언어별 목록을 날짜 내림차순으로 돌려준다', () => {
    expect(idx.list('ko').map((p) => p.slug)).toEqual(['ko-only', 'both', 'old'])
    expect(idx.list('en').map((p) => p.slug)).toEqual(['both'])
  })

  it('번역본이 없는 글은 영어로 찾을 수 없다', () => {
    expect(idx.get('en', 'ko-only')).toBeUndefined()
    expect(idx.get('ko', 'ko-only')?.slug).toBe('ko-only')
  })

  it('글이 있는 언어 목록을 돌려준다', () => {
    expect(idx.locales('both')).toEqual(['ko', 'en'])
    expect(idx.locales('ko-only')).toEqual(['ko'])
  })

  it('메서드는 떼어서 콜백으로 넘겨도 동작한다', () => {
    const { locales } = idx
    expect(['both', 'ko-only'].map(locales)).toEqual([['ko', 'en'], ['ko']])
  })
})

describe('groupByYear', () => {
  it('KST 연도로 묶고 연도 내림차순으로 돌려준다', () => {
    expect(groupByYear(idx.list('ko')).map((g) => [g.year, g.posts.length])).toEqual([
      [2026, 2],
      [2025, 1],
    ])
  })
})

describe('collectCategories', () => {
  it('빈도 내림차순, 같으면 키 오름차순', () => {
    expect(collectCategories(idx.list('ko'))).toEqual(['a', 'b'])
    expect(collectCategories([meta('x', 'ko', '2026-01-01T00:00:00+09:00', ['z', 'y', 'z'])])).toEqual(['z', 'y'])
  })
})
