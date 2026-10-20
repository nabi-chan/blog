import type { ApiErrorCode } from './types'

const MAX_JSON_BYTES = 16_384

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export function apiError(status: number, error: ApiErrorCode): Response {
  return json(status, { error })
}

// 쓰기 요청의 CSRF 방어. 브라우저는 같은 사이트의 POST·PATCH·DELETE 에도 Origin 을 붙인다
export function isSameOrigin(request: Request): boolean {
  return request.headers.get('origin') === new URL(request.url).origin
}

// TanStack getRequestIP() 는 이 헤더를 보지 않는다. 원본 IP 는 해시 입력으로만 쓰고 저장하지 않는다
export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? ''
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator !== -1 && part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim()
  }
  return undefined
}

// content-type 이 JSON 이 아니거나, 너무 크거나, 깨졌으면 undefined (호출하는 쪽이 400 으로 바꾼다)
export async function readJson(request: Request, maxBytes = MAX_JSON_BYTES): Promise<unknown> {
  const type = request.headers.get('content-type') ?? ''
  if (!/^application\/json(\s*;|$)/i.test(type)) return undefined
  // 길이를 미리 밝힌 큰 본문은 읽지도 않는다. 밝히지 않았으면 읽은 뒤에 잰다
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) return undefined
  const text = await request.text()
  if (new TextEncoder().encode(text).length > maxBytes) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const RETURN_BASE = 'https://return.invalid'

// Access 로그인 뒤 돌아갈 경로. 같은 사이트 경로만 허용하고, /admin 으로 되돌아가는 루프는 막는다
export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  const url = new URL(value, RETURN_BASE)
  if (url.origin !== RETURN_BASE) return '/'
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) return '/'
  return `${url.pathname}${url.search}${url.hash}`
}
