import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { absolutizeMarkdownImages, countWords } from './agent-markdown'
import { renderMarkdown } from './render'

const ORIGIN = 'https://nabichan.me'
const images = { './diagram.svg': '/content-assets/261020/diagram.abc.svg', './photo.png?w=400': '/content-assets/261020/photo.def.png' }

describe('absolutizeMarkdownImages', () => {
  it('인라인 이미지의 경로만 절대 URL 로 바꾸고 대체 텍스트·제목은 그대로 둔다', () => {
    expect(absolutizeMarkdownImages('앞 ![a](./diagram.svg "그림") 뒤', images, ORIGIN)).toBe(
      '앞 ![a](https://nabichan.me/content-assets/261020/diagram.abc.svg "그림") 뒤',
    )
    expect(absolutizeMarkdownImages('![작게](./photo.png?w=400)', images, ORIGIN)).toBe('![작게](https://nabichan.me/content-assets/261020/photo.def.png)')
  })

  it('한 문서의 여러 이미지를 위치가 어긋나지 않게 모두 바꾼다', () => {
    expect(absolutizeMarkdownImages('![a](./diagram.svg) 와 ![b](./photo.png?w=400)', images, ORIGIN)).toBe(
      '![a](https://nabichan.me/content-assets/261020/diagram.abc.svg) 와 ![b](https://nabichan.me/content-assets/261020/photo.def.png)',
    )
  })

  it('참조형 이미지는 정의 줄의 경로를 바꾼다', () => {
    expect(absolutizeMarkdownImages('![a][d]\n\n[d]: ./diagram.svg "t"\n', images, ORIGIN)).toBe(
      '![a][d]\n\n[d]: https://nabichan.me/content-assets/261020/diagram.abc.svg "t"\n',
    )
  })

  it('<> 로 감싼 경로도 바꾼다', () => {
    expect(absolutizeMarkdownImages('![a](<./diagram.svg>)', images, ORIGIN)).toBe('![a](<https://nabichan.me/content-assets/261020/diagram.abc.svg>)')
  })

  it('외부 이미지, 표에 없는 경로, 코드 안의 이미지 문법은 그대로 둔다', () => {
    const markdown = '![x](https://example.com/x.png)\n\n```md\n![y](./diagram.svg)\n```\n\n`![z](./diagram.svg)`\n'
    expect(absolutizeMarkdownImages(markdown, images, ORIGIN)).toBe(markdown)
  })

  it('디렉티브 블록 안의 이미지도 바꾼다', () => {
    expect(absolutizeMarkdownImages(':::details[펼치기]\n![a](./diagram.svg)\n:::\n', images, ORIGIN)).toContain(
      '![a](https://nabichan.me/content-assets/261020/diagram.abc.svg)',
    )
  })
})

describe('countWords', () => {
  it('블록 사이를 띄어서 공백 기준으로 센다', () => {
    expect(countWords('# 제목\n\n안녕 세상 hello')).toBe(4)
    expect(countWords('```ts\nconst a = 1\n```')).toBe(4)
    expect(countWords('')).toBe(0)
  })
})

describe('renderMarkdown 과 함께 (실제 이미지 표)', () => {
  // 1x1 투명 PNG
  const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  const dir = mkdtempSync(join(tmpdir(), 'agent-md-'))
  for (const name of ['스크린샷 2026-10-20 오후 2.15.30.png', '사진.png', 'my image.png', 'a_b.png']) writeFileSync(join(dir, name), Buffer.from(PIXEL, 'base64'))
  const filePath = join(dir, 'index.ko.md')

  const roundTrip = async (markdown: string) => {
    const { images } = await renderMarkdown(markdown, { filePath, slug: '261020', locale: 'ko', enSlugs: new Set(), glossary: {}, widgetNames: [] })
    return absolutizeMarkdownImages(markdown, images, ORIGIN)
  }

  it('한글·공백 파일 이름을 어떤 표기로 써도 절대 URL 로 바꾼다', async () => {
    for (const markdown of [
      '![a](./%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202026-10-20%20%EC%98%A4%ED%9B%84%202.15.30.png)',
      '![a](<./스크린샷 2026-10-20 오후 2.15.30.png>)',
      '![a](./사진.png)',
      '![a](<./my image.png>)',
    ]) {
      expect(await roundTrip(markdown)).toMatch(/^!\[a\]\(<?https:\/\/nabichan\.me\/content-assets\/261020\/[a-z0-9.-]+\.png>?\)$/)
    }
  })

  it('바꾸지 못한 글 옆 이미지가 남으면 조용히 넘어가지 않고 던진다', async () => {
    await expect(roundTrip('![a](./a\\_b.png)')).rejects.toThrow(/절대 URL 로 바꾸지 못했습니다/)
  })
})
