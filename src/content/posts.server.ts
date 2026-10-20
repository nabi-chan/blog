// Content Collections 생성물을 조회 로직에 연결만 한다 (로직은 post-queries.ts)
import { allEnPosts, allKoPosts, allTagLabels } from 'content-collections'
import { type PostMeta, createPostIndex } from './post-index'
import { createPostQueries } from './post-queries'

const toMeta = ({ slug, locale, title, description, date, updated, tags, draft }: PostMeta): PostMeta => ({
  slug,
  locale,
  title,
  description,
  date,
  updated,
  tags,
  draft,
})

export const queries = createPostQueries({
  index: createPostIndex(allKoPosts.map(toMeta), allEnPosts.map(toMeta)),
  tagLabels: allTagLabels[0]?.tags ?? [],
})
