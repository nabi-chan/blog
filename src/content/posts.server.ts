// Content Collections 생성물을 조회 로직에 연결만 한다 (로직은 post-queries.ts)
import { allEnPosts, allGlossaries, allKoPosts, allLobbyIntros, allTagLabels } from 'content-collections'
import type { Locale } from '~/i18n/runtime'
import { type PostMeta, createPostIndex } from './post-index'
import { type BodyKey, type PostBody, createPostQueries } from './post-queries'

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

export const queries = createPostQueries({
  index: createPostIndex(allKoPosts.map(toMeta), allEnPosts.map(toMeta)),
  tagLabels: allTagLabels[0]?.tags ?? [],
  bodies: new Map<BodyKey, PostBody>(
    docs.map((doc) => [`${doc.locale}/${doc.slug}`, { html: doc.html, toc: doc.toc, terms: doc.terms }]),
  ),
  glossary: Object.fromEntries((allGlossaries[0]?.terms ?? []).map(({ key, ko, en }) => [key, { ko, en }])),
  intros: new Map<Locale, PostBody>(
    allLobbyIntros.map((intro) => [intro.locale as Locale, { html: intro.html, toc: intro.toc, terms: intro.terms }]),
  ),
})
