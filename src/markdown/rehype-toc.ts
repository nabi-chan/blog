import type { Element, Root } from 'hast'
import { toString } from 'hast-util-to-string'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

export type TocItem = { depth: 2 | 3; id: string; text: string }

declare module 'vfile' {
  interface DataMap {
    toc: TocItem[]
  }
}

// rehype-slug 가 단 id 로 h2·h3 목차를 만든다. 앵커 링크로 감싸기 전에 돌아야 텍스트가 깨끗하다
export function rehypeToc() {
  return (tree: Root, file: VFile) => {
    const toc: TocItem[] = []
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return
      const id = node.properties.id
      if (typeof id !== 'string') return
      toc.push({ depth: node.tagName === 'h2' ? 2 : 3, id, text: toString(node) })
    })
    file.data.toc = toc
  }
}
