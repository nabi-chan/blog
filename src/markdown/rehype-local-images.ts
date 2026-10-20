import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'
import type { Element, Root } from 'hast'
import { imageSize } from 'image-size'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import { BODY_MAX_WIDTH, CONTENT_VW, IMAGE_VARIANT_WIDTHS, SPLIT_MIN_VIEWPORT } from '../content/constants'
import type { Asset } from './render'

declare module 'vfile' {
  interface DataMap {
    assets: Asset[]
    // 본문에 쓴 src(퍼센트 디코딩, '?w=' 포함) → 공개 경로. .md 원문의 이미지 경로를 바꿀 때 쓴다
    images: Record<string, string>
  }
}

const NOT_LOCAL = /^(?:\/|[a-z][a-z0-9+.-]*:)/i
const VARIANT_SOURCE = /\.(png|jpe?g)$/i

// draw.io 처럼 루트 태그에 큰 속성을 싣는 SVG 는 image-size 가 판별하지 못하므로 루트 태그에서 직접 읽는다
export function svgSize(source: string): { width?: number; height?: number } {
  const root = /<svg\b[\s\S]*?>/.exec(source)?.[0] ?? ''
  const attr = (name: string) => Number(new RegExp(`\\s${name}="([\\d.]+)(?:px)?"`).exec(root)?.[1])
  const width = attr('width')
  const height = attr('height')
  if (width && height) return { width: Math.round(width), height: Math.round(height) }
  const viewBox = /\sviewBox="([^"]+)"/.exec(root)?.[1]?.trim().split(/[\s,]+/)
  if (viewBox?.length === 4) return { width: Math.round(Number(viewBox[2])), height: Math.round(Number(viewBox[3])) }
  return {}
}

// 휴대폰 사진은 EXIF 회전값(5~8)이면 가로세로가 바뀌어 보인다. 보이는 크기를 돌려준다
function readSize(buffer: Buffer, path: string, src: string): { width: number; height: number } {
  const size: { width?: number; height?: number; orientation?: number } =
    extname(path).toLowerCase() === '.svg' ? svgSize(buffer.toString('utf8')) : imageSize(buffer)
  if (!size.width || !size.height) throw new Error(`${src}: 이미지 크기를 읽을 수 없습니다`)
  return (size.orientation ?? 1) >= 5 ? { width: size.height, height: size.width } : { width: size.width, height: size.height }
}

// 공개 파일 이름은 URL·srcset 에 안전한 ASCII 로 만든다 (srcset 은 공백으로 후보를 나눈다)
function publicStem(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image'
  )
}

// remark-rehype 는 src 를 퍼센트 인코딩한다(한글·공백). 파일을 찾을 때는 되돌린다
export function decodePath(path: string): string {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

function parseSrc(src: string): { path: string; cap: number | null } {
  const cut = src.indexOf('?')
  if (cut === -1) return { path: src, cap: null }
  const width = new URLSearchParams(src.slice(cut + 1)).get('w') ?? new URLSearchParams(src.slice(cut + 1)).get('width')
  return { path: src.slice(0, cut), cap: width && /^\d+$/.test(width) ? Number(width) : null }
}

// 본문 폭은 넓은 화면(목차를 옆에 두는 레이아웃)에서 최대 920px, 그보다 좁으면 90vw 다.
// ?w= 가 있으면 그 폭을 넘지 않는다
function sizesFor(cap: number | null): string {
  if (cap === null || cap >= BODY_MAX_WIDTH) {
    return `(max-width: ${SPLIT_MIN_VIEWPORT - 1}px) ${CONTENT_VW}vw, ${BODY_MAX_WIDTH}px`
  }
  const breakpoint = Math.ceil(cap / (CONTENT_VW / 100))
  return `(max-width: ${breakpoint}px) ${CONTENT_VW}vw, ${cap}px`
}

// 글 옆 이미지를 해시 이름의 공개 경로로 바꾸고, 크기·로딩 우선순위·WebP 사본을 붙인다.
// 실제 파일 복사는 writeAssets 가 한다 (file.data.assets)
export function rehypeLocalImages(opts: { filePath: string; slug: string }) {
  return (tree: Root, file: VFile) => {
    const assets = new Map<string, Asset>()
    const images: Record<string, string> = {}
    let index = 0

    visit(tree, 'element', (node: Element, position, parent) => {
      if (node.tagName !== 'img' || typeof node.properties.src !== 'string') return
      const src = node.properties.src
      const alt = node.properties.alt
      if (typeof alt !== 'string' || alt.trim() === '') {
        console.warn(`[이미지] alt 텍스트가 없습니다 (${opts.slug}): ${src}`)
      }

      let picture: Element | undefined
      if (!NOT_LOCAL.test(src)) {
        const { path, cap } = parseSrc(src)
        const from = resolve(dirname(opts.filePath), decodePath(path))
        if (!existsSync(from)) throw new Error(`${src}: 이미지 파일을 찾을 수 없습니다 (${opts.filePath})`)
        const buffer = readFileSync(from)
        const { width, height } = readSize(buffer, from, src)
        const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 8)
        const ext = extname(from)
        const stem = `${publicStem(basename(from, ext))}.${hash}`
        const to = `public/content-assets/${opts.slug}/${stem}${ext}`
        assets.set(to, { kind: 'copy', from, to })

        const { title } = node.properties
        // 키는 디코딩한 src 다. 여기 src 는 remark-rehype 가 퍼센트 인코딩한 값이라 원문 표기(한글·공백·<>)와 다르다
        const publicPath = `/content-assets/${opts.slug}/${stem}${ext}`
        images[decodePath(src)] = publicPath
        node.properties = { src: publicPath, alt: node.properties.alt, width, height }
        if (title !== undefined) node.properties.title = title
        if (cap !== null) node.properties.style = `max-width:min(${cap}px, 100%);height:auto;`

        if (VARIANT_SOURCE.test(ext)) {
          const widths = [...IMAGE_VARIANT_WIDTHS.filter((w) => w < width), width]
          const srcset = widths.map((w) => {
            const variant = `public/content-assets/${opts.slug}/${stem}.${w}w.webp`
            assets.set(variant, { kind: 'webp', from, to: variant, width: w })
            return `/content-assets/${opts.slug}/${stem}.${w}w.webp ${w}w`
          })
          picture = {
            type: 'element',
            tagName: 'picture',
            properties: {},
            children: [
              { type: 'element', tagName: 'source', properties: { type: 'image/webp', srcSet: srcset.join(', '), sizes: sizesFor(cap) }, children: [] },
              node,
            ],
          }
        }
      }

      // 첫 이미지는 LCP 후보라 바로 받고, 나머지는 늦게 받는다
      node.properties.loading = index === 0 ? 'eager' : 'lazy'
      node.properties.fetchPriority = index === 0 ? 'high' : 'low'
      node.properties.decoding = 'async'
      index += 1

      if (picture && parent && position !== undefined) {
        parent.children[position] = picture
        return 'skip'
      }
    })

    file.data.assets = [...assets.values()]
    file.data.images = images
  }
}
