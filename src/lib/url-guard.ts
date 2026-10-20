// 디코딩할 수 없는 퍼센트 인코딩(/posts/%E0)은 라우터에서 URIError 를 일으켜 500 이 된다.
// 서버 엔트리 맨 앞에서 이걸로 걸러 404 로 끝낸다.
export function isMalformedPath(pathname: string): boolean {
  try {
    decodeURIComponent(pathname)
    return false
  } catch (error) {
    if (error instanceof URIError) return true
    throw error
  }
}
