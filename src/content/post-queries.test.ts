import { describe, expect, it } from 'vitest'
import { type PostMeta, createPostIndex } from './post-index'
import { createPostQueries, tagRefs } from './post-queries'

const meta = (slug: string, locale: PostMeta['locale'], date: string, tags: string[]): PostMeta => ({
  slug,
  locale,
  title: slug,
  description: slug,
  date,
  tags,
  draft: false,
})

const idx = createPostIndex(
  [meta('both', 'ko', '2026-03-01T00:00:00+09:00', ['a', 'b']), meta('ko-only', 'ko', '2026-05-01T00:00:00+09:00', ['b'])],
  [meta('both', 'en', '2026-03-01T00:00:00+09:00', ['a', 'b'])],
)
const labels = [{ key: 'a', ko: '에이', en: 'A' }]

describe('tagRefs', () => {
  it('언어별 라벨을 붙이고, 표에 없으면 키를 라벨로 쓴다', () => {
    expect(tagRefs(['a', 'b'], 'ko', labels)).toEqual([
      { key: 'a', label: '에이' },
      { key: 'b', label: 'b' },
    ])
    expect(tagRefs(['a'], 'en', labels)).toEqual([{ key: 'a', label: 'A' }])
  })
})

describe('createPostQueries', () => {
  it('listPosts 는 그 언어 글과 태그 라벨을 돌려준다', () => {
    const q = createPostQueries({ index: idx, tagLabels: labels })
    expect(q.listPosts('en')).toEqual({
      posts: idx.list('en'),
      tags: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'b' },
      ],
    })
  })
})
