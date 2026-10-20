import { describe, expect, it } from 'vitest'
import { remarkWidget } from './remark-widget'
import { runPlugins } from './test-utils'

const run = (md: string) => runPlugins(md, { remark: [[remarkWidget, { names: ['counter-demo'] }]] })

describe('remarkWidget', () => {
  it('등록된 위젯 자리를 만들고 블록 안 내용을 대체 콘텐츠로 둔다', async () => {
    const { html } = await run(':::widget-counter-demo\n대체 문장\n:::')
    expect(html).toContain('<div class="widget" data-widget="counter-demo"><p>대체 문장</p></div>')
  })

  it('등록되지 않은 위젯은 빌드 오류다', async () => {
    await expect(run(':::widget-nope\n:::')).rejects.toThrow(/widget-nope/)
  })
})
