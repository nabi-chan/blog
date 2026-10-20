import type { Root, Text } from 'mdast'
import type { ContainerDirective, LeafDirective, TextDirective } from 'mdast-util-directive'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

const KNOWN_CONTAINERS = new Set(['details', 'see-also', 'quote', 'translation', 'original'])
const KNOWN_TEXT = new Set(['term'])

const isKnownContainer = (name: string) => KNOWN_CONTAINERS.has(name) || name.startsWith('widget-')

// remark-directive 는 본문의 'key:value' 같은 표현도 디렉티브로 읽어 글자를 지운다.
// 모르는 텍스트·리프 디렉티브는 원문 그대로 되살리고, 모르는 블록(오타)은 빌드를 멈춘다
export function remarkDirectiveGuard() {
  return (tree: Root, file: VFile) => {
    const source = String(file.value)
    visit(tree, (node, index, parent) => {
      if (node.type === 'containerDirective') {
        const { name } = node as ContainerDirective
        if (!isKnownContainer(name)) throw new Error(`알 수 없는 블록 :::${name} (${file.path ?? '알 수 없는 파일'})`)
        return
      }
      if (node.type !== 'textDirective' && node.type !== 'leafDirective') return
      const directive = node as TextDirective | LeafDirective
      if (directive.type === 'textDirective' && KNOWN_TEXT.has(directive.name)) return
      if (!parent || index === undefined || !directive.position) return
      const { start, end } = directive.position
      const text: Text = { type: 'text', value: source.slice(start.offset, end.offset) }
      // 리프 디렉티브는 블록이라 문단으로 감싼다
      parent.children[index] = directive.type === 'leafDirective' ? { type: 'paragraph', children: [text] } : text
      return 'skip'
    })
  }
}
