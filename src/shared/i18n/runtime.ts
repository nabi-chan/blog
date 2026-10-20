// 앱 코드는 Paraglide 를 직접 import 하지 않고 이 파일을 거친다.
// 스파이크에서 직접 구현으로 되돌릴 때 이 파일과 messages.ts 만 바꾸면 되게 하려는 것이다
import { stripTrailingSlash } from './url'
import { localizeHref as paraglideLocalizeHref, localizeUrl as paraglideLocalizeUrl } from '~/paraglide/runtime'

export { baseLocale, deLocalizeUrl, getLocale, locales, type Locale } from '~/paraglide/runtime'

// Paraglide 는 '/' 를 '/en/' 로 만든다. 정규 URL(슬래시 없음)로 맞춘다
export const localizeHref: typeof paraglideLocalizeHref = (href, options) =>
  stripTrailingSlash(paraglideLocalizeHref(href, options))

export const localizeUrl: typeof paraglideLocalizeUrl = (url, options) => {
  const localized = paraglideLocalizeUrl(url, options)
  localized.pathname = stripTrailingSlash(localized.pathname)
  return localized
}
