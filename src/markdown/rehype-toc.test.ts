import rehypeSlug from 'rehype-slug'
import { describe, expect, it } from 'vitest'
import { rehypeToc } from './rehype-toc'
import { runPlugins } from './test-utils'

describe('rehypeToc', () => {
  it('h2·h3 만 목차로 모은다', async () => {
    const { data } = await runPlugins('# 제목\n\n## 둘\n\n### 셋\n\n#### 넷', { rehype: [rehypeSlug, rehypeToc] })
    expect(data.toc).toEqual([
      { depth: 2, id: '둘', text: '둘' },
      { depth: 3, id: '셋', text: '셋' },
    ])
  })

  it('GFM 각주 제목은 목차에 넣지 않는다', async () => {
    const { data } = await runPlugins('## 본문[^1]\n\n[^1]: 각주 내용', { rehype: [rehypeSlug, rehypeToc] })
    expect(data.toc).toEqual([{ depth: 2, id: '본문1', text: '본문1' }])
  })

  it('헤딩이 없으면 빈 목차다', async () => {
    const { data } = await runPlugins('본문만', { rehype: [rehypeSlug, rehypeToc] })
    expect(data.toc).toEqual([])
  })
})
