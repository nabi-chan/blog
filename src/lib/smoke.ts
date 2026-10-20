import { SLUG_PATTERN } from '../content/constants.ts'

export type SmokeCheck = {
  path: string
  status: number
  contains?: string[]
  notContains?: string[]
  location?: string
  // Location 에 들어 있어야 할 문자열 (외부 로그인 주소처럼 끝이 매번 다를 때)
  locationIncludes?: string
  // 문자열이 정확히 몇 번 나와야 하는지 (예: <title 은 한 번)
  count?: Record<string, number>
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
  if (check.locationIncludes !== undefined && !(res.location ?? '').includes(check.locationIncludes)) {
    failures.push(`${check.path}: Location 에 "${check.locationIncludes}" 이 있어야 합니다 (실제 ${res.location})`)
  }
  for (const [text, expected] of Object.entries(check.count ?? {})) {
    const actual = res.body.split(text).length - 1
    if (actual !== expected) failures.push(`${check.path}: "${text}" 가 ${expected}번 있어야 합니다 (실제 ${actual}번)`)
  }
  for (const text of check.contains ?? []) {
    if (!res.body.includes(text)) failures.push(`${check.path}: "${text}" 가 없습니다`)
  }
  for (const text of check.notContains ?? []) {
    if (res.body.includes(text)) failures.push(`${check.path}: "${text}" 가 있으면 안 됩니다`)
  }
  return failures
}

const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)?.[1]

// 메타에 실린 주소(canonical·alternate 링크, OG·Twitter 이미지). 스모크가 전부 200 인지 확인한다
export function extractMetaUrls(html: string): string[] {
  const urls: string[] = []
  for (const [tag] of html.matchAll(/<(?:link|meta)\b[^>]*>/gi)) {
    const rel = attr(tag, 'rel')
    const href = attr(tag, 'href')
    if ((rel === 'canonical' || rel === 'alternate') && href) urls.push(href)
    const key = attr(tag, 'property') ?? attr(tag, 'name')
    const content = attr(tag, 'content')
    if ((key === 'og:image' || key === 'twitter:image') && content) urls.push(content)
  }
  return urls
}

// 배포된 CSS 가 실제로 내려오는지 보려고 stylesheet 주소를 고른다 (스펙 4.11 배포 스모크)
export function extractStylesheets(html: string): string[] {
  const urls: string[] = []
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const href = attr(tag, 'href')
    if (attr(tag, 'rel') === 'stylesheet' && href) urls.push(href)
  }
  return urls
}

export type SmokePost = { slug: string; en: boolean }

// sitemap 주소 중 글 주소만 골라 slug 와 영어판 유무를 돌려준다. 스모크는 이 중 실제 글 하나로 글 페이지를 본다
export function sitemapPosts(urls: string[]): SmokePost[] {
  const paths = urls.map((url) => new URL(url).pathname.slice(1))
  const en = new Set(paths.filter((path) => path.startsWith('en/')).map((path) => path.slice(3)))
  return paths.filter((path) => SLUG_PATTERN.test(path)).map((slug) => ({ slug, en: en.has(slug) }))
}
