// vite.config(ogSitePlugin)가 불러서 경로 별칭(~/) 대신 상대 경로를 쓴다
import { formatDate } from '../shared/lib/date/index.ts'
import type { Locale } from '../shared/i18n/index.ts'
import { site } from '../shared/config/index.ts'

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

const LINE_HEIGHT = 1.3
// 이보다 넓은 공백 없는 토큰(긴 라틴 단어, 띄어쓰기 없는 한글)이 있으면 넘칠 때 단어 안에서 끊는다.
// keep-all 은 그런 토큰을 끊지 못하고, satori 는 keep-all 에서 라틴 글자 사이의 U+200B 도 무시한다 (렌더로 확인)
const TOKEN_EMS = 10

const charEms = (char: string) => (WIDE.test(char) ? 1 : 0.55)
const ems = (text: string) => [...text].reduce((sum, char) => sum + charEms(char), 0)
const linesAt = (width: number, size: number) => Math.ceil(((width * size) / INNER_WIDTH) * WRAP_SLACK)

export type OgTitle = { text: string; fontSize: number; lines: number; wordBreak: 'keep-all' | 'break-word' }

// 제목 폭을 어림해서(한글·한자·전각 1em, 그 밖 0.55em) 세 줄 안에 드는 가장 큰 글자 크기를 고른다 (스펙 4.9).
// 가장 작은 크기로도 넘치면 세 줄에 들 만큼 잘라 … 를 붙인다. lines 는 줄바꿈 여유를 둔 어림이다
export function fitOgTitle(title: string): OgTitle {
  const wordBreak = title.split(/\s+/).some((token) => ems(token) > TOKEN_EMS) ? 'break-word' : 'keep-all'
  const width = ems(title)
  const size = TITLE_SIZES.find((candidate) => linesAt(width, candidate) <= MAX_TITLE_LINES)
  if (size !== undefined) return { text: title, fontSize: size, lines: linesAt(width, size), wordBreak }
  const smallest = TITLE_SIZES.at(-1)!
  const budget = (MAX_TITLE_LINES * INNER_WIDTH) / (smallest * WRAP_SLACK) - charEms('…')
  let cut = ''
  for (const char of title) {
    if (ems(cut + char) > budget) break
    cut += char
  }
  const text = `${cut.trimEnd()}…`
  return { text, fontSize: smallest, lines: linesAt(ems(text), smallest), wordBreak }
}

export function ogTitleFontSize(title: string): number {
  return fitOgTitle(title).fontSize
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

// 명시 폭을 줘야 줄이 바뀐다. 어림이 빗나가도 날짜 줄을 덮지 않게 세 줄 높이에서 자른다
function titleBox(title: string): OgNode {
  const { text, fontSize, wordBreak } = fitOgTitle(title)
  return el(
    'div',
    {
      width: INNER_WIDTH,
      maxHeight: Math.ceil(fontSize * LINE_HEIGHT * MAX_TITLE_LINES),
      overflow: 'hidden',
      fontSize,
      fontWeight: 700,
      lineHeight: LINE_HEIGHT,
      wordBreak,
    },
    text,
  )
}

export function postCard(input: { title: string; date: string; locale: Locale }): OgNode {
  return frame([
    el('div', { fontSize: 28, fontWeight: 700 }, site.name),
    titleBox(input.title),
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
