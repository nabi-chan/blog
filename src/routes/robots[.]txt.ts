import { createFileRoute } from '@tanstack/react-router'
import { getLocale } from '~/i18n/runtime'
import { buildRobots } from '~/seo/robots'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        getLocale() === 'ko'
          ? new Response(buildRobots(), { headers: { 'content-type': 'text/plain; charset=utf-8' } })
          : new Response('Not Found', { status: 404 }),
    },
  },
})
