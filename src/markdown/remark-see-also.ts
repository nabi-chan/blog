import type { Paragraph, Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import { visit } from 'unist-util-visit'

const KINDS = new Set(['paper', 'docs', 'repo', 'article'])
const KIND_MARKER = /^\[(\w+)\]\s*/

// :::see-also 목록을 펼쳐진 접기 블록으로 만든다. 항목 앞 [paper] 같은 표지는 data-kind 로 옮긴다
export function remarkSeeAlso() {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (node.name !== 'see-also') return
      visit(node, 'list', (list) => {
        list.data = { hProperties: { className: ['see-also-list'] } }
        for (const item of list.children) {
          let kind = 'link'
          const paragraph = item.children[0]
          const first = paragraph?.type === 'paragraph' ? paragraph.children[0] : undefined
          const match = first?.type === 'text' ? KIND_MARKER.exec(first.value) : null
          if (first?.type === 'text' && match) {
            const marker = match[1].toLowerCase()
            if (KINDS.has(marker)) {
              kind = marker
              first.value = first.value.slice(match[0].length)
              if (first.value === '' && paragraph?.type === 'paragraph') paragraph.children.shift()
            }
          }
          item.data = { hProperties: { dataKind: kind } }
        }
      })
      const summary: Paragraph = { type: 'paragraph', children: [{ type: 'text', value: 'See Also' }], data: { hName: 'summary' } }
      node.children.unshift(summary)
      node.data = { hName: 'details', hProperties: { open: true, className: ['see-also'] } }
    })
  }
}
