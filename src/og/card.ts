import { formatDate } from '~/content/date'
import type { Locale } from '~/i18n/runtime'
import { site } from '~/site'

// satori 에 넘길 요소 트리. JSX 없이 { type, props } 객체로 만든다
export type OgNode = { type: string; props: { style?: Record<string, string | number>; children?: OgNode | string | Array<OgNode | string> } }

export const OG_SIZE = { width: 1200, height: 630 } as const

const PADDING = 80
const INNER_WIDTH = OG_SIZE.width - PADDING * 2
const TITLE_SIZES = [76, 68, 60, 52, 44] as const
const MAX_TITLE_LINES = 3
// keep-all 줄바꿈은 단어 단위로 끊어서 어림보다 줄이 늘어난다. 그만큼 여유를 둔다
const WRAP_SLACK = 1.1
const WIDE = /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}＀-￯]/u

const DOMAIN = new URL(site.url).host

const el = (type: string, style: Record<string, string | number>, children?: OgNode['props']['children']): OgNode => ({
  type,
  props: { style: { display: 'flex', ...style }, children },
})

// 제목 폭을 어림해서(한글·한자·전각 1em, 그 밖 0.55em) 세 줄 안에 드는 가장 큰 글자 크기를 고른다 (스펙 4.9)
export function ogTitleFontSize(title: string): number {
  const ems = [...title].reduce((sum, char) => sum + (WIDE.test(char) ? 1 : 0.55), 0)
  return TITLE_SIZES.find((size) => Math.ceil(((ems * size) / INNER_WIDTH) * WRAP_SLACK) <= MAX_TITLE_LINES) ?? TITLE_SIZES.at(-1)!
}

// 흰 바탕 무채색 타이포 카드. satori 는 padding 을 크기 밖에 더하므로 border-box 를 꼭 준다
const frame = (children: OgNode[]): OgNode =>
  el(
    'div',
    {
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      boxSizing: 'border-box',
      padding: PADDING,
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: '#ffffff',
      color: '#000000',
      fontFamily: 'SUIT',
    },
    children,
  )

const footer = (left: string): OgNode =>
  el('div', { width: INNER_WIDTH, justifyContent: 'space-between', fontSize: 26, color: '#707070' }, [el('span', {}, left), el('span', {}, DOMAIN)])

export function postCard(input: { title: string; date: string; locale: Locale }): OgNode {
  return frame([
    el('div', { fontSize: 28, fontWeight: 700 }, site.name),
    // 긴 라틴 단어가 여백을 넘지 않게 명시 폭을 준다
    el('div', { width: INNER_WIDTH, fontSize: ogTitleFontSize(input.title), fontWeight: 700, lineHeight: 1.3, wordBreak: 'keep-all' }, input.title),
    footer(formatDate(input.date, input.locale)),
  ])
}

export function siteCard(input: { locale: Locale; description: string }): OgNode {
  return frame([
    el('div', {}, ''),
    el('div', { flexDirection: 'column', width: INNER_WIDTH, gap: 20 }, [
      el('div', { fontSize: 96, fontWeight: 700 }, site.name),
      el('div', { fontSize: 36, color: '#707070', wordBreak: 'keep-all' }, input.description),
    ]),
    footer(site.author),
  ])
}
