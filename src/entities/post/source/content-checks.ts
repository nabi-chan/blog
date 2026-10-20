// scripts/content-check.ts 가 Node 로 바로 불러서 패키지와 상대 경로(.ts)만 import 한다
import GithubSlugger from 'github-slugger'
import type { Definition, Heading, Image, ImageReference, Link, Root, Text } from 'mdast'
import { toString } from 'mdast-util-to-string'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { SLUG_PATTERN } from '../../../shared/config/index.ts'
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

export type PostSourceInfo = { slug: string; locale: Locale; markdown: string; draft?: boolean }
type SiteAnchors = { posts: Map<string, { ko: Set<string>; en?: Set<string>; draft?: boolean }> }

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
    // 프로덕션 빌드는 초안을 빼므로 공개 글에서 초안으로 가는 링크는 404 가 된다
    if (target.draft && !post.draft) {
      problems.push(`${url} → 초안 글`)
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

const EXTERNAL_IMAGE = /^(https?:)?\/\//i

// CSP 의 img-src 는 'self' 와 data: 만 허용한다(src/shared/lib/security-headers/security-headers.ts). 외부 주소 이미지는 브라우저가 막는다
export function externalImages(markdown: string): string[] {
  const tree = parse(markdown)
  const definitions = new Map<string, string>()
  visit(tree, 'definition', (node: Definition) => {
    definitions.set(node.identifier, node.url)
  })
  const urls: string[] = []
  visit(tree, ['image', 'imageReference'], (node) => {
    const url = node.type === 'image' ? (node as Image).url : definitions.get((node as ImageReference).identifier)
    if (url && EXTERNAL_IMAGE.test(url)) urls.push(url)
  })
  return urls
}

export type ContentPostInput = {
  slug: string
  ko: { title: string; description: string; body: string; tags: string[]; draft?: boolean }
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
    posts: new Map(
      input.posts.map((post) => [post.slug, { ko: headingAnchors(post.ko.body), en: post.en ? headingAnchors(post.en.body) : undefined, draft: post.ko.draft }]),
    ),
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
      for (const line of brokenInternalLinks({ slug: post.slug, locale: 'ko', markdown: post.ko.body, draft: post.ko.draft }, site)) problems.push(`ko 링크 ${line}`)
      for (const [locale, body] of [['ko', post.ko.body], ['en', post.en?.body ?? '']] as const) {
        for (const url of externalImages(body)) problems.push(`${locale} 외부 이미지는 CSP 가 막습니다. 파일을 글 폴더에 두세요: ${url}`)
      }
      if (post.en && enStructure) {
        for (const line of brokenInternalLinks({ slug: post.slug, locale: 'en', markdown: post.en.body, draft: post.ko.draft }, site)) problems.push(`en 링크 ${line}`)
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

// 본문 글자로 남은 ** 는 볼드가 풀린 자리다. 볼드가 구두점으로 끝나는데 바로 글자가 붙으면 CommonMark 가 닫는 ** 로 보지 않는다
export function brokenBold(markdown: string): string[] {
  const lines = markdown.split('\n')
  const found = new Set<number>()
  visit(parse(markdown), 'text', (node: Text) => {
    const index = node.value.indexOf('**')
    if (index === -1 || !node.position) return
    found.add(node.position.start.line + (node.value.slice(0, index).match(/\n/g)?.length ?? 0))
  })
  return [...found].map((line) => `본문 ${line}행 볼드가 풀림: ${lines[line - 1].trim()}`)
}

type InlineNode = { type: string; value?: string; children?: InlineNode[] }

// 문단 글자를 이어 붙인다. 인라인 코드는 백틱째 남기고, 링크·:term 은 보이는 글자만 남긴다
const inlineText = (node: InlineNode): string => {
  if (node.type === 'inlineCode') return `\`${node.value}\``
  if (node.type === 'text') return node.value ?? ''
  if (node.type === 'break') return '\n'
  return (node.children ?? []).map(inlineText).join('')
}

const PARTICLE_AFTER_LATIN = /[^\s]*[A-Za-z0-9)\]`] (?:에서|에는|으로|까지|부터|보다|처럼|은|는|이|가|을|를|에|로|와|과|의|도|만)(?=[\s.,!?:;)'"]|$)/g
const BOUND_SU = /[가-힣]수(?= ?[있없])/g
const BOUND_GEOT = /[가-힣]*(?:는|은|던|을)(?:것|김에)/g
const RIEUL = 8
const finalConsonant = (syllable: string) => (syllable.charCodeAt(0) - 0xac00) % 28

// 문체 가이드 4절 맞춤법 표 중 기계로 잘못 짚을 일이 적은 것만 본다. 코드 안 글자는 보지 않는다
export function spellingWarnings(markdown: string): string[] {
  const warnings: string[] = []
  visit(parse(markdown), (node) => {
    if ((node.type !== 'paragraph' && node.type !== 'heading' && node.type !== 'tableCell') || !node.position) return
    const text = inlineText(node as InlineNode)
    const masked = text.replace(/`[^`]*`/g, (code) => `\`${'x'.repeat(code.length - 2)}\``)
    const hits: Array<{ index: number; message: string }> = []
    for (const match of masked.matchAll(PARTICLE_AFTER_LATIN)) {
      hits.push({ index: match.index, message: `영문·코드 뒤 조사는 붙여 씁니다: "${text.slice(match.index, match.index + match[0].length)}"` })
    }
    for (const match of masked.matchAll(BOUND_SU)) {
      if (finalConsonant(match[0]) === RIEUL) hits.push({ index: match.index, message: `띄어 씁니다: "${match[0]}"` })
    }
    for (const match of masked.matchAll(BOUND_GEOT)) hits.push({ index: match.index, message: `띄어 씁니다: "${match[0]}"` })
    const start = node.position.start.line
    for (const { index, message } of hits.sort((a, b) => a.index - b.index)) {
      warnings.push(`본문 ${start + (text.slice(0, index).match(/\n/g)?.length ?? 0)}행 ${message}`)
    }
  })
  return warnings
}

// 막지는 않는 경고. ko 는 맞춤법과 볼드, en 은 볼드만 본다
export function collectContentWarnings(posts: ContentPostInput[]): Array<{ slug: string; warnings: string[] }> {
  return posts
    .map((post) => ({
      slug: post.slug,
      warnings: [
        ...[...brokenBold(post.ko.body), ...spellingWarnings(post.ko.body)].map((line) => `ko ${line}`),
        ...(post.en ? brokenBold(post.en.body).map((line) => `en ${line}`) : []),
      ],
    }))
    .filter((result) => result.warnings.length > 0)
}
