import { describe, expect, it } from 'vitest'
import { OG_SIZE, type OgNode, ogTitleFontSize, postCard, siteCard } from './card'

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
