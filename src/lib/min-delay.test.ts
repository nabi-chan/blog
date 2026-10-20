import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { withMinimumDelay } from './min-delay'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const settledState = (promise: Promise<unknown>) => {
  const state = { done: false, value: undefined as unknown, error: undefined as unknown }
  promise.then(
    (value) => Object.assign(state, { done: true, value }),
    (error) => Object.assign(state, { done: true, error }),
  )
  return state
}

describe('withMinimumDelay', () => {
  it('작업이 빨리 끝나도 최소 시간이 지나야 결과를 돌려준다', async () => {
    const state = settledState(withMinimumDelay(Promise.resolve('data'), 500))
    await vi.advanceTimersByTimeAsync(499)
    expect(state.done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(state).toMatchObject({ done: true, value: 'data' })
  })

  it('작업이 더 오래 걸리면 작업이 끝날 때 돌려준다', async () => {
    const slow = new Promise((resolve) => setTimeout(() => resolve('late'), 800))
    const state = settledState(withMinimumDelay(slow, 500))
    await vi.advanceTimersByTimeAsync(799)
    expect(state.done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(state).toMatchObject({ done: true, value: 'late' })
  })

  it('작업이 실패해도 최소 시간이 지난 뒤에 실패를 전한다', async () => {
    const state = settledState(withMinimumDelay(Promise.reject(new Error('boom')), 500))
    await vi.advanceTimersByTimeAsync(499)
    expect(state.done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(state.done).toBe(true)
    expect(state.error).toBeInstanceOf(Error)
  })
})
