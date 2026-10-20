import handler from '@tanstack/react-start/server-entry'
import { isMalformedPath } from '~/lib/url-guard'
import { paraglideMiddleware } from '~/paraglide/server'

export default {
  fetch(req: Request): Promise<Response> {
    if (isMalformedPath(new URL(req.url).pathname)) {
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    }
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
}
