import { SLUG_PATTERN } from '../content/constants'

type MediaRange = { type: string; q: number }

const parseAccept = (accept: string): MediaRange[] =>
  accept.split(',').map((part) => {
    const [type = '', ...params] = part.split(';').map((piece) => piece.trim())
    const q = params.find((param) => param.startsWith('q='))
    return { type: type.toLowerCase(), q: q === undefined ? 1 : Number(q.slice(2)) }
  })

// Accept 에 text/markdown 을 직접 적었고 HTML 보다 낮게 두지 않은 요청만 Markdown 을 받는다.
// */* 만 보내는 기본 클라이언트(curl, 크롤러)와 브라우저는 그대로 HTML 이다. HTML 의 q 는 가장 구체적인 범위를 따른다
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false
  const ranges = parseAccept(accept)
  const markdown = ranges.find((range) => range.type === 'text/markdown')
  if (!markdown || !(markdown.q > 0)) return false
  const html = ranges.find((range) => range.type === 'text/html') ?? ranges.find((range) => range.type === 'text/*') ?? ranges.find((range) => range.type === '*/*')
  return markdown.q >= (html?.q ?? 0)
}

// Markdown 으로 줄 수 있는 페이지와 그 원문 파일. 글은 .md 원문, 홈은 llms.txt 다
export function markdownAlternate(pathname: string): string | null {
  if (pathname === '/') return '/llms.txt'
  if (pathname === '/en') return '/en/llms.txt'
  const english = pathname.startsWith('/en/')
  const slug = english ? pathname.slice(4) : pathname.slice(1)
  return SLUG_PATTERN.test(slug) ? `${english ? '/en/' : '/'}${slug}.md` : null
}

const markdownLink = (path: string) => `<${path}>; rel="alternate"; type="text/markdown"`

// HTML 응답에 다는 Link 헤더(RFC 8288). HTML 을 읽지 않는 에이전트도 원문·피드·sitemap 을 찾게 한다
export function discoveryLinks(pathname: string): string | null {
  const alternate = markdownAlternate(pathname)
  if (alternate === null) return null
  if (!alternate.endsWith('/llms.txt')) return markdownLink(alternate)
  const prefix = pathname === '/en' ? '/en' : ''
  return [markdownLink(alternate), `<${prefix}/rss.xml>; rel="alternate"; type="application/rss+xml"`, '</sitemap.xml>; rel="sitemap"'].join(', ')
}
