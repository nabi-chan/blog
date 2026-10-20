import type { Locale } from '~/i18n/runtime'
import { type PostIndex, type PostMeta, collectTags } from './post-index'

export type TagRef = { key: string; label: string }
export type TagLabels = Array<{ key: string; ko: string; en: string }>

export function tagRefs(keys: string[], locale: Locale, labels: TagLabels): TagRef[] {
  const table = new Map(labels.map((label) => [label.key, label]))
  return keys.map((key) => ({ key, label: table.get(key)?.[locale] ?? key }))
}

export type PostQueries = {
  listPosts(locale: Locale): { posts: PostMeta[]; tags: TagRef[] }
}

// 서버 함수가 쓰는 조회 로직. Content Collections 데이터는 posts.server.ts 가 넣어 준다
export function createPostQueries(input: { index: PostIndex; tagLabels: TagLabels }): PostQueries {
  return {
    listPosts: (locale) => {
      const posts = input.index.list(locale)
      return { posts, tags: tagRefs(collectTags(posts), locale, input.tagLabels) }
    },
  }
}
