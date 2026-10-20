import type { TurnstileOutcome } from './turnstile.server'

// 핸들러가 쓰는 것 전부. env 를 엮는 일은 context.ts 가 하고, 테스트는 test-utils 의 testContext 로 만든다
export type ApiContext = {
  db: D1Database
  now: () => Date
  ip: string
  userAgent: string
  // 요청당 한 번만 계산된다 (context.ts 가 기억해 둔다)
  isOwner: () => Promise<boolean>
  verifyTurnstile: (token: string) => Promise<TurnstileOutcome>
  postExists: (slug: string) => boolean
  // COMMENT_PEPPER. 비밀번호 해시와 시도 제한의 방문자 키에 쓴다
  pepper: string
  // VIEW_SALT_SECRET. 조회수 방문자 키의 날짜별 솔트에 쓴다
  viewSalt: string
  // 은솔 댓글의 작성자명
  ownerName: string
  turnstileSiteKey: string
}
