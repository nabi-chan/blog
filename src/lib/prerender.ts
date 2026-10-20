// 프리렌더할 경로인지. 정적 에셋은 Worker 보다 먼저 응답하므로 API 와 Access 입구(/admin)가
// 프리렌더되면 프로덕션에서 Worker 코드가 실행되지 않는다. ?tag= 와 #헤딩 링크는 같은 페이지다
export function shouldPrerender(path: string): boolean {
  if (path.includes('?') || path.includes('#')) return false
  if (path.startsWith('/api/')) return false
  return path !== '/admin' && !path.startsWith('/admin/')
}
