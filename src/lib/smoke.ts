export type SmokeCheck = {
  path: string
  status: number
  contains?: string[]
  notContains?: string[]
  location?: string
  // GET 이 아닌 요청(API 확인)에 쓴다
  method?: string
  headers?: Record<string, string>
  body?: string
}

export type SmokeResponse = { status: number; location: string | null; body: string }

const isRedirect = (status: number) => status >= 300 && status < 400

// 어긋난 점을 한국어 문장으로 돌려준다. 빈 배열이면 통과
export function checkResponse(check: SmokeCheck, res: SmokeResponse): string[] {
  const failures: string[] = []
  // 301/302/307/308 은 서빙 설정에 따라 갈리므로 3xx 끼리는 같은 것으로 본다
  const statusMatches =
    res.status === check.status || (isRedirect(check.status) && isRedirect(res.status))
  if (!statusMatches) {
    failures.push(`${check.path}: 상태 코드 ${check.status} 기대, 실제 ${res.status}`)
  }
  if (check.location !== undefined && !(res.location ?? '').endsWith(check.location)) {
    failures.push(`${check.path}: Location 이 "${check.location}" 으로 끝나야 합니다 (실제 ${res.location})`)
  }
  for (const text of check.contains ?? []) {
    if (!res.body.includes(text)) failures.push(`${check.path}: "${text}" 가 없습니다`)
  }
  for (const text of check.notContains ?? []) {
    if (res.body.includes(text)) failures.push(`${check.path}: "${text}" 가 있으면 안 됩니다`)
  }
  return failures
}
