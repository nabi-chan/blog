import { createHash } from 'node:crypto'

// 영어 번역본이 어느 원문을 보고 번역했는지 기록하는 해시. 본문 + 제목 + 설명 + 검색 제목 + 키워드만 본다.
// 키워드는 JSON 배열로 넣어서 경계가 섞이지 않게 한다. 순서를 바꿔도 해시가 바뀐다
export function computeSourceHash(input: { title: string; description: string; seoTitle: string; keywords: string[]; body: string }): string {
  const body = input.body.replace(/\r\n?/g, '\n').trim()
  return createHash('sha256')
    .update(`${input.title}\n${input.description}\n${input.seoTitle}\n${JSON.stringify(input.keywords)}\n${body}`)
    .digest('hex')
}
