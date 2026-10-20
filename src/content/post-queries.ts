import type { Locale } from '~/i18n/runtime'
import type { TocItem } from '../markdown/rehype-toc'
import { type PostIndex, type PostMeta, collectTags } from './post-index'

export type TagRef = { key: string; label: string }
export type TagLabels = Array<{ key: string; ko: string; en: string }>

export function tagRefs(keys: string[], locale: Locale, labels: TagLabels): TagRef[] {
  const table = new Map(labels.map((label) => [label.key, label]))
  return keys.map((key) => ({ key, label: table.get(key)?.[locale] ?? key }))
}

export type PostBody = { html: string; toc: TocItem[] }
export type BodyKey = `${Locale}/${string}`
export type PostPage = { post: PostMeta; available: Locale[]; tags: TagRef[]; html: string; toc: TocItem[] }

export type PostQueries = {
  listPosts(locale: Locale): { posts: PostMeta[]; tags: TagRef[] }
  getPostPage(locale: Locale, slug: string): PostPage | null
}

// 서버 함수가 쓰는 조회 로직. Content Collections 데이터는 posts.server.ts 가 넣어 준다
export function createPostQueries(input: {
  index: PostIndex
  tagLabels: TagLabels
  bodies: ReadonlyMap<BodyKey, PostBody>
}): PostQueries {
  return {
    listPosts: (locale) => {
      const posts = input.index.list(locale)
      return { posts, tags: tagRefs(collectTags(posts), locale, input.tagLabels) }
    },
    getPostPage: (locale, slug) => {
      const post = input.index.get(locale, slug)
      if (!post) return null
      const body = input.bodies.get(`${locale}/${slug}`)
      if (!body) throw new Error(`${locale}/${slug}: 글 메타는 있는데 본문이 없습니다`)
      return {
        post,
        available: input.index.locales(slug),
        tags: tagRefs(post.tags, locale, input.tagLabels),
        html: body.html,
        toc: body.toc,
      }
    },
  }
}
