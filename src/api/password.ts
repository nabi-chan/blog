import { constantTimeEqual, fromBase64, hmacSha256, toBase64 } from './crypto'

// 임시값이다. 계획 5 에서 무료 플랜 CPU 시간을 실측해 정한다. Workers 의 PBKDF2 상한은 100,000 이다
export const PASSWORD_ITERATIONS = 50_000
const MAX_ITERATIONS = 100_000
const ALGORITHM = 'pbkdf2-sha256'

export type StoredPassword = { hash: string; salt: string }

// 입력 키는 HMAC(pepper, 비밀번호)다. DB 만 유출돼서는 pepper 없이 오프라인 대입을 할 수 없다
async function derive(password: string, pepper: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', await hmacSha256(pepper, password), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256))
}

export async function hashPassword(
  password: string,
  pepper: string,
  options: { iterations?: number; salt?: Uint8Array<ArrayBuffer> } = {},
): Promise<StoredPassword> {
  const iterations = options.iterations ?? PASSWORD_ITERATIONS
  const salt = options.salt ?? crypto.getRandomValues(new Uint8Array(16))
  const derived = await derive(password, pepper, salt, iterations)
  // 반복 횟수를 같이 저장해서, 나중에 값을 바꿔도 예전 댓글을 검증할 수 있게 한다
  return { hash: `${ALGORITHM}$${iterations}$${toBase64(derived)}`, salt: toBase64(salt) }
}

export async function verifyPassword(password: string, pepper: string, stored: StoredPassword): Promise<boolean> {
  const [algorithm, rawIterations, expected] = stored.hash.split('$')
  const iterations = Number(rawIterations)
  if (algorithm !== ALGORITHM || !Number.isInteger(iterations) || iterations < 1 || iterations > MAX_ITERATIONS || !expected) {
    return false
  }
  const derived = await derive(password, pepper, fromBase64(stored.salt), iterations)
  return constantTimeEqual(derived, fromBase64(expected))
}
