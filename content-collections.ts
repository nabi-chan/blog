import { type WriterHook, defineCollection, defineConfig } from '@content-collections/core'
import { z } from 'zod'
import { DESCRIPTION_MAX, SLUG_PATTERN, TAG_PATTERN } from './src/content/constants'
import { parseKstDate } from './src/content/date'
import { resolveEnPost } from './src/content/resolve-en-post'
import { computeSourceHash } from './src/content/source-hash'

const isProduction = () => process.env.NODE_ENV === 'production'

function slugOf(directory: string): string {
  if (!SLUG_PATTERN.test(directory)) {
    throw new Error(`${directory}: 글 폴더 이름은 소문자 kebab-case 여야 합니다`)
  }
  return directory
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
  transform: (doc, { skip }) => {
    if (doc.draft && isProduction()) return skip('draft')
    return {
      slug: slugOf(doc._meta.directory),
      locale: 'ko' as const,
      title: doc.title,
      description: doc.description,
      date: parseKstDate(doc.date),
      updated: doc.updated === undefined ? undefined : parseKstDate(doc.updated),
      tags: doc.tags,
      draft: doc.draft,
      sourceHash: computeSourceHash({ title: doc.title, description: doc.description, body: doc.content }),
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
  transform: async (doc, { documents, skip }) => {
    const slug = slugOf(doc._meta.directory)
    // documents() 는 변환 전 문서를 돌려주므로 원문 content 가 들어 있다
    const ko = documents(koPosts).find((candidate) => candidate._meta.directory === slug)
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
    return result.post
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
