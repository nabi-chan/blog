import type { Locale } from '~/i18n/runtime'
import { localizePath } from '~/markdown/link'
import { site } from '~/site'

// 메타·sitemap·피드에 싣는 URL 은 전부 사이트 주소 기준 절대 URL 이다 (스펙 4.9)
export function absoluteUrl(path: string): string {
  return new URL(path, site.url).href
}

export function pageUrl(path: string, locale: Locale): string {
  return absoluteUrl(localizePath(path, locale))
}
