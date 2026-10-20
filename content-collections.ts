import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type Context, type WriterHook, defineCollection, defineConfig } from '@content-collections/core'
import { z } from 'zod'
import { DESCRIPTION_MAX, TAG_PATTERN } from './src/content/constants'
import { folderFingerprint } from './src/content/fingerprint'
import { parseKstDate } from './src/content/date'
import { resolveEnPost } from './src/content/resolve-en-post'
import { sameDayConflicts, validateSlug } from './src/content/slug'
import { computeSourceHash } from './src/content/source-hash'
import { absolutizeMarkdownImages, countWords } from './src/markdown/agent-markdown'
import { writeAssets } from './src/markdown/assets'
import { type Glossary, renderMarkdown } from './src/markdown/render'
import { postCard, siteCard } from './src/og/card'
import { writeOgImage } from './src/og/render'
import { site } from './src/site'
import { widgetNames } from './src/widgets/names'

type CacheFn = Context['cache']

// 렌더 결과의 모양이나 플러그인 동작이 바뀌면 올린다. 캐시 키에 들어가서 예전 캐시를 쓰지 않게 한다
// 2: RenderResult.images 추가 (계획 3)
const RENDER_VERSION = 2

// OG 이미지 (스펙 4.9). public/og 는 빌드마다 비우고, 그린 PNG 는 여기 캐시에서 복사한다
const OG_CACHE_DIR = 'node_modules/.cache/og'
const ogFile = (locale: string, name: string) => join('public/og', locale, `${name}.png`)

// 사이트 기본 카드 설명. Paraglide 컴파일보다 먼저 돌 수 있어서 메시지 파일을 직접 읽는다
const siteDescription = (locale: 'ko' | 'en'): string =>
  (JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as { site_description: string }).site_description

const isProduction = () => process.env.NODE_ENV === 'production'

type RenderInput = {
  markdown: string
  // 원본 파일이 있는 폴더(이미지 상대 경로의 기준)와 그 안의 파일 이름
  dir: string
  fileName: string
  // 이미지 공개 경로 /content-assets/<slug>/ 에 쓰는 이름
  slug: string
  locale: 'ko' | 'en'
  enSlugs: string[]
  glossary: Glossary
}

// 렌더 결과는 입력(본문·언어·영어 번역본 목록·글 폴더 파일)이 같으면 캐시에서 가져온다.
// 이미지 파일 쓰기는 캐시와 상관없이 매번 한다 (빌드 전에 public/content-assets 를 비우기 때문)
async function render(cache: CacheFn, input: RenderInput) {
  const filePath = join(input.dir, input.fileName)
  const key = {
    ...input,
    enSlugs: [...input.enSlugs].sort(),
    siblings: folderFingerprint(input.dir, (name) => /^index\.[a-z]+\.md$/.test(name)),
    widgetNames: [...widgetNames],
    renderVersion: RENDER_VERSION,
  }
  const result = await cache(key, (value) =>
    renderMarkdown(value.markdown, {
      filePath,
      slug: value.slug,
      locale: value.locale,
      enSlugs: new Set(value.enSlugs),
      glossary: value.glossary,
      widgetNames: value.widgetNames,
    }),
  )
  await writeAssets(result.assets)
  return result
}

const glossary = defineCollection({
  name: 'glossary',
  directory: 'content',
  include: 'glossary.yaml',
  parser: 'yaml',
  schema: z.object({
    terms: z.array(
      z.object({
        key: z.string().regex(TAG_PATTERN),
        ko: z.object({ name: z.string().min(1), definition: z.string().min(1) }),
        en: z.object({ name: z.string().min(1), definition: z.string().min(1) }),
      }),
    ),
  }),
})

type GlossaryDoc = { terms: Array<{ key: string; ko: Glossary[string]['ko']; en: Glossary[string]['en'] }> }

