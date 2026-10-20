import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './render'

const glossary = {
  hydration: { ko: { name: '하이드레이션', definition: '정의 ko' }, en: { name: 'Hydration', definition: 'def en' } },
}
const opts = {
  filePath: '/tmp/x/index.ko.md',
  slug: 'x',
  locale: 'ko',
  enSlugs: new Set<string>(),
  glossary,
  widgetNames: ['counter-demo'],
} as const

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

  it('각주 제목과 돌아가기 라벨을 글 언어로 단다', async () => {
    const ko = await renderMarkdown('본문[^1]\n\n[^1]: 각주 내용', opts)
    expect(ko.html).toMatch(/<h2[^>]*class="sr-only"[^>]*>각주<\/h2>/)
    expect(ko.html).toContain('aria-label="본문으로 돌아가기"')
    expect(ko.toc).toEqual([])
    const en = await renderMarkdown('Body[^1]\n\n[^1]: Note', { ...opts, locale: 'en' })
    expect(en.html).toMatch(/<h2[^>]*class="sr-only"[^>]*>Footnotes<\/h2>/)
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
        '[다른 글](/260301) [외부](https://example.com)',
      ].join('\n'),
      { ...opts, filePath, locale: 'en', enSlugs: new Set(['260301']) },
    )
    expect(r.html).toMatch(/<aside class="callout" data-callout="tip" role="note">\s*<p class="callout-title">Tip<\/p>/)
    expect(r.html).toContain('<blockquote>\n<p>그냥 인용</p>')
    expect(r.html).toContain('[!FOO]')
    expect(r.html).toMatch(
      /<figure><picture><source type="image\/webp" srcset="\/content-assets\/x\/a\.[0-9a-f]{8}\.1w\.webp 1w" sizes="\(max-width: 1199px\) 90vw, 920px"><img src="\/content-assets\/x\/a\.[0-9a-f]{8}\.png" alt="그림" width="1" height="1" loading="eager" fetchpriority="high" decoding="async"><\/picture><figcaption>캡션<\/figcaption><\/figure>/,
    )
    expect(r.html).toMatch(/문장 안 <picture>.*<img src="\/content-assets\/x\/a\.[0-9a-f]{8}\.png" alt="작은" width="1" height="1" loading="lazy" fetchpriority="low"/)
    expect(r.html).toContain('src="https://example.com/x.png"')
    expect(r.html).toContain('href="/en/260301"')
    expect(r.html).toMatch(/href="https:\/\/example\.com" target="_blank" rel="noopener"/)
    expect(r.assets).toEqual(
      expect.arrayContaining([
        { kind: 'copy', from: join(dir, 'a.png'), to: expect.stringMatching(/public\/content-assets\/x\/a\.[0-9a-f]{8}\.png$/) },
        { kind: 'webp', from: join(dir, 'a.png'), to: expect.stringMatching(/a\.[0-9a-f]{8}\.1w\.webp$/), width: 1 },
      ]),
    )
  })
})

describe('renderMarkdown 디렉티브 통합', () => {
  it('다섯 디렉티브와 본문 콜론 표현을 함께 처리한다', async () => {
    const r = await renderMarkdown(
      [
        '비율은 key:value 입니다.',
        '',
        ':::details',
        '로그 보기',
        '',
        '긴 내용',
        ':::',
        '',
        ':::see-also',
        '- [docs] [문서](https://b.example)',
        ':::',
        '',
        '::::quote',
        ':::translation',
        '번역문',
        ':::',
        ':::original',
        'Original text',
        ':::',
        '::::',
        '',
        '이건 :term[하이드레이션]{key="hydration"} 이야',
        '',
        ':::widget-counter-demo',
        '대체 문장',
        ':::',
      ].join('\n'),
      opts,
    )
    expect(r.html).toContain('key:value')
    expect(r.html).toContain('<details class="details"><summary>로그 보기</summary>')
    expect(r.html).toContain('<details open class="see-also"><summary>See Also</summary>')
    expect(r.html).toContain('<blockquote class="bilingual-quote"><div class="quote-translation" lang="ko">')
    expect(r.html).toContain('<span class="term" data-term-key="hydration" tabindex="0">하이드레이션</span>')
    expect(r.html).toContain('<div class="widget" data-widget="counter-demo"><p>대체 문장</p></div>')
    expect(r.terms).toEqual(['hydration'])
  })

  it('모르는 블록은 빌드를 멈춘다', async () => {
    await expect(renderMarkdown(':::detials\n내용\n:::', opts)).rejects.toThrow(/알 수 없는 블록 :::detials/)
  })
})
