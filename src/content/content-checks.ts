// scripts/content-check.ts 가 Node 로 바로 불러서 패키지와 상대 경로(.ts)만 import 한다
import GithubSlugger from 'github-slugger'
import type { Definition, Heading, Link, Root } from 'mdast'
import { toString } from 'mdast-util-to-string'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { SLUG_PATTERN } from './constants.ts'
import { computeSourceHash } from './source-hash.ts'
import { compareStructure, translationStructure } from './translation-structure.ts'

type Locale = 'ko' | 'en'

const parse = (markdown: string): Root => unified().use(remarkParse).use(remarkGfm, { singleTilde: false }).use(remarkDirective).parse(markdown)

export function missingTagLabels(tagKeys: string[], labels: Array<{ key: string }>): string[] {
  const known = new Set(labels.map((label) => label.key))
  return [...new Set(tagKeys)].filter((key) => !known.has(key))
}

export function missingTerms(termKeys: string[], glossary: Array<{ key: string }>): string[] {
  const known = new Set(glossary.map((term) => term.key))
  return [...new Set(termKeys)].filter((key) => !known.has(key))
}

// rehype-slug 와 같은 github-slugger 규칙. 같은 제목이 또 나오면 -1, -2 가 붙는다
export function headingAnchors(markdown: string): Set<string> {
  const slugger = new GithubSlugger()
  const anchors = new Set<string>()
  visit(parse(markdown), 'heading', (node: Heading) => {
    anchors.add(slugger.slug(toString(node)))
  })
  return anchors
}

export type PostSourceInfo = { slug: string; locale: Locale; markdown: string }
type SiteAnchors = { posts: Map<string, { ko: Set<string>; en?: Set<string> }> }

