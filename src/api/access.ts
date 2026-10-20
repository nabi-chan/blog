import { type JWTVerifyGetKey, createRemoteJWKSet, jwtVerify } from 'jose'
import { readCookie } from './http'

export type AccessConfig = { teamDomain: string; audience: string; ownerEmail: string }

const COOKIE_NAME = 'CF_Authorization'

// OWNER_EMAIL 은 쉼표로 여러 주소를 둘 수 있다. 비교는 대소문자를 가리지 않는다
const ownerEmails = (raw: string) =>
  raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)

// Access 가 붙인 CF_Authorization JWT 를 직접 검증한다 (스펙 4.7). 하나라도 틀리면 은솔이 아니다
export async function verifyAccessToken(token: string, config: AccessConfig, keys: JWTVerifyGetKey, now?: Date): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, keys, {
      audience: config.audience,
      issuer: `https://${config.teamDomain}`,
      algorithms: ['RS256'],
      currentDate: now,
    })
    return typeof payload.email === 'string' && ownerEmails(config.ownerEmail).includes(payload.email.toLowerCase())
  } catch (error) {
    // 토큰 값은 남기지 않는다
    console.warn('[access] JWT 검증 실패', error instanceof Error ? `${error.name}: ${error.message}` : error)
    return false
  }
}

export async function isOwnerRequest(
  request: Request,
  options: { config: AccessConfig; keys: () => JWTVerifyGetKey; devOwner: boolean; now?: Date },
): Promise<boolean> {
  if (options.devOwner) return true
  const { teamDomain, audience, ownerEmail } = options.config
  // 설정이 비어 있으면(계획 5 전, 잘못된 배포) 언제나 은솔이 아니다
  if (!teamDomain || !audience || ownerEmails(ownerEmail).length === 0) return false
  const token = readCookie(request.headers.get('cookie'), COOKIE_NAME)
  if (!token) return false
  return verifyAccessToken(token, options.config, options.keys(), options.now)
}

// JWKS 는 isolate 안에서 재사용해야 캐시(기본 10분)가 의미 있다. 요청마다 만들지 않는다
const remoteKeys = new Map<string, JWTVerifyGetKey>()

export function remoteAccessKeys(teamDomain: string): JWTVerifyGetKey {
  let keys = remoteKeys.get(teamDomain)
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`))
    remoteKeys.set(teamDomain, keys)
  }
  return keys
}
