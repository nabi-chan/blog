import { describe, expect, it } from 'vitest'
import { OG_SIZE, type OgNode, fitOgTitle, ogTitleFontSize, postCard, siteCard } from './card'

// 트리 안의 글자를 모은다
const texts = (node: OgNode | string): string[] => {
  if (typeof node === 'string') return [node]
  const children = node.props.children
  if (children === undefined) return []
  return (Array.isArray(children) ? children : [children]).flatMap(texts)
}

describe('ogTitleFontSize', () => {
  it('짧은 제목은 가장 큰 크기다', () => {
    expect(ogTitleFontSize('이 블로그를 어떻게 만들었나')).toBe(76)
  })

  it('긴 제목은 세 줄 안에 들도록 줄인다', () => {
    expect(ogTitleFontSize('가'.repeat(60))).toBeLessThan(76)
    expect(ogTitleFontSize('가'.repeat(200))).toBe(44)
  })

  it('같은 글자 수면 라틴 제목이 한글보다 작아지지 않는다', () => {
    const count = 45
    expect(ogTitleFontSize('a'.repeat(count))).toBeGreaterThanOrEqual(ogTitleFontSize('가'.repeat(count)))
  })
})

describe('postCard', () => {
  it('사이트 이름·제목·날짜·도메인을 담는다', () => {
    const card = postCard({ title: '이 블로그를 어떻게 만들었나', date: '2026-10-20T12:00:00+09:00', locale: 'ko' })
    expect(texts(card)).toEqual(expect.arrayContaining(['eunsol', '이 블로그를 어떻게 만들었나', '2026년 10월 20일', 'nabichan.me']))
    expect(texts(postCard({ title: 'T', date: '2026-10-20T12:00:00+09:00', locale: 'en' }))).toContain('October 20, 2026')
  })

  it('padding 이 크기 밖으로 나가지 않게 border-box 이고 크기는 1200×630 이다', () => {
    const card = postCard({ title: 'T', date: '2026-10-20T12:00:00+09:00', locale: 'ko' })
    expect(card.props.style).toMatchObject({ boxSizing: 'border-box', width: OG_SIZE.width, height: OG_SIZE.height })
  })
})

describe('siteCard', () => {
  it('사이트 이름과 설명을 담는다', () => {
    expect(texts(siteCard({ locale: 'ko', description: 'eunsol 개인 블로그' }))).toEqual(expect.arrayContaining(['eunsol', 'eunsol 개인 블로그', 'nabichan.me']))
  })
})

describe('fitOgTitle', () => {
  const longLatin = 'Supercalifragilisticexpialidocious'.repeat(3)
  const longKorean = '띄어쓰기없는아주긴한글제목'.repeat(8)
  const sentence = '이 블로그를 어떻게 만들었는지 처음부터 끝까지 정리하면서 겪은 일들과 고른 도구와 그 이유를 하나씩 적어 보려고 하는데 생각보다 길어져서 제목도 이렇게 길어졌습니다 정말로 아주 길게요 한 번 더 길게 늘여 봅니다'

  it('어떤 제목이든 어림 줄 수가 3 이하다', () => {
    for (const title of [longLatin, longKorean, sentence]) expect(fitOgTitle(title).lines).toBeLessThanOrEqual(3)
  })

  it('공백 없는 긴 토큰이 있으면 넘칠 때 단어 안에서 끊고(break-word), 보통 제목은 어절을 지킨다(keep-all)', () => {
    // satori 는 keep-all 에서 라틴 글자 사이의 U+200B 를 줄바꿈 기회로 보지 않는다 (렌더로 확인)
    expect(fitOgTitle(longLatin).wordBreak).toBe('break-word')
    expect(fitOgTitle(longKorean).wordBreak).toBe('break-word')
    expect(fitOgTitle(sentence).wordBreak).toBe('keep-all')
  })

  it('가장 작은 크기로도 넘치면 … 로 자른다', () => {
    expect(fitOgTitle(sentence).text.endsWith('…')).toBe(true)
    expect(fitOgTitle(sentence).fontSize).toBe(44)
  })

  it('짧은 제목은 그대로 가장 큰 크기다', () => {
    // lines 는 줄바꿈 여유(1.1배)를 둔 어림이라 실제보다 크게 나올 수 있다
    expect(fitOgTitle('이 블로그를 어떻게 만들었나')).toMatchObject({ text: '이 블로그를 어떻게 만들었나', fontSize: 76, wordBreak: 'keep-all' })
  })

  it('제목 상자는 세 줄 높이를 넘으면 잘라 날짜 줄을 덮지 않는다', () => {
    const card = postCard({ title: sentence, date: '2026-10-20T12:00:00+09:00', locale: 'ko' })
    const children = card.props.children as OgNode[]
    expect(children[1].props.style).toMatchObject({ overflow: 'hidden', maxHeight: Math.ceil(44 * 1.3 * 3) })
  })
})
