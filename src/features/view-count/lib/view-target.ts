export type MatchLike = { routeId: string; status: string; params: Record<string, string>; globalNotFound?: boolean }

// 지금 화면에서 무엇을 셀지. 404 는 세지 않고(null), 글 화면이면 slug 도 센다 (스펙 4.8)
export function viewTarget(matches: MatchLike[]): { slug?: string } | null {
  if (matches.length === 0) return null
  if (matches.some((match) => match.status === 'notFound' || match.globalNotFound)) return null
  const post = matches.find((match) => match.routeId === '/$slug')
  return post ? { slug: post.params.slug } : {}
}

// 셀 화면을 구분하는 키. 목차 링크(#id)로 이동해도 새 히스토리 항목이 생기지만 같은 화면이라 해시는 뺀다
export function viewKey(location: { pathname: string; searchStr: string; hash?: string }): string {
  return `${location.pathname}${location.searchStr}`
}
