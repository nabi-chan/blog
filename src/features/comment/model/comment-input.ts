import { site } from '~/shared/config'

// 스펙 4.7 의 길이 제한. 길이는 코드 포인트로 센다 (이모지 하나가 한 글자)
export const COMMENT_LIMITS = {
  author: { min: 1, max: 20 },
  body: { min: 1, max: 1000 },
  password: { min: 4, max: 64 },
} as const

export type NewComment = { author: string; body: string; password: string; turnstileToken: string }
export type CommentEdit = { body: string; password: string; turnstileToken: string }
export type CommentDeletion = { password: string; turnstileToken: string }

type Limit = { min: number; max: number }

const length = (text: string) => [...text].length
const within = (text: string, limit: Limit) => length(text) >= limit.min && length(text) <= limit.max
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// 글자 방향을 바꾸는 제어 문자(LRM·RLM, embedding/override, isolate). 이름을 다르게 보이게 만들 수 있다
const BIDI_CONTROLS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/u

function readAuthor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const author = value.trim()
  return within(author, COMMENT_LIMITS.author) && !/\p{Cc}/u.test(author) && !BIDI_CONTROLS.test(author) ? author : null
}

// 줄바꿈과 탭만 남기고 다른 제어 문자는 받지 않는다
function readBody(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const body = value.replace(/\r\n?/g, '\n').trim()
  return within(body, COMMENT_LIMITS.body) && !/[^\P{Cc}\n\t]/u.test(body) ? body : null
}

function readPassword(value: unknown): string | null {
  return typeof value === 'string' && within(value, COMMENT_LIMITS.password) ? value : null
}

function readToken(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

// 은솔(owner)은 본문만 검사한다. 이름은 서버가 정하고, 비밀번호와 Turnstile 은 쓰지 않는다
export function parseNewComment(value: unknown, owner: boolean): NewComment | null {
  if (!isRecord(value)) return null
  const body = readBody(value.body)
  if (body === null) return null
  if (owner) return { author: '', body, password: '', turnstileToken: '' }
  const author = readAuthor(value.author)
  const password = readPassword(value.password)
  const turnstileToken = readToken(value.turnstileToken)
  if (author === null || password === null || turnstileToken === null) return null
  return { author, body, password, turnstileToken }
}

export function parseCommentEdit(value: unknown, owner: boolean): CommentEdit | null {
  if (!isRecord(value)) return null
  const body = readBody(value.body)
  if (body === null) return null
  if (owner) return { body, password: '', turnstileToken: '' }
  const deletion = parseCommentDeletion(value, false)
  return deletion && { body, ...deletion }
}

export function parseCommentDeletion(value: unknown, owner: boolean): CommentDeletion | null {
  if (!isRecord(value)) return null
  if (owner) return { password: '', turnstileToken: '' }
  const password = readPassword(value.password)
  const turnstileToken = readToken(value.turnstileToken)
  if (password === null || turnstileToken === null) return null
  return { password, turnstileToken }
}

// 공백과 보이지 않는 문자(ZWSP, soft hyphen, ZWJ 등 Default_Ignorable_Code_Point)를 지운 뒤 비교한다
const normalizeName = (name: string) =>
  name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{Default_Ignorable_Code_Point}]+/gu, '')

// 은솔이 아닌 사람은 은솔 이름을 쓸 수 없다. 정규화한 뒤 정확히 같을 때만 막는다
const RESERVED_NAMES = new Set(['eunsol', 'nabi', '은솔', '나비', normalizeName(site.author)])

export function isReservedName(name: string): boolean {
  return RESERVED_NAMES.has(normalizeName(name))
}
