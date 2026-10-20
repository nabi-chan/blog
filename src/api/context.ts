import { site } from '~/site'
import { isOwnerRequest, remoteAccessKeys } from './access'
import { clientIp } from './http'
import type { ApiContext } from './router'
import { verifyTurnstile } from './turnstile'

// Worker env 와 요청을 핸들러가 쓰는 ApiContext 로 엮기만 한다 (로직은 각 모듈에 있다)
export function createApiContext(
  request: Request,
  env: Env,
  options: { devOwner: boolean; postExists: (slug: string) => boolean },
): ApiContext {
  const config = { teamDomain: env.ACCESS_TEAM_DOMAIN, audience: env.ACCESS_AUD, ownerEmail: env.OWNER_EMAIL }
  let owner: Promise<boolean> | undefined
  return {
    db: env.DB,
    now: () => new Date(),
    ip: clientIp(request),
    userAgent: request.headers.get('user-agent') ?? '',
    isOwner: () => (owner ??= isOwnerRequest(request, { config, keys: () => remoteAccessKeys(config.teamDomain), devOwner: options.devOwner })),
    verifyTurnstile: (token) => verifyTurnstile(token, { secret: env.TURNSTILE_SECRET_KEY, remoteIp: clientIp(request) }),
    postExists: options.postExists,
    pepper: env.COMMENT_PEPPER,
    viewSalt: env.VIEW_SALT_SECRET,
    ownerName: site.name,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY,
  }
}
