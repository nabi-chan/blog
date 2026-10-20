import { describe, expect, it } from 'vitest'
import { discoveryLinks, markdownAlternate, prefersMarkdown } from './markdown-negotiation'

describe('prefersMarkdown', () => {
  it('Accept 에 text/markdown 이 있고 HTML 보다 낮지 않으면 Markdown 을 준다', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true)
    expect(prefersMarkdown('text/markdown, text/html;q=0.9')).toBe(true)
    expect(prefersMarkdown('text/html;q=0.5, text/markdown;q=0.5')).toBe(true)
    expect(prefersMarkdown('text/markdown, */*;q=0.1')).toBe(true)
  })

  it('브라우저·기본 클라이언트·HTML 을 더 원하는 요청은 HTML 이다', () => {
    expect(prefersMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')).toBe(false)
    expect(prefersMarkdown('*/*')).toBe(false)
    expect(prefersMarkdown(null)).toBe(false)
    expect(prefersMarkdown('text/html, text/markdown;q=0.5')).toBe(false)
    expect(prefersMarkdown('text/markdown;q=0')).toBe(false)
    expect(prefersMarkdown('text/*;q=0.9, text/markdown;q=0.5')).toBe(false)
  })
})

describe('markdownAlternate', () => {
  it('글은 .md 원문, 홈은 llms.txt 로 바꾼다', () => {
    expect(markdownAlternate('/')).toBe('/llms.txt')
    expect(markdownAlternate('/en')).toBe('/en/llms.txt')
    expect(markdownAlternate('/261020')).toBe('/261020.md')
    expect(markdownAlternate('/261020-hello-world')).toBe('/261020-hello-world.md')
    expect(markdownAlternate('/en/261020')).toBe('/en/261020.md')
  })

  it('그 밖의 경로는 대상이 아니다', () => {
    for (const path of ['/posts', '/en/posts', '/261020.md', '/api/me', '/en/', '/2610201', '/assets/a.js']) expect(markdownAlternate(path)).toBeNull()
  })
})

describe('discoveryLinks', () => {
  it('홈은 Markdown 원문(llms.txt)·RSS·sitemap 을, 글은 .md 원문을 Link 헤더로 알린다', () => {
    expect(discoveryLinks('/')).toBe(
      '</llms.txt>; rel="alternate"; type="text/markdown", </rss.xml>; rel="alternate"; type="application/rss+xml", </sitemap.xml>; rel="sitemap"',
    )
    expect(discoveryLinks('/en')).toBe(
      '</en/llms.txt>; rel="alternate"; type="text/markdown", </en/rss.xml>; rel="alternate"; type="application/rss+xml", </sitemap.xml>; rel="sitemap"',
    )
    expect(discoveryLinks('/261020')).toBe('</261020.md>; rel="alternate"; type="text/markdown"')
    expect(discoveryLinks('/en/261020')).toBe('</en/261020.md>; rel="alternate"; type="text/markdown"')
  })

  it('홈·글이 아니면 없다', () => {
    expect(discoveryLinks('/posts')).toBeNull()
  })
})
