import type { Root, RootContent } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import type { Locale } from '~/i18n/runtime'

const ERROR = '::::quote 에는 비어 있지 않은 :::translation 과 :::original 이 하나씩 있어야 합니다'

const isDirective = (node: RootContent, name: string): node is ContainerDirective =>
  node.type === 'containerDirective' && node.name === name

// 원문·번역 병기 인용. 글 언어와 원문 언어가 같으면 원문만 보여준다
export function remarkQuote(opts: { locale: Locale }) {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (node.name !== 'quote') return
      const translations = node.children.filter((child) => isDirective(child, 'translation'))
      const originals = node.children.filter((child) => isDirective(child, 'original'))
      const [translation] = translations
      const [original] = originals
      if (
        translations.length !== 1 ||
        originals.length !== 1 ||
        !translation ||
        !original ||
        toString(translation).trim() === '' ||
        toString(original).trim() === ''
      ) {
        throw new Error(ERROR)
      }

      const originalLang = original.attributes?.lang ?? 'en'
      translation.data = { hName: 'div', hProperties: { className: ['quote-translation'], lang: opts.locale } }
      original.data = { hName: 'div', hProperties: { className: ['quote-original'], lang: originalLang } }
      node.children = opts.locale === originalLang ? [original] : [translation, original]
      node.data = { hName: 'blockquote', hProperties: { className: ['bilingual-quote'] } }
      return 'skip'
    })
  }
}
