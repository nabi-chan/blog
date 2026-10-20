import { describe, expect, it } from 'vitest'
import { type PostMeta, createPostIndex } from './post-index'
import { type BodyKey, type PostBody, createPostQueries, tagRefs } from './post-queries'

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
const bodies = new Map<BodyKey, PostBody>([
  ['ko/both', { html: '<p>ko</p>', toc: [] }],
  ['en/both', { html: '<p>en</p>', toc: [] }],
  ['ko/ko-only', { html: '<p>ko only</p>', toc: [] }],
])

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
    const q = createPostQueries({ index: idx, tagLabels: labels, bodies })
    expect(q.listPosts('en')).toEqual({
      posts: idx.list('en'),
      tags: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'b' },
      ],
    })
  })
})

describe('getPostPage', () => {
  const q = createPostQueries({ index: idx, tagLabels: labels, bodies })

  it('글 메타·있는 언어·태그·본문을 돌려준다', () => {
    expect(q.getPostPage('en', 'both')).toEqual({
      post: idx.get('en', 'both'),
      available: ['ko', 'en'],
      tags: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'b' },
      ],
      html: '<p>en</p>',
      toc: [],
    })
  })

  it('그 언어로 없는 글은 null 이다', () => {
    expect(q.getPostPage('en', 'ko-only')).toBeNull()
    expect(q.getPostPage('ko', 'nope')).toBeNull()
  })

  it('메타는 있는데 본문이 없으면 데이터 오류로 던진다', () => {
    expect(() => createPostQueries({ index: idx, tagLabels: labels, bodies: new Map() }).getPostPage('ko', 'both')).toThrow(
      /본문이 없습니다/,
    )
  })
})
