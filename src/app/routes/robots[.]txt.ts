import { createFileRoute } from '@tanstack/react-router'
import { getLocale } from '~/shared/i18n'
import { buildRobots } from '~/app/seo/robots'

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
