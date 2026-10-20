import { describe, expect, it } from 'vitest'
import { remarkDirectiveGuard } from './remark-directive-guard'
import { runPlugins } from './test-utils'

const run = (md: string) => runPlugins(md, { remark: [remarkDirectiveGuard] })

describe('remarkDirectiveGuard', () => {
  it('모르는 텍스트 디렉티브는 원문 그대로 되살린다', async () => {
    const { html } = await run('비율은 key:value 와 3:1, 그리고 Note:foo[x]{a=1} 입니다')
    expect(html).toContain('key:value')
    expect(html).toContain('3:1')
    expect(html).toContain('Note:foo[x]{a=1}')
  })

  it('모르는 리프 디렉티브도 원문으로 되살린다', async () => {
    const { html } = await run('::youtube[x]')
    expect(html).toContain('::youtube[x]')
  })

  it('모르는 블록은 빌드 오류다', async () => {
    await expect(run(':::detials\n내용\n:::')).rejects.toThrow(/알 수 없는 블록 :::detials/)
  })

  it('알려진 디렉티브는 건드리지 않는다', async () => {
    await expect(run(':::details\n요약\n:::\n\n:term[x]{key="a"}\n\n:::widget-any\n:::')).resolves.toBeDefined()
  })
})
