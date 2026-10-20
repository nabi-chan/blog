import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SECURITY_HEADERS, headersFile, withSecurityHeaders } from './security-headers'

describe('withSecurityHeaders', () => {
  it('Worker 응답에 보안 헤더를 더하고 상태·기존 헤더는 그대로 둔다', async () => {
    const res = withSecurityHeaders(
      new Response('없음', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }),
    )
    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(res.headers.get('cache-control')).toBe('no-store')
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(res.headers.get(name)).toBe(value)
    expect(await res.text()).toBe('없음')
  })

  it('리다이렉트 응답도 감싼다', () => {
    const res = withSecurityHeaders(Response.redirect('https://nabichan.me/', 302))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://nabichan.me/')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})

describe('headersFile', () => {
  it('public/_headers 는 lib 에서 만든 내용과 같다', () => {
    expect(headersFile().startsWith('/*\n')).toBe(true)
    expect(readFileSync('public/_headers', 'utf8')).toBe(headersFile())
  })
})
