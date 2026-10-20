import { describe, expect, it } from 'vitest'
import { remarkTerm } from './remark-term'
import { runPlugins } from './test-utils'

const glossary = {
  hydration: { ko: { name: '하이드레이션', definition: '정의 ko' }, en: { name: 'Hydration', definition: 'def en' } },
}
const run = (md: string) => runPlugins(md, { remark: [[remarkTerm, { locale: 'ko', glossary }]] })

describe('remarkTerm', () => {
  it('용어를 키가 붙은 span 으로 바꾸고 쓴 키를 모은다', async () => {
    const { html, data } = await run('이건 :term[하이드레이션]{key="hydration"} 이고 또 :term[hydration]{key="hydration"}')
    expect(html).toContain('<span class="term" data-term-key="hydration" tabindex="0">하이드레이션</span>')
    expect(data.terms).toEqual(['hydration'])
  })

  it('용어집에 없는 키·빈 라벨·다른 속성은 빌드 오류다', async () => {
    await expect(run(':term[x]{key="nope"}')).rejects.toThrow(/nope/)
    await expect(run(':term[]{key="hydration"}')).rejects.toThrow(/term/)
    await expect(run(':term[x]{key="hydration" extra="1"}')).rejects.toThrow(/term/)
  })
})
