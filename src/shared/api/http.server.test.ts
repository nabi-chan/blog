import { describe, expect, it } from 'vitest'
import { apiError, clientIp, isSameOrigin, json, readCookie, readJson, safeReturnPath } from './http.server'

const SITE = 'https://nabichan.me'

describe('json / apiError', () => {
  it('JSON 응답을 만들고 캐시하지 않게 한다', async () => {
    const res = json(201, { a: 1 })
    expect(res.status).toBe(201)
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({ a: 1 })
  })

  it('오류는 { error } 본문이다', async () => {
    const res = apiError(403, 'wrong_password')
    expect(res.status).toBe(403)
    expect(await res.text()).toBe('{"error":"wrong_password"}')
  })
})

describe('isSameOrigin', () => {
  const request = (origin?: string) =>
    new Request(`${SITE}/api/views`, { method: 'POST', headers: origin === undefined ? {} : { origin } })

  it('Origin 이 요청 URL 의 origin 과 같을 때만 true', () => {
    expect(isSameOrigin(request(SITE))).toBe(true)
    expect(isSameOrigin(request('https://evil.example'))).toBe(false)
    expect(isSameOrigin(request('http://nabichan.me'))).toBe(false)
    expect(isSameOrigin(request('null'))).toBe(false)
    expect(isSameOrigin(request())).toBe(false)
  })
})

describe('clientIp', () => {
  it('CF-Connecting-IP 를 읽고, 없으면 빈 문자열', () => {
    expect(clientIp(new Request(SITE, { headers: { 'cf-connecting-ip': '203.0.113.7' } }))).toBe('203.0.113.7')
    expect(clientIp(new Request(SITE))).toBe('')
  })
})

describe('readCookie', () => {
  it('이름이 같은 쿠키 값을 돌려준다', () => {
    expect(readCookie('a=1; CF_Authorization=tok.en; b=2', 'CF_Authorization')).toBe('tok.en')
    expect(readCookie('CF_Authorization=x=y', 'CF_Authorization')).toBe('x=y')
  })

  it('없으면 undefined', () => {
    expect(readCookie('a=1; b=2', 'CF_Authorization')).toBeUndefined()
    expect(readCookie('xCF_Authorization=1', 'CF_Authorization')).toBeUndefined()
    expect(readCookie(null, 'CF_Authorization')).toBeUndefined()
  })
})

describe('readJson', () => {
  const post = (body: string, type = 'application/json') =>
    new Request(`${SITE}/api/x`, { method: 'POST', headers: { 'content-type': type }, body })

  it('JSON 본문을 읽는다', async () => {
    expect(await readJson(post('{"a":1}'))).toEqual({ a: 1 })
    expect(await readJson(post('{"a":1}', 'application/json; charset=utf-8'))).toEqual({ a: 1 })
  })

  it('content-type 이 JSON 이 아니면 undefined', async () => {
    expect(await readJson(post('{"a":1}', 'text/plain'))).toBeUndefined()
  })

  it('크기를 넘으면 undefined', async () => {
    expect(await readJson(post(JSON.stringify({ a: 'x'.repeat(20_000) })))).toBeUndefined()
    expect(await readJson(post('{"a":"xxxxxxxx"}'), 8)).toBeUndefined()
  })

  it('Content-Length 가 크면 본문을 읽지 않는다', async () => {
    const request = new Request(`${SITE}/api/x`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': '999999' },
      body: '{}',
    })
    expect(await readJson(request)).toBeUndefined()
    expect(request.bodyUsed).toBe(false)
  })

  it('깨진 JSON 은 undefined', async () => {
    expect(await readJson(post('{a:'))).toBeUndefined()
  })
})

describe('safeReturnPath', () => {
  it('같은 사이트의 경로는 그대로 돌려준다', () => {
    expect(safeReturnPath('/261020')).toBe('/261020')
    expect(safeReturnPath('/en/posts?tag=meta#x')).toBe('/en/posts?tag=meta#x')
  })

  it('다른 사이트로 가거나 /admin 으로 되돌아가는 값은 / 로 바꾼다', () => {
    for (const value of [null, '', '261020', '//evil.com', '/\\evil.com', 'https://evil.com', '/admin', '/admin/', '/admin?return=/x']) {
      expect(safeReturnPath(value)).toBe('/')
    }
  })

  it('/administrator 처럼 이름만 비슷한 경로는 허용한다', () => {
    expect(safeReturnPath('/administrator')).toBe('/administrator')
  })
})
