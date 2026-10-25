import { describe, expect, it } from 'vitest'
import { mainPushes } from './pre-push'

const ZERO = '0'.repeat(40)
const A = 'a'.repeat(40)
const B = 'b'.repeat(40)

describe('mainPushes', () => {
  it('main 으로 가는 push 의 원격 sha 와 로컬 sha 를 고른다', () => {
    expect(mainPushes(`refs/heads/main ${B} refs/heads/main ${A}\n`)).toEqual([{ base: A, head: B }])
  })

  it('다른 브랜치로 가는 push 는 고르지 않는다', () => {
    expect(mainPushes(`refs/heads/main ${B} refs/heads/main ${A}\nrefs/heads/wip ${B} refs/heads/wip ${A}\n`)).toEqual([{ base: A, head: B }])
    expect(mainPushes(`refs/heads/main ${B} refs/heads/wip ${A}\n`)).toEqual([])
  })

  it('원격 main 을 지우는 push 는 고르지 않는다', () => {
    expect(mainPushes(`(delete) ${ZERO} refs/heads/main ${A}\n`)).toEqual([])
  })

  it('원격 main 을 새로 만드는 push 는 비교할 커밋이 없다', () => {
    expect(mainPushes(`refs/heads/main ${B} refs/heads/main ${ZERO}\n`)).toEqual([{ head: B }])
  })

  it('빈 입력이면 고르지 않는다', () => {
    expect(mainPushes('')).toEqual([])
  })
})
