import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import { visit } from 'unist-util-visit'

const PREFIX = 'widget-'

// :::widget-<이름> 을 브라우저가 컴포넌트를 붙일 자리로 바꾼다. 블록 안 내용은 대체 콘텐츠로 남긴다
export function remarkWidget(opts: { names: readonly string[] }) {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (!node.name.startsWith(PREFIX)) return
      const name = node.name.slice(PREFIX.length)
      if (!opts.names.includes(name)) throw new Error(`등록되지 않은 위젯입니다: ${node.name} (src/widgets/names.ts)`)
      node.data = { hName: 'div', hProperties: { className: ['widget'], dataWidget: name } }
    })
  }
}
