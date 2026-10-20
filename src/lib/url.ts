// 정규 URL 은 슬래시 없음. 경로 끝 슬래시만 지우고 쿼리·해시는 그대로 둔다
export function stripTrailingSlash(href: string): string {
  const cut = href.search(/[?#]/)
  const path = cut === -1 ? href : href.slice(0, cut)
  const rest = cut === -1 ? '' : href.slice(cut)
  return (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path) + rest
}
