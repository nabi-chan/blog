import { describe, expect, it } from 'vitest'
import { computeSourceHash } from './source-hash'

const base = { title: '제목', description: '설명', body: '본문\n둘째 줄' }

describe('computeSourceHash', () => {
  it('sha256 hex 를 돌려준다', () => {
    expect(computeSourceHash(base)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('줄바꿈 형식과 본문 앞뒤 공백은 해시에 영향이 없다', () => {
    expect(computeSourceHash({ ...base, body: '본문\r\n둘째 줄' })).toBe(computeSourceHash(base))
    expect(computeSourceHash({ ...base, body: '\n본문\n둘째 줄\n\n' })).toBe(computeSourceHash(base))
  })

  it('제목이나 설명이 바뀌면 해시가 바뀐다', () => {
    expect(computeSourceHash({ ...base, title: '제목2' })).not.toBe(computeSourceHash(base))
    expect(computeSourceHash({ ...base, description: '설명2' })).not.toBe(computeSourceHash(base))
  })
})
