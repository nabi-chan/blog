import type { Locale } from '~/i18n/runtime'
import { describe, expect, it } from 'vitest'
import { type PostMeta, createPostIndex } from './post-index'
import { type BodyKey, type PostBody, type PostSource, createPostQueries, tagRefs } from './post-queries'

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
  ['ko/both', { html: '<p>ko</p>', toc: [], terms: [] }],
  ['en/both', { html: '<p>en</p>', toc: [], terms: ['hydration'] }],
  ['ko/ko-only', { html: '<p>ko only</p>', toc: [], terms: [] }],
])
const sources = new Map<BodyKey, PostSource>([
  ['ko/both', { markdown: 'ko md', wordCount: 3 }],
  ['en/both', { markdown: 'en md', wordCount: 2 }],
  ['ko/ko-only', { markdown: 'ko only md', wordCount: 5 }],
])
const intros = new Map<Locale, PostBody>([['ko', { html: '<p>소개</p>', toc: [], terms: ['hydration'] }]])
const glossary = {
  hydration: { ko: { name: '하이드레이션', definition: '정의 ko' }, en: { name: 'Hydration', definition: 'def en' } },
}

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
    const q = createPostQueries({ index: idx, tagLabels: labels, bodies, sources, glossary, intros })
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
  const q = createPostQueries({ index: idx, tagLabels: labels, bodies, sources, glossary, intros })

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
      terms: { hydration: { name: 'Hydration', definition: 'def en' } },
      wordCount: 2,
    })
  })

  it('본문에 용어가 없으면 빈 정의 목록이다', () => {
    expect(q.getPostPage('ko', 'ko-only')?.terms).toEqual({})
  })

  it('그 언어로 없는 글은 null 이다', () => {
    expect(q.getPostPage('en', 'ko-only')).toBeNull()
    expect(q.getPostPage('ko', 'nope')).toBeNull()
  })

  it('메타는 있는데 본문이 없으면 데이터 오류로 던진다', () => {
    expect(() => createPostQueries({ index: idx, tagLabels: labels, bodies: new Map(), sources, glossary, intros }).getPostPage('ko', 'both')).toThrow(
      /본문이나 원문이 없습니다/,
    )
    expect(() => createPostQueries({ index: idx, tagLabels: labels, bodies, sources: new Map(), glossary, intros }).getPostPage('ko', 'both')).toThrow(
      /본문이나 원문이 없습니다/,
    )
  })
})

describe('getLobbyIntro', () => {
  const q = createPostQueries({ index: idx, tagLabels: labels, bodies, sources, glossary, intros })

  it('그 언어 소개글 HTML 과 쓴 용어의 정의를 돌려준다', () => {
    expect(q.getLobbyIntro('ko')).toEqual({
      html: '<p>소개</p>',
      terms: { hydration: { name: '하이드레이션', definition: '정의 ko' } },
    })
  })

  it('소개글이 없으면 null 이다', () => {
    expect(q.getLobbyIntro('en')).toBeNull()
  })
})

describe('listFeed / getMarkdown', () => {
  const draftIdx = createPostIndex(
    [...idx.list('ko'), { ...meta('draft', 'ko', '2026-06-01T00:00:00+09:00', []), draft: true }],
    idx.list('en'),
  )
  const q = createPostQueries({
    index: draftIdx,
    tagLabels: labels,
    bodies: new Map([...bodies, ['ko/draft', { html: '<p>d</p>', toc: [], terms: [] }]]),
    sources: new Map([...sources, ['ko/draft', { markdown: 'draft md', wordCount: 1 }]]),
    glossary,
    intros,
  })

  it('listFeed 는 draft 를 빼고 날짜 내림차순으로 본문·원문·태그를 돌려준다', () => {
    expect(q.listFeed('ko').map((item) => [item.post.slug, item.html, item.markdown])).toEqual([
      ['ko-only', '<p>ko only</p>', 'ko only md'],
      ['both', '<p>ko</p>', 'ko md'],
    ])
    expect(q.listFeed('ko')[1].tags).toEqual([
      { key: 'a', label: '에이' },
      { key: 'b', label: 'b' },
    ])
  })

  it('en 피드에는 번역 있는 글만 있다', () => {
    expect(q.listFeed('en').map((item) => item.post.slug)).toEqual(['both'])
  })

  it('getMarkdown 은 없는 글·번역 없는 글·draft 에서 null 이다', () => {
    expect(q.getMarkdown('ko', 'both')).toBe('ko md')
    expect(q.getMarkdown('en', 'ko-only')).toBeNull()
    expect(q.getMarkdown('ko', 'draft')).toBeNull()
    expect(q.getMarkdown('ko', 'nope')).toBeNull()
  })

  it('getPostPage 는 단어 수를 같이 돌려준다', () => {
    expect(q.getPostPage('ko', 'ko-only')?.wordCount).toBe(5)
  })
})
