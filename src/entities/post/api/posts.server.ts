// Content Collections 생성물을 조회 로직에 연결만 한다 (로직은 post-queries.ts)
import { allEnPosts, allGlossaries, allKoPosts, allLobbyIntros, allTagLabels } from 'content-collections'
import type { Locale } from '~/shared/i18n'
import { type PostMeta, createPostIndex } from '../model/post-index'
import { type BodyKey, type PostBody, type PostSource, createPostQueries } from '../model/post-queries'

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

const docs = [...allKoPosts, ...allEnPosts]

// 공개되는 글 목록. 댓글·조회수 API 가 있는 글인지 확인할 때도 쓴다
export const postIndex = createPostIndex(allKoPosts.map(toMeta), allEnPosts.map(toMeta))

export const queries = createPostQueries({
  index: postIndex,
  tagLabels: allTagLabels[0]?.tags ?? [],
  bodies: new Map<BodyKey, PostBody>(
    docs.map((doc) => [`${doc.locale}/${doc.slug}`, { html: doc.html, toc: doc.toc, terms: doc.terms }]),
  ),
  sources: new Map<BodyKey, PostSource>(docs.map((doc) => [`${doc.locale}/${doc.slug}`, { markdown: doc.markdown, wordCount: doc.wordCount }])),
  glossary: Object.fromEntries((allGlossaries[0]?.terms ?? []).map(({ key, ko, en }) => [key, { ko, en }])),
  intros: new Map<Locale, PostBody>(
    allLobbyIntros.map((intro) => [intro.locale as Locale, { html: intro.html, toc: intro.toc, terms: intro.terms }]),
  ),
})
