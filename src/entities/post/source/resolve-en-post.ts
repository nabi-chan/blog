import type { PostMeta } from '../model/post-index'
import { computeSourceHash } from './source-hash'

export type KoSource = {
  slug: string
  title: string
  description: string
  content: string
  date: string
  updated?: string
  tags: string[]
  draft: boolean
}

export type EnSource = {
  slug: string
  title: string
  description: string
  sourceHash: string
  translationStatus: 'machine' | 'reviewed'
}

export type ResolvedEnPost =
  | { kind: 'ok'; post: PostMeta & { translationStatus: EnSource['translationStatus'] } }
  | { kind: 'skip' }

// 영어 번역본을 원문과 맞춰 본다. 원문이 바뀌었으면(해시 불일치) 빌드를 멈추게 던진다
export function resolveEnPost(en: EnSource, ko: KoSource | undefined, opts: { production: boolean }): ResolvedEnPost {
  if (!ko) throw new Error(`${en.slug}: 한국어 원문이 없습니다`)
  const current = computeSourceHash({ title: ko.title, description: ko.description, body: ko.content })
  if (en.sourceHash !== current) {
    throw new Error(
      `${en.slug}: 영어 번역본이 낡았습니다. /translate-post 로 갱신하거나 번역에 영향이 없으면 pnpm content:rehash --post ${en.slug}`,
    )
  }
  if (ko.draft && opts.production) return { kind: 'skip' }
  return {
    kind: 'ok',
    post: {
      slug: en.slug,
      locale: 'en',
      title: en.title,
      description: en.description,
      date: ko.date,
      updated: ko.updated,
      tags: ko.tags,
      draft: ko.draft,
      translationStatus: en.translationStatus,
    },
  }
}
