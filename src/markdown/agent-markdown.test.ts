import { describe, expect, it } from 'vitest'
import { absolutizeMarkdownImages, countWords } from './agent-markdown'

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
