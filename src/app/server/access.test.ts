import { type CryptoKey, type JWK, SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { type AccessConfig, isOwnerRequest, remoteAccessKeys, verifyAccessToken } from './access'

const config: AccessConfig = { teamDomain: 'team.cloudflareaccess.com', audience: 'aud-1', ownerEmail: 'owner@example.com' }
const NOW = new Date('2026-10-20T03:00:00Z')
const seconds = (date: Date) => Math.floor(date.getTime() / 1000)

let privateKey: CryptoKey
let otherPrivateKey: CryptoKey
let keys: ReturnType<typeof createLocalJWKSet>

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true })
  privateKey = pair.privateKey
  otherPrivateKey = (await generateKeyPair('RS256', { extractable: true })).privateKey
  const jwk: JWK = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256' }
  keys = createLocalJWKSet({ keys: [jwk] })
})

type Claims = { email?: string; aud?: string; iss?: string; exp?: Date; signWith?: CryptoKey }

function sign({ email = 'owner@example.com', aud = 'aud-1', iss = 'https://team.cloudflareaccess.com', exp, signWith }: Claims = {}) {
  const payload = email === undefined ? {} : { email }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setAudience(aud)
    .setIssuer(iss)
    .setIssuedAt(seconds(NOW) - 60)
    .setExpirationTime(seconds(exp ?? new Date(NOW.getTime() + 3600_000)))
    .sign(signWith ?? privateKey)
}

describe('verifyAccessToken', () => {
  it('서명·aud·iss·만료·이메일이 맞으면 true', async () => {
    expect(await verifyAccessToken(await sign(), config, keys, NOW)).toBe(true)
  })

  it('이메일은 대소문자를 가리지 않는다', async () => {
    expect(await verifyAccessToken(await sign({ email: 'Owner@Example.com' }), config, keys, NOW)).toBe(true)
  })

  it('허용 이메일은 쉼표로 여러 개 둘 수 있다', async () => {
    const two = { ...config, ownerEmail: 'owner@example.com, Second@example.com' }
    expect(await verifyAccessToken(await sign({ email: 'second@example.com' }), two, keys, NOW)).toBe(true)
    expect(await verifyAccessToken(await sign({ email: 'owner@example.com' }), two, keys, NOW)).toBe(true)
    expect(await verifyAccessToken(await sign({ email: 'someone@example.com' }), two, keys, NOW)).toBe(false)
  })

  it('하나라도 틀리면 false', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const tokens = [
      await sign({ aud: 'aud-2' }),
      await sign({ iss: 'https://other.cloudflareaccess.com' }),
      await sign({ exp: new Date(NOW.getTime() - 1000) }),
      await sign({ signWith: otherPrivateKey }),
      await sign({ email: 'someone@example.com' }),
      'not-a-jwt',
    ]
    for (const token of tokens) expect(await verifyAccessToken(token, config, keys, NOW)).toBe(false)
    warn.mockRestore()
  })

  it('email 클레임이 없으면 false', async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setAudience('aud-1')
      .setIssuer('https://team.cloudflareaccess.com')
      .setExpirationTime(seconds(NOW) + 3600)
      .sign(privateKey)
    expect(await verifyAccessToken(token, config, keys, NOW)).toBe(false)
  })

  it('검증에 실패하면 토큰 없이 원인만 로그로 남긴다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const token = await sign({ aud: 'aud-2' })
    await verifyAccessToken(token, config, keys, NOW)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(warn.mock.calls)).not.toContain(token)
    warn.mockRestore()
  })
})

describe('isOwnerRequest', () => {
  const request = (cookie?: string) =>
    new Request('https://nabichan.me/api/me', { headers: cookie === undefined ? {} : { cookie } })

  it('dev 스위치가 켜져 있으면 쿠키 없이 true', async () => {
    const getKeys = vi.fn(() => keys)
    expect(await isOwnerRequest(request(), { config, keys: getKeys, devOwner: true, now: NOW })).toBe(true)
    expect(getKeys).not.toHaveBeenCalled()
  })

  it('CF_Authorization 쿠키의 토큰을 검증한다', async () => {
    const cookie = `a=1; CF_Authorization=${await sign()}`
    expect(await isOwnerRequest(request(cookie), { config, keys: () => keys, devOwner: false, now: NOW })).toBe(true)
  })

  it('쿠키가 없으면 키를 받지 않고 false', async () => {
    const getKeys = vi.fn(() => keys)
    expect(await isOwnerRequest(request('a=1'), { config, keys: getKeys, devOwner: false, now: NOW })).toBe(false)
    expect(getKeys).not.toHaveBeenCalled()
  })

  it('설정값이 하나라도 비어 있으면 키를 받지 않고 false (fail closed)', async () => {
    const getKeys = vi.fn(() => keys)
    const cookie = `CF_Authorization=${await sign()}`
    for (const broken of [{ audience: '' }, { teamDomain: '' }, { ownerEmail: '' }, { ownerEmail: ' , ' }]) {
      const options = { config: { ...config, ...broken }, keys: getKeys, devOwner: false, now: NOW }
      expect(await isOwnerRequest(request(cookie), options)).toBe(false)
    }
    expect(getKeys).not.toHaveBeenCalled()
  })
})

describe('remoteAccessKeys', () => {
  it('팀 도메인마다 JWKS 를 한 번만 만든다', () => {
    const a = remoteAccessKeys('a.cloudflareaccess.com')
    expect(remoteAccessKeys('a.cloudflareaccess.com')).toBe(a)
    expect(remoteAccessKeys('b.cloudflareaccess.com')).not.toBe(a)
  })
})
