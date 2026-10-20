import { describe, expect, it } from 'vitest'
import { remarkSeeAlso } from './remark-see-also'
import { runPlugins } from './test-utils'

const run = (md: string) => runPlugins(md, { remark: [remarkSeeAlso] })

describe('remarkSeeAlso', () => {
  it('펼쳐진 See Also 목록을 만들고 종류 표지를 data-kind 로 옮긴다', async () => {
    const { html } = await run(
      ':::see-also\n- [paper] [논문](https://a.example)\n- [docs] [문서](https://b.example)\n- [repo] [저장소](https://r.example)\n- [article] [글](https://n.example)\n- [기타](https://c.example)\n- [video] [모름](https://v.example)\n:::',
    )
    expect(html).toContain('<details open class="see-also"><summary>See Also</summary><ul class="see-also-list">')
    expect(html).toMatch(/<li data-kind="paper"><a href="https:\/\/a\.example"/)
    expect(html).toMatch(/<li data-kind="docs">/)
    expect(html).toMatch(/<li data-kind="repo">/)
    expect(html).toMatch(/<li data-kind="article">/)
    expect(html).toMatch(/<li data-kind="link"><a href="https:\/\/c\.example"/)
    // 모르는 표지는 지우지 않는다 ('[RFC] 9110' 같은 실제 텍스트일 수 있다)
    expect(html).toMatch(/<li data-kind="link">\[video\] <a href="https:\/\/v\.example"/)
    expect(html).not.toContain('[paper]')
  })
})
