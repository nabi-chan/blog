import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

describe('renderMarkdown 본문 기능 통합', () => {
  const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

  it('Callout·Figure·글 옆 이미지·링크를 한 번에 처리한다', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'render-'))
    writeFileSync(join(dir, 'a.png'), Buffer.from(PIXEL, 'base64'))
    const filePath = join(dir, 'index.en.md')
    const r = await renderMarkdown(
      [
        '> [!TIP]',
        '> 내용',
        '',
        '> 그냥 인용',
        '',
        '> [!FOO]',
        '> 모르는 종류',
        '',
        '![그림](./a.png "캡션")',
        '',
        '문장 안 ![작은](./a.png) 이미지',
        '',
        '![외부](https://example.com/x.png)',
        '',
        '[다른 글](/posts/both) [외부](https://example.com)',
      ].join('\n'),
      { filePath, slug: 'x', locale: 'en', enSlugs: new Set(['both']) },
    )
    expect(r.html).toMatch(/<aside class="callout" data-callout="tip" role="note">\s*<p class="callout-title">Tip<\/p>/)
    expect(r.html).toContain('<blockquote>\n<p>그냥 인용</p>')
    expect(r.html).toContain('[!FOO]')
    expect(r.html).toMatch(
      /<figure><picture><source type="image\/webp" srcset="\/content-assets\/x\/a\.[0-9a-f]{8}\.1w\.webp 1w" sizes="\(max-width: 752px\) calc\(100vw - 32px\), 720px"><img src="\/content-assets\/x\/a\.[0-9a-f]{8}\.png" alt="그림" width="1" height="1" loading="eager" fetchpriority="high" decoding="async"><\/picture><figcaption>캡션<\/figcaption><\/figure>/,
    )
    expect(r.html).toMatch(/문장 안 <picture>.*<img src="\/content-assets\/x\/a\.[0-9a-f]{8}\.png" alt="작은" width="1" height="1" loading="lazy" fetchpriority="low"/)
    expect(r.html).toContain('src="https://example.com/x.png"')
    expect(r.html).toContain('href="/en/posts/both"')
    expect(r.html).toMatch(/href="https:\/\/example\.com" target="_blank" rel="noopener"/)
    expect(r.assets).toEqual(
      expect.arrayContaining([
        { kind: 'copy', from: join(dir, 'a.png'), to: expect.stringMatching(/public\/content-assets\/x\/a\.[0-9a-f]{8}\.png$/) },
        { kind: 'webp', from: join(dir, 'a.png'), to: expect.stringMatching(/a\.[0-9a-f]{8}\.1w\.webp$/), width: 1 },
      ]),
    )
  })
})