const toGlossary = (docs: GlossaryDoc[]): Glossary =>
  Object.fromEntries((docs[0]?.terms ?? []).map(({ key, ko, en }) => [key, { ko, en }]))

const koPosts = defineCollection({
  name: 'koPosts',
  directory: 'content/posts',
  include: '*/index.ko.md',
  parser: 'frontmatter',
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(DESCRIPTION_MAX),
    date: z.string(),
    updated: z.string().optional(),
    tags: z.array(z.string().regex(TAG_PATTERN)).default([]),
    draft: z.boolean().default(false),
    content: z.string(),
  }),
  transform: async (doc, { cache, collection, documents, skip }) => {
    const slug = doc._meta.directory
    const date = parseKstDate(doc.date)
    validateSlug(slug, date)
    // 하루 한 편: draft 여부와 상관없이 같은 날짜 폴더가 둘이면 멈춘다
    const conflicts = sameDayConflicts(slug, (await collection.documents()).map((sibling) => sibling._meta.directory))
    if (conflicts.length > 0) throw new Error(`${slug}: 같은 날짜의 글이 이미 있습니다 (${conflicts.join(', ')}). 하루에 한 편만 씁니다`)
    if (doc.draft && isProduction()) return skip('draft')
    await writeOgImage(postCard({ title: doc.title, date, locale: 'ko' }), ogFile('ko', slug), OG_CACHE_DIR)
    // 한국어 본문의 내부 링크는 언제나 한국어 글을 가리키므로 영어 번역본 목록이 필요 없다
    const body = await render(cache, {
      markdown: doc.content,
      dir: join('content/posts', slug),
      fileName: doc._meta.fileName,
      slug,
      locale: 'ko',
      enSlugs: [],
      glossary: toGlossary(documents(glossary)),
    })
    return {
      slug,
      locale: 'ko' as const,
      title: doc.title,
      description: doc.description,
      date,
      updated: doc.updated === undefined ? undefined : parseKstDate(doc.updated),
      tags: doc.tags,
      draft: doc.draft,
      sourceHash: computeSourceHash({ title: doc.title, description: doc.description, body: doc.content }),
      html: body.html,
      toc: body.toc,
      terms: body.terms,
      // 글 원문(.md, llms-full). 글 옆 이미지 경로만 절대 URL 로 바꾼다
      markdown: absolutizeMarkdownImages(doc.content, body.images, site.url),
      wordCount: countWords(doc.content),
    }
  },
})

const enPosts = defineCollection({
  name: 'enPosts',
  directory: 'content/posts',
  include: '*/index.en.md',
  parser: 'frontmatter',
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(DESCRIPTION_MAX),
    sourceHash: z.string().regex(/^[0-9a-f]{64}$/),
    translationStatus: z.enum(['machine', 'reviewed']),
    content: z.string(),
  }),
  transform: async (doc, { cache, collection, documents, skip }) => {
    // slug 형식과 날짜는 원문(koPosts) 쪽에서 검사한다. 원문이 없으면 resolveEnPost 가 멈춘다
    const slug = doc._meta.directory
    // documents() 는 변환 전 문서를 돌려주므로 원문 content 가 들어 있다 (아래 content 순서 참고)
    const koDocs = documents(koPosts)
    const ko = koDocs.find((candidate) => candidate._meta.directory === slug)
    const result = resolveEnPost(
      { slug, title: doc.title, description: doc.description, sourceHash: doc.sourceHash, translationStatus: doc.translationStatus },
      ko && {
        slug,
        title: ko.title,
        description: ko.description,
        content: ko.content,
        date: parseKstDate(ko.date),
        updated: ko.updated === undefined ? undefined : parseKstDate(ko.updated),
        tags: ko.tags,
        draft: ko.draft,
      },
      { production: isProduction() },
    )
    if (result.kind === 'skip') return skip('draft')
    await writeOgImage(postCard({ title: result.post.title, date: result.post.date, locale: 'en' }), ogFile('en', slug), OG_CACHE_DIR)
    // 영어 본문의 내부 링크는 실제로 공개되는 영어 번역본이 있을 때만 /en 으로 바꾼다
    const enSlugs = (await collection.documents())
      .map((sibling) => sibling._meta.directory)
      .filter((sibling) => {
        const source = koDocs.find((candidate) => candidate._meta.directory === sibling)
        return source !== undefined && !(source.draft && isProduction())
      })
    const body = await render(cache, {
      markdown: doc.content,
      dir: join('content/posts', slug),
      fileName: doc._meta.fileName,
      slug,
      locale: 'en',
      enSlugs,
      glossary: toGlossary(documents(glossary)),
    })
    return {
      ...result.post,
      html: body.html,
      toc: body.toc,
      terms: body.terms,
      markdown: absolutizeMarkdownImages(doc.content, body.images, site.url),
      wordCount: countWords(doc.content),
    }
  },
})

