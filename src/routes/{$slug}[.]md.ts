import { createFileRoute } from '@tanstack/react-router'
import { queries } from '~/content/posts.server'
import { getLocale } from '~/i18n/runtime'

// 글별 Markdown 원문 (/<slug>.md, /en/<slug>.md). frontmatter 없이 본문만, 이미지는 절대 URL 이다 (스펙 4.9)
export const Route = createFileRoute('/{$slug}.md')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const markdown = queries.getMarkdown(getLocale(), params.slug)
        return markdown === null
          ? new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
          : new Response(markdown, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
      },
    },
  },
})
