import type { Locale } from '~/shared/i18n'
import { SLUG_PATTERN } from '../../../shared/config'

// Paraglide urlPatterns(Task 2)와 같은 규칙: 한국어는 접두사 없음, 영어는 /en
export function localizePath(path: string, locale: Locale): string {
  if (locale === 'ko') return path
  return path === '/' ? '/en' : `/en${path}`
}

const EXTERNAL = /^[a-z][a-z0-9+.-]*:/i
// 글이 아닌 경로 중 /en 판이 있는 것. llms-full.txt·sitemap.xml·robots.txt 와 정적 에셋은 한 벌뿐이다
const LOCALIZED_PATHS = new Set(['/', '/posts', '/rss.xml', '/llms.txt'])

// 본문 링크를 그 글의 언어에 맞춘다. 영어 번역본이 없는 글은 한국어 글로 두고 hrefLang 을 단다
export function resolvePostLink(
  href: string,
  locale: Locale,
  enSlugs: ReadonlySet<string>,
): { href: string; hrefLang?: Locale; external: boolean } {
  if (EXTERNAL.test(href)) return { href, external: true }
  if (!href.startsWith('/') || locale === 'ko') return { href, external: false }

  const cut = href.search(/[?#]/)
  const path = cut === -1 ? href : href.slice(0, cut)
  const rest = cut === -1 ? '' : href.slice(cut)
  // 글 주소는 /<slug>, 글 원문은 /<slug>.md 다 (slug = YYMMDD(-kebab)?)
  const slug = path.slice(1).replace(/\.md$/, '')
  if (SLUG_PATTERN.test(slug)) {
    if (!enSlugs.has(slug)) return { href, hrefLang: 'ko', external: false }
  } else if (!LOCALIZED_PATHS.has(path)) {
    return { href, external: false }
  }
  return { href: localizePath(path, locale) + rest, external: false }
}
