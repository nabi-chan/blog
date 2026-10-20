import { createHash } from 'node:crypto'

// 영어 번역본이 어느 원문을 보고 번역했는지 기록하는 해시. 본문 + 제목 + 설명만 본다
export function computeSourceHash(input: { title: string; description: string; body: string }): string {
  const body = input.body.replace(/\r\n?/g, '\n').trim()
  return createHash('sha256').update(`${input.title}\n${input.description}\n${body}`).digest('hex')
}
