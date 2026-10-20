// 브라우저와 Worker 가 같이 쓰는 API 모양. 타입만 둔다

export type CommentDto = {
  id: string
  author: string
  body: string
  isOwner: boolean
  createdAt: string
  updatedAt: string | null
}

export type ApiErrorCode =
  | 'invalid_input'
  | 'turnstile_failed'
  | 'wrong_password'
  | 'forbidden_origin'
  | 'reserved_name'
  | 'not_found'
  | 'too_many_attempts'
  | 'unavailable'

export type MeDto = { owner: boolean; turnstileSiteKey: string }

// site 는 전체, today 는 KST 오늘, post 는 글별 조회수. 모두 같은 방문자는 하루 1회만 센다
export type ViewCountsDto = { site: number; today: number; post?: number }
