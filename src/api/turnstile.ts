export type TurnstileOutcome = 'ok' | 'failed' | 'unavailable'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const MAX_TOKEN_LENGTH = 2048
const SECRET_ERRORS = new Set(['missing-input-secret', 'invalid-input-secret'])

// 토큰은 한 번만 검증된다. 실패(사람 확인 실패·재사용)와 장애(siteverify 에 닿지 못함)를 구분해서 돌려준다
export async function verifyTurnstile(
  token: string,
  options: { secret: string; remoteIp: string; fetchFn?: typeof fetch },
): Promise<TurnstileOutcome> {
  if (!token || token.length > MAX_TOKEN_LENGTH) return 'failed'
  const body = new URLSearchParams({ secret: options.secret, response: token })
  if (options.remoteIp) body.set('remoteip', options.remoteIp)
  try {
    const res = await (options.fetchFn ?? fetch)(SITEVERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      console.error('[turnstile] siteverify 응답 오류', res.status)
      return 'unavailable'
    }
    const result = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (result.success === true) return 'ok'
    const codes = result['error-codes'] ?? []
    // 시크릿 설정 오류는 방문자 탓이 아니다. 403 으로 덮지 않고 장애로 알린다
    if (codes.some((code) => SECRET_ERRORS.has(code))) {
      console.error('[turnstile] 시크릿 설정 오류', codes)
      return 'unavailable'
    }
    console.warn('[turnstile] 검증 실패', codes)
    return 'failed'
  } catch (error) {
    console.error('[turnstile] siteverify 요청 실패', error)
    return 'unavailable'
  }
}
