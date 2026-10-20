import { describe, expect, it } from 'vitest'
import { collectContentProblems, headingAnchors, messageKeyDiff, missingTagLabels, missingTerms, brokenInternalLinks } from './content-checks'

describe('missingTagLabels / missingTerms', () => {
  it('표에 없는 키를 낸다', () => {
    expect(missingTagLabels(['meta', 'llm'], [{ key: 'meta' }])).toEqual(['llm'])
    expect(missingTerms(['prerender', 'hydration', 'prerender'], [{ key: 'prerender' }])).toEqual(['hydration'])
  })
})

describe('headingAnchors', () => {
  it('rehype-slug 와 같은 규칙으로 헤딩 id 를 만든다', () => {
    expect([...headingAnchors('## 구성\n\n### `code` 예시\n\n## 구성')]).toEqual(['구성', 'code-예시', '구성-1'])
  })
})

describe('brokenInternalLinks', () => {
  const site = {
    posts: new Map([
      ['261020', { ko: new Set(['구성']), en: new Set(['structure']) }],
      ['261021', { ko: new Set(['소개']) }],
    ]),
  }

  it('있는 글·앵커·목록·산출물 링크와 외부 링크는 통과한다', () => {
    const markdown = '[a](/261020#구성) [b](#구성) [c](/posts) [d](/) [e](/posts?tag=meta) [f](https://x.com) [g](/rss.xml) [h](/261020.md) [i](mailto:a@b.c)'
    expect(brokenInternalLinks({ slug: '261020', locale: 'ko', markdown }, site)).toEqual([])
  })

  it('없는 글, 그 글에 없는 앵커, 알 수 없는 경로를 알린다', () => {
    const markdown = '[a](/261099) [b](/261020#없음) [c](#없음) [d](/nope)'
    expect(brokenInternalLinks({ slug: '261020', locale: 'ko', markdown }, site)).toEqual([
      '/261099 → 없는 글',
      '/261020#없음 → 261020 에 없는 앵커',
      '#없음 → 261020 에 없는 앵커',
      '/nope → 알 수 없는 사이트 경로',
    ])
  })

  it('en 원문은 번역이 있는 글이면 en 앵커로, 없으면 ko 앵커로 본다', () => {
    const markdown = '[a](/261020#structure) [b](/261021#소개) [c](#structure) [d](/en/261021)'
    expect(brokenInternalLinks({ slug: '261020', locale: 'en', markdown }, site)).toEqual(['/en/261021 → 번역 없는 글'])
  })

  it('한글 앵커가 퍼센트 인코딩돼 있어도 찾는다', () => {
    expect(brokenInternalLinks({ slug: '261020', locale: 'ko', markdown: '[a](/261020#%EA%B5%AC%EC%84%B1)' }, site)).toEqual([])
  })
})

describe('messageKeyDiff', () => {
  it('한쪽에만 있는 키를 내고 $schema 는 뺀다', () => {
    expect(messageKeyDiff({ $schema: 'x', a: '', b: '' }, { a: '', c: '' })).toEqual({ onlyKo: ['b'], onlyEn: ['c'] })
  })
})

describe('collectContentProblems', () => {
  const ko = { title: '제목', description: '설명', body: '## 구성\n\n:term[프리렌더]{key="prerender"}\n', tags: ['meta'] }
  const base = { tagKeys: ['meta'], termKeys: ['prerender'] }

  it('문제가 없으면 빈 배열이다', () => {
    expect(collectContentProblems({ ...base, posts: [{ slug: '261020', ko }] })).toEqual([])
  })

  it('빠진 태그·용어, 깨진 링크, 낡은 번역, 구조 불일치를 글마다 모은다', () => {
    const problems = collectContentProblems({
      tagKeys: [],
      termKeys: [],
      posts: [{ slug: '261020', ko: { ...ko, body: `${ko.body}\n[x](/261099)\n` }, en: { body: '## Structure\n\n## Extra\n', sourceHash: 'old' } }],
    })
    expect(problems).toEqual([
      {
        slug: '261020',
        problems: [
          '태그 표시 이름 없음: meta',
          '용어집에 없는 :term: prerender',
          'ko 링크 /261099 → 없는 글',
          'en 번역이 낡았습니다 (pnpm content:rehash --post 261020 또는 /translate-post)',
          'en 구조: 헤딩 깊이가 다릅니다: ko [2] / en [2, 2]',
          'en 구조: 링크 목적지가 다릅니다: ko [/261099] / en []',
          'en 구조: :term key 가 다릅니다: ko [prerender] / en []',
        ],
      },
    ])
  })
})
