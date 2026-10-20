import type { Definition, Image, Root } from 'mdast'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

const parse = (markdown: string): Root => unified().use(remarkParse).use(remarkGfm, { singleTilde: false }).use(remarkDirective).parse(markdown)

// 글 원문(.md, llms-full)에 싣는 Markdown. 글 옆 이미지 경로만 절대 URL 로 바꾸고 나머지 글자는 그대로 둔다 (스펙 4.9).
// 다시 직렬화하면 서식이 바뀌므로 파서가 알려 준 위치에서 경로 글자만 갈아 끼운다
export function absolutizeMarkdownImages(markdown: string, images: Record<string, string>, origin: string): string {
  const edits: Array<{ start: number; end: number; url: string }> = []
  visit(parse(markdown), ['image', 'definition'], (node) => {
    const { url, position } = node as Image | Definition
    const target = images[url]
    if (target === undefined || position?.start.offset === undefined || position.end.offset === undefined) return
    const raw = markdown.slice(position.start.offset, position.end.offset)
    // 이미지는 '](' 뒤, 정의는 ']:' 뒤에서 경로를 찾는다 (대체 텍스트에 같은 글자가 있어도 건너뛴다)
    const marker = node.type === 'image' ? raw.indexOf('](') : raw.indexOf(']:')
    const at = raw.indexOf(url, marker + 2)
    if (marker === -1 || at === -1) return
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
