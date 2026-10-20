import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'
import { describe, expect, it } from 'vitest'
import { rehypeFigure } from './rehype-figure'
import { runPlugins } from './test-utils'

// rehypeLocalImages 가 img 를 picture 로 감싼 상황을 흉내 낸다
function wrapInPicture() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'img' || !parent || index === undefined) return
      parent.children[index] = { type: 'element', tagName: 'picture', properties: {}, children: [node] }
      return 'skip'
    })
  }
}

describe('rehypeFigure', () => {
  it('title 이 있는 단독 이미지는 figure 와 figcaption 이 된다', async () => {
    const { html } = await runPlugins('![a](https://x.example/y.png "캡션")', { rehype: [rehypeFigure] })
    expect(html).toContain('<figure><img src="https://x.example/y.png" alt="a"><figcaption>캡션</figcaption></figure>')
  })

  it('문장 안 이미지와 title 없는 이미지는 그대로 둔다', async () => {
    expect((await runPlugins('문장 ![a](https://x.example/y.png "캡션")', { rehype: [rehypeFigure] })).html).not.toContain(
      '<figure',
    )
    expect((await runPlugins('![a](https://x.example/y.png)', { rehype: [rehypeFigure] })).html).not.toContain('<figure')
  })

  it('picture 로 감싼 이미지도 figure 가 된다', async () => {
    const { html } = await runPlugins('![a](https://x.example/y.png "캡션")', { rehype: [wrapInPicture, rehypeFigure] })
    expect(html).toContain('<figure><picture><img src="https://x.example/y.png" alt="a"></picture><figcaption>캡션</figcaption></figure>')
  })
})
