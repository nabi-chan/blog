import type { Root } from 'mdast'
import type { TextDirective } from 'mdast-util-directive'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import type { Locale } from '~/shared/i18n'
import { KEY_PATTERN } from '../../../shared/config'

export type GlossaryEntry = { name: string; definition: string }
export type Glossary = Record<string, Record<Locale, GlossaryEntry>>

declare module 'vfile' {
  interface DataMap {
    terms: string[]
  }
}

// :term[라벨]{key="…"} 를 용어집 키가 붙은 span 으로 바꾼다. 정의는 화면에서 툴팁으로 붙인다
export function remarkTerm(opts: { locale: Locale; glossary: Glossary }) {
  return (tree: Root, file: VFile) => {
    const used: string[] = []
    visit(tree, 'textDirective', (node: TextDirective) => {
      if (node.name !== 'term') return
      const label = toString(node).trim()
      const attributes = node.attributes ?? {}
      const key = attributes.key
      if (!label || Object.keys(attributes).length !== 1 || typeof key !== 'string' || !KEY_PATTERN.test(key)) {
        throw new Error(`:term 형식이 틀렸습니다 (${file.path ?? '알 수 없는 파일'}): :term[라벨]{key="kebab-case"}`)
      }
      if (!opts.glossary[key]?.[opts.locale]) throw new Error(`용어집에 없는 키입니다: ${key} (content/glossary.yaml)`)
      if (!used.includes(key)) used.push(key)
      node.children = [{ type: 'text', value: label }]
      node.data = { hName: 'span', hProperties: { className: ['term'], dataTermKey: key, tabIndex: 0 } }
    })
    file.data.terms = used
  }
}
