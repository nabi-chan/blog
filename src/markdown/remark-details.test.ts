import { describe, expect, it } from 'vitest'
import { remarkDetails } from './remark-details'
import { runPlugins } from './test-utils'

const run = (md: string) => runPlugins(md, { remark: [remarkDetails] })

describe('remarkDetails', () => {
  it('첫 문단을 요약 줄로 하는 details 를 만든다', async () => {
    const { html } = await run(':::details\n로그 보기\n\n긴 내용\n:::')
    expect(html).toContain('<details class="details"><summary>로그 보기</summary>')
    expect(html).toContain('<p>긴 내용</p>')
  })

  it('첫 문단이 없으면 빌드 오류다', async () => {
    await expect(run(':::details\n- 목록만\n:::')).rejects.toThrow(/details/)
  })
})
