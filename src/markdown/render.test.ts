import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './render'

const opts = { filePath: '/tmp/x/index.ko.md', slug: 'x', locale: 'ko', enSlugs: new Set<string>() } as const

describe('renderMarkdown', () => {
  it('헤딩 id·목차·앵커·하이라이팅을 만든다', async () => {
    const r = await renderMarkdown(
      '## 소개\n\n### `code` 예시\n\n## 소개\n\n#### 깊은 제목\n\n```ts\nconst a = 1\n```',
      opts,
    )
    expect(r.toc).toEqual([
      { depth: 2, id: '소개', text: '소개' },
      { depth: 3, id: 'code-예시', text: 'code 예시' },
      { depth: 2, id: '소개-1', text: '소개' },
    ])
    expect(r.html).toContain('<h2 id="소개"><a href="#소개">소개</a></h2>')
    expect(r.html).toContain('<h3 id="code-예시">')
    expect(r.html).toContain('<h2 id="소개-1">')
    expect(r.html).toMatch(/<h4 id="[^"]+">/)
    expect(r.html).toContain('data-rehype-pretty-code')
    expect(r.assets).toEqual([])
  })

  it('물결 하나는 취소선이 아니고, 두 개만 취소선이다', async () => {
    const r = await renderMarkdown('10~20분, 30~40분. ~~지움~~', opts)
    expect(r.html).toContain('10~20분, 30~40분.')
    expect(r.html).toContain('<del>지움</del>')
  })

  it('원본 HTML 태그는 출력에 나오지 않는다', async () => {
    const r = await renderMarkdown('안녕 <script>alert(1)</script> <b>굵게</b>\n\n<div>블록</div>', opts)
    expect(r.html).not.toContain('<script')
    expect(r.html).not.toContain('<b>')
    expect(r.html).not.toContain('<div>')
  })
})
