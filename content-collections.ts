import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { type Context, type WriterHook, defineCollection, defineConfig } from '@content-collections/core'
import { z } from 'zod'
import { DESCRIPTION_MAX, SLUG_PATTERN, TAG_PATTERN } from './src/content/constants'
import { parseKstDate } from './src/content/date'
import { resolveEnPost } from './src/content/resolve-en-post'
import { computeSourceHash } from './src/content/source-hash'
import { writeAssets } from './src/markdown/assets'
import { renderMarkdown } from './src/markdown/render'

type CacheFn = Context['cache']

const isProduction = () => process.env.NODE_ENV === 'production'

function slugOf(directory: string): string {
  if (!SLUG_PATTERN.test(directory)) {
    throw new Error(`${directory}: 글 폴더 이름은 소문자 kebab-case 여야 합니다`)
  }
  return directory
}

type RenderInput = { markdown: string; filePath: string; slug: string; locale: 'ko' | 'en'; enSlugs: string[] }

// 글 폴더의 이미지 등 본문 외 파일 내용을 요약한다. 이미지만 바뀌어도 캐시를 다시 만들게 하려는 것이다
function siblingFingerprint(postDir: string): string {
  const hash = createHash('sha256')
  for (const name of readdirSync(postDir).sort()) {
    if (/^index\.[a-z]+\.md$/.test(name)) continue
    hash.update(name).update(readFileSync(join(postDir, name)))
  }
  return hash.digest('hex')
}

// 렌더 결과는 입력(본문·언어·영어 번역본 목록·글 폴더 파일)이 같으면 캐시에서 가져온다.
// 이미지 파일 쓰기는 캐시와 상관없이 매번 한다 (빌드 전에 public/content-assets 를 비우기 때문)
async function render(cache: CacheFn, input: RenderInput) {
  const filePath = join('content/posts', input.filePath)
  const key = { ...input, enSlugs: [...input.enSlugs].sort(), siblings: siblingFingerprint(join('content/posts', input.slug)) }
  const result = await cache(key, (value) =>
    renderMarkdown(value.markdown, {
      filePath,
      slug: value.slug,
      locale: value.locale,
      enSlugs: new Set(value.enSlugs),
    }),
  )
  await writeAssets(result.assets)
  return result
}

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
  transform: async (doc, { cache, skip }) => {
    if (doc.draft && isProduction()) return skip('draft')
    const slug = slugOf(doc._meta.directory)
    // 한국어 본문의 내부 링크는 언제나 한국어 글을 가리키므로 영어 번역본 목록이 필요 없다
    const body = await render(cache, { markdown: doc.content, filePath: doc._meta.filePath, slug, locale: 'ko', enSlugs: [] })
    return {
      slug,
      locale: 'ko' as const,
      title: doc.title,
      description: doc.description,
      date: parseKstDate(doc.date),
      updated: doc.updated === undefined ? undefined : parseKstDate(doc.updated),
      tags: doc.tags,
      draft: doc.draft,
      sourceHash: computeSourceHash({ title: doc.title, description: doc.description, body: doc.content }),
      html: body.html,
      toc: body.toc,
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
    const slug = slugOf(doc._meta.directory)
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
    // 영어 본문의 내부 링크는 실제로 공개되는 영어 번역본이 있을 때만 /en 으로 바꾼다
    const enSlugs = (await collection.documents())
      .map((sibling) => sibling._meta.directory)
      .filter((sibling) => {
        const source = koDocs.find((candidate) => candidate._meta.directory === sibling)
        return source !== undefined && !(source.draft && isProduction())
      })
    const body = await render(cache, { markdown: doc.content, filePath: doc._meta.filePath, slug, locale: 'en', enSlugs })
    return { ...result.post, html: body.html, toc: body.toc }
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
  content: [enPosts, koPosts, tagLabels],
  hooks: { writer: [serverOnlyHook] },
})
