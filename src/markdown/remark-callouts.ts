import type { Blockquote, Paragraph, Root } from 'mdast'
import { visit } from 'unist-util-visit'
import type { Locale } from '~/i18n/runtime'

const LABELS = {
  note: { ko: '참고', en: 'Note' },
  tip: { ko: '팁', en: 'Tip' },
  important: { ko: '중요', en: 'Important' },
  warning: { ko: '주의', en: 'Warning' },
  caution: { ko: '경고', en: 'Caution' },
} as const

type CalloutType = keyof typeof LABELS
const MARKER = /^\[!(\w+)\][ \t]*\n?/

const isCalloutType = (value: string): value is CalloutType => value in LABELS

// GitHub 알림 문법(> [!TIP])을 <aside class="callout"> 로 바꾼다. 모르는 종류는 인용으로 둔다
export function remarkCallouts(opts: { locale: Locale }) {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const first = node.children[0]
      if (first?.type !== 'paragraph') return
      const text = first.children[0]
      if (text?.type !== 'text') return
      const match = MARKER.exec(text.value)
      const type = match?.[1].toLowerCase()
      if (!match || !type || !isCalloutType(type)) return

      text.value = text.value.slice(match[0].length)
      if (text.value === '') first.children.shift()
      if (first.children.length === 0) node.children.shift()

      const title: Paragraph = {
        type: 'paragraph',
        children: [{ type: 'text', value: LABELS[type][opts.locale] }],
        data: { hProperties: { className: ['callout-title'] } },
      }
      node.children.unshift(title)
      node.data = { hName: 'aside', hProperties: { className: ['callout'], dataCallout: type, role: 'note' } }
    })
  }
}
