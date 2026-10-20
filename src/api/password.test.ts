import { describe, expect, it } from 'vitest'
import { PASSWORD_ITERATIONS, hashPassword, verifyPassword } from './password'

const PEPPER = 'test-pepper'

describe('hashPassword / verifyPassword', () => {
  it('같은 비밀번호와 pepper 로 검증된다', async () => {
    const stored = await hashPassword('hunter22', PEPPER)
    expect(await verifyPassword('hunter22', PEPPER, stored)).toBe(true)
  })

  it('다른 비밀번호나 다른 pepper 는 통과하지 않는다', async () => {
    const stored = await hashPassword('hunter22', PEPPER)
    expect(await verifyPassword('hunter23', PEPPER, stored)).toBe(false)
    expect(await verifyPassword('hunter22', 'other-pepper', stored)).toBe(false)
  })

  it('해시 문자열에 알고리즘과 반복 횟수를 남기고 평문은 넣지 않는다', async () => {
    const stored = await hashPassword('hunter22', PEPPER)
    expect(PASSWORD_ITERATIONS).toBe(50_000)
    expect(stored.hash.startsWith('pbkdf2-sha256$50000$')).toBe(true)
    expect(stored.hash).not.toContain('hunter22')
    expect(stored.salt).not.toContain('hunter22')
  })

  it('같은 비밀번호도 솔트가 달라서 해시가 다르다', async () => {
    const a = await hashPassword('hunter22', PEPPER)
    const b = await hashPassword('hunter22', PEPPER)
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })

  it('저장된 반복 횟수로 검증한다', async () => {
    const stored = await hashPassword('hunter22', PEPPER, { iterations: 1000 })
    expect(stored.hash.startsWith('pbkdf2-sha256$1000$')).toBe(true)
    expect(await verifyPassword('hunter22', PEPPER, stored)).toBe(true)
  })

  it('주어진 솔트를 쓴다', async () => {
    const salt = new Uint8Array(16).fill(7)
    const a = await hashPassword('hunter22', PEPPER, { iterations: 1000, salt })
    const b = await hashPassword('hunter22', PEPPER, { iterations: 1000, salt })
    expect(a).toEqual(b)
  })

  it('형식이 틀렸거나 반복 횟수가 범위를 벗어나면 false', async () => {
    const { salt } = await hashPassword('hunter22', PEPPER, { iterations: 1000 })
    for (const hash of ['plain', 'pbkdf2-sha256$0$AA==', 'pbkdf2-sha256$200000$AA==', 'pbkdf2-sha256$abc$AA==', 'md5$1000$AA==']) {
      expect(await verifyPassword('hunter22', PEPPER, { hash, salt })).toBe(false)
    }
  })
})
