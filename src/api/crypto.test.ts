import { describe, expect, it } from 'vitest'
import { constantTimeEqual, fromBase64, hmacHex, hmacSha256, sha256Hex, toBase64 } from './crypto'

describe('toBase64 / fromBase64', () => {
  it('바이트를 base64 로 바꾸고 되돌린다', () => {
    expect(toBase64(new Uint8Array([0, 255, 16]))).toBe('AP8Q')
    expect([...fromBase64('AP8Q')]).toEqual([0, 255, 16])
  })
})

describe('sha256Hex', () => {
  it('SHA-256 을 hex 로 돌려준다', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('hmacSha256 / hmacHex', () => {
  const vector = 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8'

  it('HMAC-SHA256 을 hex 로 돌려준다', async () => {
    expect(await hmacHex('key', 'The quick brown fox jumps over the lazy dog')).toBe(vector)
  })

  it('바이트로도 돌려준다', async () => {
    const bytes = await hmacSha256('key', 'The quick brown fox jumps over the lazy dog')
    expect(bytes).toHaveLength(32)
    expect([...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')).toBe(vector)
  })
})

describe('constantTimeEqual', () => {
  it('같은 바이트면 true', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true)
  })

  it('한 바이트라도 다르면 false', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false)
  })

  it('길이가 다르면 false', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false)
  })
})
