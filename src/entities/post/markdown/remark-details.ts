import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import { visit } from 'unist-util-visit'

// :::details 블록을 첫 문단이 요약 줄인 <details> 로 바꾼다
export function remarkDetails() {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (node.name !== 'details') return
      const summary = node.children[0]
      if (summary?.type !== 'paragraph') throw new Error(':::details 는 첫 문단(요약 줄)이 있어야 합니다')
      summary.data = { hName: 'summary' }
      node.data = { hName: 'details', hProperties: { className: ['details'] } }
    })
  }
}
