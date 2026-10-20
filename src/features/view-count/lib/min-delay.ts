const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// 작업 결과를 최소 ms 가 지난 뒤에 돌려준다. 실패도 같은 시간을 기다린 뒤에 전한다 (스켈레톤 최소 표시 시간)
export async function withMinimumDelay<T>(task: Promise<T>, ms: number): Promise<T> {
  const [settled] = await Promise.allSettled([task, sleep(ms)])
  if (settled.status === 'rejected') throw settled.reason
  return settled.value
}
