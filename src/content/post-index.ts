import type { Locale } from '~/shared/i18n'
import { kstYear } from '../shared/lib/date'

export type PostMeta = {
  slug: string
  locale: Locale
  title: string
  description: string
  date: string
  updated?: string
  tags: string[]
  draft: boolean
}

export type PostIndex = {
  list(locale: Locale): PostMeta[]
  get(locale: Locale, slug: string): PostMeta | undefined
  locales(slug: string): Locale[]
}

const byDateDesc = (a: PostMeta, b: PostMeta) => b.date.localeCompare(a.date)

// 메서드는 this 를 쓰지 않는 클로저다. posts.locales 를 콜백으로 그대로 넘기기 때문이다
export function createPostIndex(ko: PostMeta[], en: PostMeta[]): PostIndex {
  const lists = { ko: [...ko].sort(byDateDesc), en: [...en].sort(byDateDesc) } satisfies Record<Locale, PostMeta[]>
  const maps = {
    ko: new Map(ko.map((post) => [post.slug, post])),
    en: new Map(en.map((post) => [post.slug, post])),
  } satisfies Record<Locale, Map<string, PostMeta>>

  return {
    list: (locale) => lists[locale],
    get: (locale, slug) => maps[locale].get(slug),
    locales: (slug) => (['ko', 'en'] as const).filter((locale) => maps[locale].has(slug)),
  }
}

export function groupByYear(posts: PostMeta[]): Array<{ year: number; posts: PostMeta[] }> {
  const groups = new Map<number, PostMeta[]>()
  for (const post of posts) {
    const year = kstYear(post.date)
    groups.set(year, [...(groups.get(year) ?? []), post])
  }
  return [...groups.entries()].sort(([a], [b]) => b - a).map(([year, items]) => ({ year, posts: items }))
}

export function collectTags(posts: PostMeta[]): string[] {
  const counts = new Map<string, number>()
  for (const tag of posts.flatMap((post) => post.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts.entries()].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).map(([tag]) => tag)
}
