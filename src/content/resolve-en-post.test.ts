import { describe, expect, it } from 'vitest'
import { type EnSource, type KoSource, resolveEnPost } from './resolve-en-post'
import { computeSourceHash } from './source-hash'

const ko: KoSource = {
  slug: 'hello',
  title: '안녕',
  description: '설명',
  content: '본문',
  date: '2026-05-06T00:00:00+09:00',
  updated: '2026-05-07T00:00:00+09:00',
  tags: ['meta'],
  draft: false,
}
const en: EnSource = {
  slug: 'hello',
  title: 'Hello',
  description: 'Description',
  sourceHash: computeSourceHash({ title: ko.title, description: ko.description, body: ko.content }),
  translationStatus: 'machine',
}

describe('resolveEnPost', () => {
  it('원문이 없으면 던진다', () => {
    expect(() => resolveEnPost(en, undefined, { production: true })).toThrow(/hello: 한국어 원문이 없습니다/)
  })

  it('원문 해시와 다르면 갱신 방법을 알려주며 던진다', () => {
    expect(() => resolveEnPost({ ...en, sourceHash: 'x'.repeat(64) }, ko, { production: true })).toThrow(
      /낡았습니다.*content:rehash --post hello/,
    )
  })

  it('원문이 draft 면 프로덕션에서는 건너뛴다', () => {
    expect(resolveEnPost(en, { ...ko, draft: true }, { production: true })).toEqual({ kind: 'skip' })
  })

  it('원문이 draft 여도 dev 에서는 draft 표시를 달고 보인다', () => {
    expect(resolveEnPost(en, { ...ko, draft: true }, { production: false })).toMatchObject({
      kind: 'ok',
      post: { draft: true },
    })
  })

  it('날짜·태그·draft 는 원문에서 상속한다', () => {
    expect(resolveEnPost(en, ko, { production: true })).toEqual({
      kind: 'ok',
      post: {
        slug: 'hello',
        locale: 'en',
        title: 'Hello',
        description: 'Description',
        date: ko.date,
        updated: ko.updated,
        tags: ['meta'],
        draft: false,
        translationStatus: 'machine',
      },
    })
  })
})
