import { handleCreateComment, handleDeleteComment, handleEditComment, handleListComments, handleMe } from './comments'
import { apiError, isSameOrigin } from './http'
import type { TurnstileOutcome } from './turnstile'

// 핸들러가 쓰는 것 전부. env 를 엮는 일은 context.ts 가 하고, 테스트는 test-utils 의 testContext 로 만든다
export type ApiContext = {
  db: D1Database
  now: () => Date
  ip: string
  userAgent: string
  // 요청당 한 번만 계산된다 (context.ts 가 기억해 둔다)
  isOwner: () => Promise<boolean>
  verifyTurnstile: (token: string) => Promise<TurnstileOutcome>
  postExists: (slug: string) => boolean
  // COMMENT_PEPPER. 비밀번호 해시와 시도 제한의 방문자 키에 쓴다
  pepper: string
  // VIEW_SALT_SECRET. 조회수 방문자 키의 날짜별 솔트에 쓴다
  viewSalt: string
  // 은솔 댓글의 작성자명
  ownerName: string
  turnstileSiteKey: string
}

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
