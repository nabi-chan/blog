// scripts/content-check.ts 가 Node 로 바로 불러서 패키지와 상대 경로만 import 한다
import type { Blockquote, Code, Definition, Heading, Image, Link, Root, Text } from 'mdast'
import type { ContainerDirective, LeafDirective, TextDirective } from 'mdast-util-directive'
import { toString } from 'mdast-util-to-string'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

// 번역본이 원문과 같은 뼈대인지 보는 항목 (스펙 5.2 translate-post 3단계).
// 글자(문단, 링크 글자, 대체 텍스트, Callout 본문, 코드 주석)는 번역하므로 보지 않는다
export type Structure = {
  headings: number[]
  links: string[]
  images: string[]
  callouts: string[]
  code: Array<string | null>
  directives: string[]
  terms: string[]
  originals: string[]
}

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/
const CALLOUT = /^\[!(\w+)\]/
const EXTERNAL = /^[a-z][a-z0-9+.-]*:/i

const parse = (markdown: string): Root =>
  unified().use(remarkParse).use(remarkGfm, { singleTilde: false }).use(remarkDirective).parse(markdown.replace(FRONTMATTER, ''))

// 사이트 내부 링크의 #앵커는 헤딩을 번역하면 달라지므로 뺀다
const linkTarget = (url: string) => (EXTERNAL.test(url) ? url : url.replace(/#.*$/, ''))

export function translationStructure(markdown: string): Structure {
  const structure: Structure = { headings: [], links: [], images: [], callouts: [], code: [], directives: [], terms: [], originals: [] }
  visit(parse(markdown), (node) => {
    switch (node.type) {
      case 'heading':
        structure.headings.push((node as Heading).depth)
        break
      case 'link':
      case 'definition':
        structure.links.push(linkTarget((node as Link | Definition).url))
        break
      case 'image':
        structure.images.push((node as Image).url)
        break
      case 'blockquote': {
        const first = (node as Blockquote).children[0]
        const text = first?.type === 'paragraph' ? (first.children[0] as Text | undefined) : undefined
        const type = text?.type === 'text' ? CALLOUT.exec(text.value)?.[1] : undefined
        if (type) structure.callouts.push(type.toLowerCase())
        break
      }
      case 'code':
        structure.code.push((node as Code).lang ?? null)
        break
      case 'containerDirective':
      case 'leafDirective': {
        const directive = node as ContainerDirective | LeafDirective
        structure.directives.push(directive.name)
        if (directive.name === 'original') structure.originals.push(toString(directive))
        break
      }
      case 'textDirective': {
        const directive = node as TextDirective
        if (directive.name === 'term') structure.terms.push(directive.attributes?.key ?? '')
        break
      }
    }
  })
  return structure
}

const list = (values: Array<string | number | null>) => `[${values.map(String).join(', ')}]`
const same = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b)

// 다른 항목마다 한국어 한 줄. 빈 배열이면 같은 뼈대다
export function compareStructure(ko: Structure, en: Structure): string[] {
  const problems: string[] = []
  const check = (label: string, a: Array<string | number | null>, b: Array<string | number | null>) => {
    if (!same(a, b)) problems.push(`${label}가 다릅니다: ko ${list(a)} / en ${list(b)}`) // 항목 이름이 모두 받침 없이 끝난다
  }
  check('헤딩 깊이', ko.headings, en.headings)
  check('링크 목적지', ko.links, en.links)
  check('이미지 경로', ko.images, en.images)
  check('Callout 종류', ko.callouts, en.callouts)
  if (ko.code.length !== en.code.length) problems.push(`코드 블록 개수가 다릅니다: ko ${ko.code.length} / en ${en.code.length}`)
  else check('코드 블록 언어', ko.code, en.code)
  check('디렉티브 구조', ko.directives, en.directives)
  if (!same(ko.terms, en.terms)) problems.push(`:term key 가 다릅니다: ko ${list(ko.terms)} / en ${list(en.terms)}`)
  if (!same(ko.originals, en.originals)) problems.push(':::original 원문이 다릅니다')
  return problems
}