const EXTERNAL = /^[a-z][a-z0-9+.-]*:/i
const LIST_PAGES = new Set(['/', '/posts'])
const FILES = new Set(['/rss.xml', '/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt'])
const decode = (text: string) => {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

// 사이트 내부 링크만 본다. 외부 링크와 메일 주소는 보지 않는다 (계획 1 에서 미룬 '깨진 내부 링크 검사')
export function brokenInternalLinks(post: PostSourceInfo, site: SiteAnchors): string[] {
  const problems: string[] = []
  const urls: string[] = []
  visit(parse(post.markdown), ['link', 'definition'], (node) => {
    urls.push((node as Link | Definition).url)
  })
  for (const url of urls) {
    if (EXTERNAL.test(url)) continue
    const [, rawPath = '', rawHash] = /^([^?#]*)(?:\?[^#]*)?(?:#(.*))?$/.exec(url) ?? []
    const hash = rawHash === undefined ? undefined : decode(rawHash)
    const anchorProblem = (slug: string, anchors: Set<string> | undefined) =>
      hash !== undefined && !anchors?.has(hash) ? `${url} → ${slug} 에 없는 앵커` : undefined

    if (rawPath === '') {
      const own = site.posts.get(post.slug)
      const problem = anchorProblem(post.slug, post.locale === 'en' ? own?.en : own?.ko)
      if (problem) problems.push(problem)
      continue
    }
    const explicitEn = rawPath === '/en' || rawPath.startsWith('/en/')
    const path = explicitEn ? rawPath.slice(3) || '/' : rawPath
    if (LIST_PAGES.has(path) || FILES.has(path)) continue
    const slug = path.slice(1).replace(/\.md$/, '')
    const target = SLUG_PATTERN.test(slug) ? site.posts.get(slug) : undefined
    if (!SLUG_PATTERN.test(slug)) {
      problems.push(`${url} → 알 수 없는 사이트 경로`)
      continue
    }
    if (!target) {
      problems.push(`${url} → 없는 글`)
      continue
    }
    if (explicitEn && !target.en) {
      problems.push(`${url} → 번역 없는 글`)
      continue
    }
    // en 원문의 /<slug> 는 번역이 있으면 /en 으로 바뀌므로(현지화 규칙) en 앵커를 본다
    const useEnglish = explicitEn || (post.locale === 'en' && target.en !== undefined)
    const problem = anchorProblem(slug, useEnglish ? target.en : target.ko)
    if (problem) problems.push(problem)
  }
  return problems
}

export function messageKeyDiff(ko: Record<string, unknown>, en: Record<string, unknown>): { onlyKo: string[]; onlyEn: string[] } {
  const keys = (messages: Record<string, unknown>) => new Set(Object.keys(messages).filter((key) => key !== '$schema'))
  const koKeys = keys(ko)
  const enKeys = keys(en)
  return { onlyKo: [...koKeys].filter((key) => !enKeys.has(key)), onlyEn: [...enKeys].filter((key) => !koKeys.has(key)) }
}

export type ContentPostInput = {
  slug: string
  ko: { title: string; description: string; body: string; tags: string[] }
  en?: { body: string; sourceHash: string }
}

// 글마다 문제를 모은다. content:check 와 audit:repo 가 같이 쓴다
// options.translation 이 false 면 낡은 번역·구조 불일치는 빼고 본다 (audit 이 번역 검사에서 따로 낸다)
export function collectContentProblems(
  input: { posts: ContentPostInput[]; tagKeys: string[]; termKeys: string[] },
  options: { translation?: boolean } = {},
): Array<{ slug: string; problems: string[] }> {
  const translation = options.translation ?? true
  const site: SiteAnchors = {
    posts: new Map(input.posts.map((post) => [post.slug, { ko: headingAnchors(post.ko.body), en: post.en ? headingAnchors(post.en.body) : undefined }])),
  }
  return input.posts
    .map((post) => {
      const problems: string[] = []
      const koStructure = translationStructure(post.ko.body)
      const enStructure = post.en ? translationStructure(post.en.body) : undefined
      const tags = missingTagLabels(post.ko.tags, input.tagKeys.map((key) => ({ key })))
      if (tags.length > 0) problems.push(`태그 표시 이름 없음: ${tags.join(', ')}`)
      const terms = missingTerms([...koStructure.terms, ...(enStructure?.terms ?? [])], input.termKeys.map((key) => ({ key })))
      if (terms.length > 0) problems.push(`용어집에 없는 :term: ${terms.join(', ')}`)
      for (const line of brokenInternalLinks({ slug: post.slug, locale: 'ko', markdown: post.ko.body }, site)) problems.push(`ko 링크 ${line}`)
      if (post.en && enStructure) {
        for (const line of brokenInternalLinks({ slug: post.slug, locale: 'en', markdown: post.en.body }, site)) problems.push(`en 링크 ${line}`)
        if (translation && computeSourceHash(post.ko) !== post.en.sourceHash) {
          problems.push(`en 번역이 낡았습니다 (pnpm content:rehash --post ${post.slug} 또는 /translate-post)`)
        }
        if (translation) for (const line of compareStructure(koStructure, enStructure)) problems.push(`en 구조: ${line}`)
      }
      return { slug: post.slug, problems }
    })
    .filter((result) => result.problems.length > 0)
}

// 렌더된 HTML 에 글자 그대로 나오는 본문 문장 한 줄 (audit --build 의 본문 유출 검사용).
// 최상위 문단 중 인라인 문법 없이 글자만 있는 문단에서, HTML 이스케이프 글자가 없는 첫 줄을 고른다.
// 한 줄만 고르는 건 번들의 JS 문자열 안에서 줄바꿈이 \n 으로 바뀌기 때문이다
export function plainTextMarker(markdown: string): string | undefined {
  for (const node of parse(markdown).children) {
    if (node.type !== 'paragraph' || !node.children.every((child) => child.type === 'text')) continue
    for (const line of toString(node).split('\n')) {
      const text = line.trim()
      if ([...text].length >= 12 && !/[&<>"']/.test(text)) return text
    }
  }
  return undefined
}
