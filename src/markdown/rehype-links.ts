import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'
import type { Locale } from '~/i18n/runtime'
import { resolvePostLink } from './link'

// 본문 링크를 글 언어에 맞추고, 외부 링크만 새 탭으로 연다
export function rehypeLinks(opts: { locale: Locale; enSlugs: ReadonlySet<string> }) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a' || typeof node.properties.href !== 'string') return
      const link = resolvePostLink(node.properties.href, opts.locale, opts.enSlugs)
      node.properties.href = link.href
      if (link.hrefLang) node.properties.hrefLang = link.hrefLang
      if (link.external) {
        node.properties.target = '_blank'
        node.properties.rel = ['noopener']
      }
    })
  }
}
