// 모든 응답에 다는 보안 헤더. 정적 에셋은 public/_headers(headersFile 출력)가, Worker 응답은 withSecurityHeaders 가 단다.
// script-src 'unsafe-inline' 은 TanStack Start 가 페이지마다 넣는 인라인 하이드레이션 스크립트 때문이다. 프리렌더 페이지라 nonce 를 쓸 수 없다.
// Turnstile 은 challenges.cloudflare.com 의 스크립트와 iframe 을 쓴다 (src/features/comment/ui/Turnstile.tsx).
// Cloudflare Web Analytics 는 Cloudflare 가 운영 응답에 비콘을 끼워 넣는다(static.cloudflareinsights.com 스크립트, cloudflareinsights.com 전송)
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://cloudflareinsights.com",
  'frame-src https://challenges.cloudflare.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
}

// 응답 헤더는 불변일 수 있어서(Response.redirect 등) 복사한 뒤 단다
export function withSecurityHeaders(response: Response): Response {
  const copy = new Response(response.body, response)
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) copy.headers.set(name, value)
  return copy
}

// Vite 빌드 산출물(JS·CSS·폰트)은 이름에 내용 해시가 붙어 내용이 바뀌면 주소도 바뀐다. 그래서 1년 동안 다시 묻지 않게 한다.
// 나머지 정적 파일(HTML·OG 이미지·llms 등)은 Workers 정적 에셋 기본값(max-age=0, must-revalidate)을 그대로 쓴다
export const IMMUTABLE_ASSET_CACHE = 'public, max-age=31536000, immutable'

// Workers 정적 에셋의 _headers 형식. public/_headers 는 이 출력 그대로다 (테스트가 확인한다).
// 요청이 여러 규칙에 걸리면 모든 규칙의 헤더가 붙으므로 /assets/* 는 보안 헤더와 캐시 헤더를 같이 받는다
export function headersFile(): string {
  const lines = Object.entries(SECURITY_HEADERS).map(([name, value]) => `  ${name}: ${value}`)
  return `/*\n${lines.join('\n')}\n/assets/*\n  Cache-Control: ${IMMUTABLE_ASSET_CACHE}\n`
}
