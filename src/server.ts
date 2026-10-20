import handler from '@tanstack/react-start/server-entry'
import { cleanup } from '~/api/cleanup'
import { createApiContext } from '~/api/context'
import { safeReturnPath } from '~/api/http'
import { routeApi } from '~/api/router'
import { postIndex } from '~/content/posts.server'
import { isMalformedPath } from '~/lib/url-guard'
import { paraglideMiddleware } from '~/paraglide/server'

export default {
  fetch(req, env) {
    const url = new URL(req.url)
    if (isMalformedPath(url.pathname)) {
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    }
    // Access 로그인을 마치고 돌아온 요청이다. 같은 사이트 경로로만 되돌린다 (스펙 4.7)
    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      return Promise.resolve(
        new Response(null, { status: 302, headers: { location: safeReturnPath(url.searchParams.get('return')), 'cache-control': 'no-store' } }),
      )
    }
    if (url.pathname.startsWith('/api/')) {
      return routeApi(
        req,
        createApiContext(req, env, {
          // dev 전용 은솔 스위치. 프로덕션 빌드에서는 import.meta.env.DEV 가 false 라 읽지 않는다
          devOwner: import.meta.env.DEV && env.DEV_OWNER === '1',
          postExists: (slug) => postIndex.locales(slug).length > 0,
        }),
      )
    }
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
  scheduled(controller, env, ctx) {
    ctx.waitUntil(cleanup(env.DB, new Date(controller.scheduledTime)).then((removed) => console.log('[cron] 정리 완료', removed)))
  },
} satisfies ExportedHandler<Env>
