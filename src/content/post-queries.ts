import type { Locale } from '~/i18n/runtime'
import type { TocItem } from '../markdown/rehype-toc'
import type { Glossary, GlossaryEntry } from '../markdown/remark-term'
import { type PostIndex, type PostMeta, collectTags } from './post-index'

export type TagRef = { key: string; label: string }
export type TagLabels = Array<{ key: string; ko: string; en: string }>

export function tagRefs(keys: string[], locale: Locale, labels: TagLabels): TagRef[] {
  const table = new Map(labels.map((label) => [label.key, label]))
  return keys.map((key) => ({ key, label: table.get(key)?.[locale] ?? key }))
}

export type PostBody = { html: string; toc: TocItem[]; terms: string[] }
// 글 원문(이미지 경로를 절대 URL 로 바꾼 Markdown)과 단어 수
export type PostSource = { markdown: string; wordCount: number }
export type FeedItem = { post: PostMeta; tags: TagRef[]; html: string; markdown: string }
export type BodyKey = `${Locale}/${string}`
export type PostPage = {
  post: PostMeta
  available: Locale[]
  tags: TagRef[]
  html: string
  toc: TocItem[]
  terms: Record<string, GlossaryEntry>
  wordCount: number
}

export type LobbyIntro = { html: string; terms: Record<string, GlossaryEntry> }

export type PostQueries = {
  listPosts(locale: Locale): { posts: PostMeta[]; tags: TagRef[] }
  getPostPage(locale: Locale, slug: string): PostPage | null
  getLobbyIntro(locale: Locale): LobbyIntro | null
  // RSS·llms 용. draft 를 빼고 날짜 내림차순
  listFeed(locale: Locale): FeedItem[]
  // 글별 .md 원문. 없거나 draft 면 null
  getMarkdown(locale: Locale, slug: string): string | null
}

// 서버 함수가 쓰는 조회 로직. Content Collections 데이터는 posts.server.ts 가 넣어 준다
export function createPostQueries(input: {
  index: PostIndex
  tagLabels: TagLabels
  bodies: ReadonlyMap<BodyKey, PostBody>
  sources: ReadonlyMap<BodyKey, PostSource>
  glossary: Glossary
  intros: ReadonlyMap<Locale, PostBody>
}): PostQueries {
  // 본문에서 쓴 용어의 그 언어 정의만 내려보낸다 (툴팁용)
  const termsFor = (keys: string[], locale: Locale) =>
    Object.fromEntries(keys.map((key) => [key, input.glossary[key][locale]]))

  const lookup = <T>(map: ReadonlyMap<BodyKey, T>, locale: Locale, slug: string): T => {
    const value = map.get(`${locale}/${slug}`)
    if (value === undefined) throw new Error(`${locale}/${slug}: 글 메타는 있는데 본문이나 원문이 없습니다`)
    return value
  }

  return {
    listPosts: (locale) => {
      const posts = input.index.list(locale)
      return { posts, tags: tagRefs(collectTags(posts), locale, input.tagLabels) }
    },
    getPostPage: (locale, slug) => {
      const post = input.index.get(locale, slug)
      if (!post) return null
      const body = lookup(input.bodies, locale, slug)
      return {
        post,
        available: input.index.locales(slug),
        tags: tagRefs(post.tags, locale, input.tagLabels),
        html: body.html,
        toc: body.toc,
        terms: termsFor(body.terms, locale),
        wordCount: lookup(input.sources, locale, slug).wordCount,
      }
    },
    getLobbyIntro: (locale) => {
      const intro = input.intros.get(locale)
      return intro ? { html: intro.html, terms: termsFor(intro.terms, locale) } : null
    },
    listFeed: (locale) =>
      input.index
        .list(locale)
        .filter((post) => !post.draft)
        .map((post) => ({
          post,
          tags: tagRefs(post.tags, locale, input.tagLabels),
          html: lookup(input.bodies, locale, post.slug).html,
          markdown: lookup(input.sources, locale, post.slug).markdown,
        })),
    getMarkdown: (locale, slug) => {
      const post = input.index.get(locale, slug)
      if (!post || post.draft) return null
      return lookup(input.sources, locale, slug).markdown
    },
  }
}
