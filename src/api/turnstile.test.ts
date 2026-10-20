import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyTurnstile } from './turnstile'

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

function fakeFetch(respond: () => Response | Promise<Response>) {
  const calls: Array<{ url: string; body: URLSearchParams }> = []
  const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), body: new URLSearchParams(String(init?.body)) })
    return respond()
  }) as unknown as typeof fetch
  return { fetchFn, calls }
}

afterEach(() => vi.restoreAllMocks())

describe('verifyTurnstile', () => {
  it('siteverify 가 success 면 ok 이고, 시크릿·토큰·IP 를 보낸다', async () => {
    const { fetchFn, calls } = fakeFetch(() => Response.json({ success: true }))
    expect(await verifyTurnstile('tok', { secret: 's', remoteIp: '203.0.113.7', fetchFn })).toBe('ok')
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(SITEVERIFY)
    expect(Object.fromEntries(calls[0].body)).toEqual({ secret: 's', response: 'tok', remoteip: '203.0.113.7' })
  })

  it('IP 가 비어 있으면 remoteip 를 보내지 않는다', async () => {
    const { fetchFn, calls } = fakeFetch(() => Response.json({ success: true }))
    await verifyTurnstile('tok', { secret: 's', remoteIp: '', fetchFn })
    expect(calls[0].body.has('remoteip')).toBe(false)
  })

  it('success 가 false 면 failed 이고 오류 코드를 남긴다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { fetchFn } = fakeFetch(() => Response.json({ success: false, 'error-codes': ['timeout-or-duplicate'] }))
    expect(await verifyTurnstile('tok', { secret: 's', remoteIp: '', fetchFn })).toBe('failed')
    expect(JSON.stringify(warn.mock.calls)).toContain('timeout-or-duplicate')
  })

  it('siteverify 가 2xx 가 아니거나 연결이 안 되면 unavailable', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const down = fakeFetch(() => new Response('oops', { status: 500 }))
    expect(await verifyTurnstile('tok', { secret: 's', remoteIp: '', fetchFn: down.fetchFn })).toBe('unavailable')
    const offline = fakeFetch(() => Promise.reject(new TypeError('fetch failed')))
    expect(await verifyTurnstile('tok', { secret: 's', remoteIp: '', fetchFn: offline.fetchFn })).toBe('unavailable')
    expect(error).toHaveBeenCalledTimes(2)
  })

  it('빈 토큰이나 2048자를 넘는 토큰은 묻지 않고 failed', async () => {
    const { fetchFn } = fakeFetch(() => Response.json({ success: true }))
    expect(await verifyTurnstile('', { secret: 's', remoteIp: '', fetchFn })).toBe('failed')
    expect(await verifyTurnstile('x'.repeat(2049), { secret: 's', remoteIp: '', fetchFn })).toBe('failed')
    expect(fetchFn).not.toHaveBeenCalled()
  })
})
