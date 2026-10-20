import type { Element, ElementContent, Root } from 'hast'
import { visit } from 'unist-util-visit'

const isBlank = (node: ElementContent) => node.type === 'text' && node.value.trim() === ''

function findImage(node: Element): Element | undefined {
  if (node.tagName === 'img') return node
  if (node.tagName === 'picture') return node.children.find((child): child is Element => child.type === 'element' && child.tagName === 'img')
  return undefined
}

// 문단에 이미지(또는 picture) 하나만 있고 title 이 있으면 figure + figcaption 으로 바꾼다
export function rehypeFigure() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) return
      const content = node.children.filter((child) => !isBlank(child))
      const only = content[0]
      if (content.length !== 1 || only.type !== 'element') return
      const img = findImage(only)
      const caption = img?.properties.title
      if (!img || typeof caption !== 'string' || caption === '') return

      delete img.properties.title
      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children: [only, { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] }],
      }
    })
  }
}
