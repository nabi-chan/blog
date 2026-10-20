import { ATTEMPT_LIMITS, apiError, isLimited, json, readJson, recordFailure } from '../shared/api/index.server'
import { isReservedName, parseCommentDeletion, parseCommentEdit, parseNewComment } from './comment-input'
import { type CommentRow, deleteComment, getComment, insertComment, listComments, toCommentDto, updateCommentBody } from './comments-repo'
import { hmacHex } from '../shared/lib/crypto'
import { hashPassword, verifyPassword } from './password'
import type { ApiContext } from '~/shared/api/index.server'

export async function handleMe(ctx: ApiContext): Promise<Response> {
  return json(200, { owner: await ctx.isOwner(), turnstileSiteKey: ctx.turnstileSiteKey })
}

export async function handleListComments(ctx: ApiContext, slug: string): Promise<Response> {
  if (!ctx.postExists(slug)) return apiError(404, 'not_found')
  return json(200, { comments: await listComments(ctx.db, slug) })
}

async function turnstileDenial(ctx: ApiContext, token: string): Promise<Response | null> {
  const outcome = await ctx.verifyTurnstile(token)
  if (outcome === 'failed') return apiError(403, 'turnstile_failed')
  if (outcome === 'unavailable') return apiError(503, 'unavailable')
  return null
}

export async function handleCreateComment(request: Request, ctx: ApiContext, slug: string): Promise<Response> {
  const owner = await ctx.isOwner()
  const input = parseNewComment(await readJson(request), owner)
  if (!input) return apiError(400, 'invalid_input')
  if (!ctx.postExists(slug)) return apiError(404, 'not_found')
  const base = { id: crypto.randomUUID(), post_slug: slug, body: input.body, created_at: ctx.now().toISOString(), updated_at: null }
  if (owner) {
    const row: CommentRow = { ...base, author: ctx.ownerName, is_owner: 1, password_hash: null, password_salt: null }
    await insertComment(ctx.db, row)
    return json(201, { comment: toCommentDto(row) })
  }
  if (isReservedName(input.author)) return apiError(403, 'reserved_name')
  // 해시(PBKDF2)는 CPU 를 많이 쓰므로 Turnstile 을 통과한 요청만 계산한다
  const denied = await turnstileDenial(ctx, input.turnstileToken)
  if (denied) return denied
  const stored = await hashPassword(input.password, ctx.pepper)
  const row: CommentRow = { ...base, author: input.author, is_owner: 0, password_hash: stored.hash, password_salt: stored.salt }
  await insertComment(ctx.db, row)
  return json(201, { comment: toCommentDto(row) })
}

// 수정·삭제 권한 확인. 순서가 요구 사항이다: Turnstile → 댓글 조회 → 시도 제한 → 비밀번호(PBKDF2)
async function authorize(
  ctx: ApiContext,
  id: string,
  owner: boolean,
  input: { password: string; turnstileToken: string },
): Promise<CommentRow | Response> {
  if (!owner) {
    const denied = await turnstileDenial(ctx, input.turnstileToken)
    if (denied) return denied
  }
  const row = await getComment(ctx.db, id)
  if (!row) return apiError(404, 'not_found')
  if (owner) return row

  const now = ctx.now()
  const visitor = `visitor:${await hmacHex(ctx.pepper, `attempt:${ctx.ip}`)}`
  const comment = `comment:${id}`
  const limits = [
    { key: visitor, max: ATTEMPT_LIMITS.visitor },
    { key: comment, max: ATTEMPT_LIMITS.comment },
  ]
  if (await isLimited(ctx.db, limits, now)) return apiError(429, 'too_many_attempts')
  // 은솔 댓글에는 비밀번호가 없다. 아무 비밀번호로도 열리지 않고, 실패로 센다
  const matches =
    row.is_owner === 0 &&
    row.password_hash !== null &&
    row.password_salt !== null &&
    (await verifyPassword(input.password, ctx.pepper, { hash: row.password_hash, salt: row.password_salt }))
  if (!matches) {
    await recordFailure(ctx.db, [visitor, comment], now)
    return apiError(403, 'wrong_password')
  }
  return row
}

export async function handleEditComment(request: Request, ctx: ApiContext, id: string): Promise<Response> {
  const owner = await ctx.isOwner()
  const input = parseCommentEdit(await readJson(request), owner)
  if (!input) return apiError(400, 'invalid_input')
  const allowed = await authorize(ctx, id, owner, input)
  if (allowed instanceof Response) return allowed
  const updated = await updateCommentBody(ctx.db, id, input.body, ctx.now().toISOString())
  if (!updated) return apiError(404, 'not_found')
  return json(200, { comment: toCommentDto(updated) })
}

export async function handleDeleteComment(request: Request, ctx: ApiContext, id: string): Promise<Response> {
  const owner = await ctx.isOwner()
  const input = parseCommentDeletion(await readJson(request), owner)
  if (!input) return apiError(400, 'invalid_input')
  const allowed = await authorize(ctx, id, owner, input)
  if (allowed instanceof Response) return allowed
  await deleteComment(ctx.db, id)
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
}