// Lobby 소개글. content/lobby/index.ko.md, index.en.md 에 글과 같은 Markdown 으로 쓴다
const lobbyIntros = defineCollection({
  name: 'lobbyIntros',
  directory: 'content/lobby',
  include: 'index.*.md',
  parser: 'frontmatter',
  schema: z.object({ content: z.string() }),
  transform: async (doc, { cache, documents }) => {
    const locale = /^index\.(ko|en)$/.exec(doc._meta.path)?.[1]
    if (locale !== 'ko' && locale !== 'en') throw new Error(`${doc._meta.filePath}: index.ko.md 또는 index.en.md 여야 합니다`)
    // Lobby·Posts·404 가 쓰는 사이트 기본 OG 이미지. 언어마다 한 장이라 소개글 변환에서 만든다
    await writeOgImage(siteCard({ locale, description: siteDescription(locale) }), ogFile(locale, 'site'), OG_CACHE_DIR)
    // 영어 소개글의 글 링크도 공개되는 영어 번역본이 있을 때만 /en 으로 바꾼다.
    // enPosts 는 이미 변환이 끝나서 documents() 가 변환 결과(slug 있음, draft 는 빠짐)를 돌려준다. 타입은 변환 전 모양이라 둘 다 받는다
    const enSlugs = documents(enPosts).map((post) => {
      const doc = post as { slug?: string; _meta?: { directory: string } }
      return doc.slug ?? doc._meta?.directory ?? ''
    })
    const body = await render(cache, {
      markdown: doc.content,
      dir: 'content/lobby',
      fileName: doc._meta.fileName,
      slug: 'lobby',
      locale,
      enSlugs,
      glossary: toGlossary(documents(glossary)),
    })
    return { locale, html: body.html, toc: body.toc, terms: body.terms }
  },
})

const tagLabels = defineCollection({
  name: 'tagLabels',
  directory: 'content',
  include: 'tags.yaml',
  parser: 'yaml',
  schema: z.object({
    tags: z.array(z.object({ key: z.string().regex(TAG_PATTERN), ko: z.string(), en: z.string() })),
  }),
})

// 생성물을 서버 전용으로 표시해서, 클라이언트 번들에 글 데이터가 섞이면 빌드가 실패하게 한다
const serverOnlyHook: WriterHook = async ({ fileType, content }) => {
  if (fileType === 'typeDefinition') return { content }
  return { content: `import '@tanstack/react-start/server-only';\n\n${content}` }
}

export default defineConfig({
  // 컬렉션은 이 순서대로 하나씩 변환되고, 변환이 끝난 컬렉션의 documents() 는 변환 결과를 돌려준다.
  // enPosts 가 원문의 content 와 draft 를 그대로 봐야 하므로 koPosts 보다 먼저 둔다
  // glossary 는 글보다 먼저 둔다. 글 변환이 용어집을 읽는다
  content: [glossary, enPosts, koPosts, lobbyIntros, tagLabels],
  hooks: { writer: [serverOnlyHook] },
})
