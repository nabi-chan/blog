import { handleCreateComment, handleDeleteComment, handleEditComment, handleListComments, handleMe } from './comments'
import { apiError, isSameOrigin } from '../shared/api/index.server'
import { handleRecordView } from './views'
import type { ApiContext } from '~/shared/api/index.server'

type Handler = (request: Request, ctx: ApiContext, param: string) => Promise<Response>
type Route = { pattern: RegExp; handlers: Partial<Record<string, Handler>> }

const ROUTES: Route[] = [
  { pattern: /^\/api\/me$/, handlers: { GET: (_request, ctx) => handleMe(ctx) } },
  {
    pattern: /^\/api\/posts\/([^/]+)\/comments$/,
    handlers: {
      GET: (_request, ctx, slug) => handleListComments(ctx, slug),
      POST: handleCreateComment,
    },
  },
  { pattern: /^\/api\/comments\/([^/]+)$/, handlers: { PATCH: handleEditComment, DELETE: handleDeleteComment } },
  { pattern: /^\/api\/views$/, handlers: { POST: handleRecordView } },
]

function matchRoute(pathname: string): { route: Route; param: string } | null {
  for (const route of ROUTES) {
    const match = route.pattern.exec(pathname)
    if (!match) continue
    try {
      return { route, param: decodeURIComponent(match[1] ?? '') }
    } catch {
      // 디코딩할 수 없는 조각은 없는 경로로 본다
      return null
    }
  }
  return null
}

export async function routeApi(request: Request, ctx: ApiContext): Promise<Response> {
  const { pathname } = new URL(request.url)
  const match = matchRoute(pathname)
  if (!match) return apiError(404, 'not_found')
  const handler = match.route.handlers[request.method]
  if (!handler) return apiError(405, 'invalid_input')
  if (request.method !== 'GET' && !isSameOrigin(request)) return apiError(403, 'forbidden_origin')
  try {
    return await handler(request, ctx, match.param)
  } catch (error) {
    // D1 오류 등. 0 이나 빈 목록으로 덮지 않고 장애로 알린다 (스펙 4.12)
    console.error('[api] 요청 처리 실패', request.method, pathname, error)
    return apiError(503, 'unavailable')
  }
}
