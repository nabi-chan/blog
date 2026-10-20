import type { FeedItem } from '~/content/post-queries'
import type { Locale } from '~/i18n/runtime'
import { site } from '~/site'
import { absoluteUrl, pageUrl } from './url'

const LABELS = {
  ko: { author: '작성자', links: '링크', posts: '글', full: '전체 원문' },
  en: { author: 'Author', links: 'Links', posts: 'Posts', full: 'Full text' },
} as const

// llms.txt (https://llmstxt.org). 글은 Markdown 원문(.md)으로 잇는다 (스펙 4.9)
export function buildLlmsTxt(input: { locale: Locale; description: string; items: FeedItem[] }): string {
  const label = LABELS[input.locale]
  const posts = input.items.map(({ post }) => `- [${post.title}](${pageUrl(`/${post.slug}.md`, input.locale)}): ${post.description}`)
  return [
    `# ${site.name}`,
    `> ${input.description}`,
    `${label.author}: ${site.author}`,
    `## ${label.links}`,
    [
      `- [RSS](${pageUrl('/rss.xml', input.locale)})`,
      `- [Sitemap](${absoluteUrl('/sitemap.xml')})`,
      `- [${label.full}](${absoluteUrl('/llms-full.txt')})`,
    ].join('\n'),
    `## ${label.posts}`,
    posts.length > 0 ? posts.join('\n') : '- (none)',
    '',
  ].join('\n\n')
}

// 공개 글 전체 원문. 한국어 글 다음에 영어 번역을 둔다
export function buildLlmsFull(input: { ko: FeedItem[]; en: FeedItem[] }): string {
  const section = ({ post, markdown }: FeedItem) =>
    [
      `# ${post.title}`,
      [
        `URL: ${pageUrl(`/${post.slug}`, post.locale)}`,
        `Date: ${post.date}`,
        ...(post.updated === undefined ? [] : [`Updated: ${post.updated}`]),
        `Language: ${post.locale}`,
      ].join('\n'),
      markdown.trim(),
      '---',
    ].join('\n\n')
  return `${[...input.ko, ...input.en].map(section).join('\n\n')}\n`
}
