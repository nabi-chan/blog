import type { Locale } from '~/shared/i18n'

// Paraglide urlPatterns(Task 2)와 같은 규칙: 한국어는 접두사 없음, 영어는 /en
export function localizePath(path: string, locale: Locale): string {
  if (locale === 'ko') return path
  return path === '/' ? '/en' : `/en${path}`
}
