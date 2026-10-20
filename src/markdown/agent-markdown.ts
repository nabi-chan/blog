import type { Definition, Image, Root } from 'mdast'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { decodePath } from './rehype-local-images'

const parse = (markdown: string): Root => unified().use(remarkParse).use(remarkGfm, { singleTilde: false }).use(remarkDirective).parse(markdown)

const NOT_LOCAL = /^(?:\/|[a-z][a-z0-9+.-]*:)/i

// 글 원문(.md, llms-full)에 싣는 Markdown. 글 옆 이미지 경로만 절대 URL 로 바꾸고 나머지 글자는 그대로 둔다 (스펙 4.9).
// 다시 직렬화하면 서식이 바뀌므로 파서가 알려 준 위치에서 경로 글자만 갈아 끼운다.
// images 의 키는 디코딩한 경로라 원문 표기(%20, <공백>, 한글)와 상관없이 찾는다.
// 글 옆 이미지를 바꾸지 못하면 깨진 상대 경로가 밖으로 나가므로 빌드를 멈춘다
export function absolutizeMarkdownImages(markdown: string, images: Record<string, string>, origin: string): string {
  const edits: Array<{ start: number; end: number; url: string }> = []
  visit(parse(markdown), ['image', 'definition'], (node) => {
    const { url, position } = node as Image | Definition
    const target = images[decodePath(url)]
    const local = node.type === 'image' && !NOT_LOCAL.test(url)
    const fail = () => {
      throw new Error(`${url}: 글 옆 이미지 경로를 절대 URL 로 바꾸지 못했습니다`)
    }
    if (target === undefined || position?.start.offset === undefined || position.end.offset === undefined) {
      if (local) fail()
      return
    }
    const raw = markdown.slice(position.start.offset, position.end.offset)
    // 이미지는 '](' 뒤, 정의는 ']:' 뒤에서 경로를 찾는다 (대체 텍스트에 같은 글자가 있어도 건너뛴다)
    const marker = node.type === 'image' ? raw.indexOf('](') : raw.indexOf(']:')
    const at = marker === -1 ? -1 : raw.indexOf(url, marker + 2)
    if (at === -1) return fail()
    edits.push({ start: position.start.offset + at, end: position.start.offset + at + url.length, url: new URL(target, origin).href })
  })
  return edits
    .sort((a, b) => b.start - a.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.url + text.slice(edit.end), markdown)
}

// BlogPosting.wordCount 용. 블록 사이를 띄어서 글자 노드를 모은 뒤 공백으로 나눈다
export function countWords(markdown: string): number {
  const parts: string[] = []
  visit(parse(markdown), ['text', 'inlineCode', 'code'], (node) => {
    parts.push((node as { value: string }).value)
  })
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}
