import type { Locale } from '~/shared/i18n'

// 언어 메뉴에 보일 이름. 그 언어를 읽는 사람이 알아보도록 그 언어 자체 표기로 쓴다
export const LANGUAGE_NAMES: Record<Locale, string> = { ko: '한국어', en: 'English' }

export type LanguageOption = { locale: Locale; name: string; href: string | null; current: boolean }

// 언어가 늘어도 같은 모양으로 그릴 수 있게 목록으로 만든다. 이 화면이 없는 언어(번역 없는 글)는 링크 없이 낸다
export function languageOptions(input: {
  locales: readonly Locale[]
  current: Locale
  available: readonly Locale[]
  hrefFor: (locale: Locale) => string
}): LanguageOption[] {
  return input.locales.map((locale) => ({
    locale,
    name: LANGUAGE_NAMES[locale],
    href: input.available.includes(locale) ? input.hrefFor(locale) : null,
    current: locale === input.current,
  }))
}
