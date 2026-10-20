import handler from '@tanstack/react-start/server-entry'
import { cleanup } from '~/api/cleanup'
import { createApiContext } from '~/api/context'
import { safeReturnPath } from '~/shared/api/index.server'
import { routeApi } from '~/api/router'
import { postIndex } from '~/content/posts.server'
import { discoveryLinks, markdownAlternate, prefersMarkdown } from '~/lib/markdown-negotiation'
import { withSecurityHeaders } from '~/shared/lib/security-headers'
import { isMalformedPath } from '~/lib/url-guard'
import { paraglideMiddleware } from '~/paraglide/server'
import { site } from '~/shared/config'

export default {
  // 정적 에셋 응답은 public/_headers 가, Worker 응답은 여기서 같은 보안 헤더를 단다
  async fetch(req, env) {
    return withSecurityHeaders((await negotiate(req, env)) ?? (await respond(req, env)))
  },
  scheduled(controller, env, ctx) {
    ctx.waitUntil(cleanup(env.DB, new Date(controller.scheduledTime)).then((removed) => console.log('[cron] 정리 완료', removed)))
  },
} satisfies ExportedHandler<Env>

const POST_PATH = /^\/(en\/)?\d/

// 홈과 글은 Worker 가 먼저 받는다(wrangler.jsonc run_worker_first). Accept 가 text/markdown 을 원하면 Markdown 원문을,
// 아니면 프리렌더 HTML 을 그대로 낸다. 정적 파일이 없으면(없는 글) null 을 돌려 기존 경로가 404 문서를 그리게 한다
async function negotiate(req: Request, env: Env): Promise<Response | null> {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null
  const url = new URL(req.url)
  const alternate = markdownAlternate(url.pathname)
  if (alternate === null && !POST_PATH.test(url.pathname)) return null
  if (alternate !== null && prefersMarkdown(req.headers.get('accept'))) {
    const markdown = await env.ASSETS.fetch(new URL(alternate, url))
    if (markdown.ok) {
      const headers = new Headers(markdown.headers)
      headers.set('content-type', 'text/markdown; charset=utf-8')
      headers.set('content-signal', site.contentSignal)
      headers.append('vary', 'Accept')
      return new Response(markdown.body, { status: 200, headers })
    }
    // 원문이 없으면 페이지도 없다. HTML 이 아닌 요청이라 TanStack 은 406 을 내므로 여기서 404 로 끝낸다
    return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', vary: 'Accept' } })
  }
  const asset = await env.ASSETS.fetch(req)
  if (asset.status === 404) return null
  if (alternate === null) return asset
  const html = new Response(asset.body, asset)
  html.headers.append('vary', 'Accept')
  const links = discoveryLinks(url.pathname)
  if (links !== null && asset.ok) html.headers.set('link', links)
  return html
}

function respond(req: Request, env: Env): Promise<Response> {
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
  return renderPage(req)
}

// TanStack 은 HTML 을 받지 않는 요청(Accept: application/json 등)에 경로와 상관없이 406 을 낸다.
// 없는 주소라면 404 가 맞으므로, 406 일 때만 HTML 로 다시 물어서 404 인지 확인한다
async function renderPage(req: Request): Promise<Response> {
  const response = await paraglideMiddleware(req, () => handler.fetch(req))
  // 본문이 있는 요청은 다시 보낼 수 없으니 GET·HEAD 만 확인한다
  if (response.status !== 406 || (req.method !== 'GET' && req.method !== 'HEAD')) return response
  const headers = new Headers(req.headers)
  headers.set('accept', 'text/html')
  const probeRequest = new Request(req, { headers })
  const probe = await paraglideMiddleware(probeRequest, () => handler.fetch(probeRequest))
  if (probe.status !== 404) return response
  return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
