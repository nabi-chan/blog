import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

// 프리렌더할 경로인지. 정적 에셋은 Worker 보다 먼저 응답하므로 API 와 Access 입구(/admin)가
// 프리렌더되면 프로덕션에서 Worker 코드가 실행되지 않는다. ?tag= 와 #헤딩 링크는 같은 페이지다
export function shouldPrerender(path: string): boolean {
  if (path.includes('?') || path.includes('#')) return false
  if (path.startsWith('/api/')) return false
  return path !== '/admin' && !path.startsWith('/admin/')
}

// 언어별·공통 SEO 산출물. 프리렌더 크롤러는 <a href> 만 따라가서 직접 넣는다
export const SEO_PAGES: readonly string[] = ['/sitemap.xml', '/robots.txt', '/rss.xml', '/en/rss.xml', '/llms.txt', '/en/llms.txt', '/llms-full.txt']

const draftOf = (file: string): boolean => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'))
  return match !== null && (parse(match[1]) as { draft?: unknown } | null)?.draft === true
}

// 글별 .md 원문 경로. <link rel="alternate"> 는 크롤러가 따라가지 않아서 글 폴더를 읽어 만든다.
// 이 목록이 실제 데이터와 어긋나면 .md 라우트가 404 를 내고 failOnError 로 빌드가 멈춘다 (조용히 빠지지 않는다)
export function markdownPagePaths(postsDir: string, options: { production: boolean }): string[] {
  // 글이 0편이면 git 이 빈 폴더를 추적하지 않아 폴더 자체가 없다 (빈 상태 화면은 그대로 떠야 한다)
  if (!existsSync(postsDir)) return []
  return readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(postsDir, entry.name, 'index.ko.md')))
    .map((entry) => entry.name)
    .sort()
    .flatMap((slug) => {
      if (options.production && draftOf(join(postsDir, slug, 'index.ko.md'))) return []
      const hasEnglish = existsSync(join(postsDir, slug, 'index.en.md'))
      return hasEnglish ? [`/${slug}.md`, `/en/${slug}.md`] : [`/${slug}.md`]
    })
}
