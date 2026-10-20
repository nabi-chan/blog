import type { CommentDto } from '~/shared/api'

export type CommentRow = {
  id: string
  post_slug: string
  author: string
  body: string
  is_owner: number
  password_hash: string | null
  password_salt: string | null
  created_at: string
  updated_at: string | null
}

// 비밀번호 해시와 솔트는 절대 응답에 싣지 않는다
export function toCommentDto(row: CommentRow): CommentDto {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    isOwner: row.is_owner === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listComments(db: D1Database, slug: string): Promise<CommentDto[]> {
  const { results } = await db
    .prepare('SELECT * FROM comments WHERE post_slug = ?1 ORDER BY created_at, id')
    .bind(slug)
    .all<CommentRow>()
  return results.map(toCommentDto)
}

export async function getComment(db: D1Database, id: string): Promise<CommentRow | null> {
  return db.prepare('SELECT * FROM comments WHERE id = ?1').bind(id).first<CommentRow>()
}

export async function insertComment(db: D1Database, row: CommentRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO comments(id, post_slug, author, body, is_owner, password_hash, password_salt, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
    .bind(row.id, row.post_slug, row.author, row.body, row.is_owner, row.password_hash, row.password_salt, row.created_at, row.updated_at)
    .run()
}

export async function updateCommentBody(db: D1Database, id: string, body: string, updatedAt: string): Promise<CommentRow | null> {
  return db
    .prepare('UPDATE comments SET body = ?2, updated_at = ?3 WHERE id = ?1 RETURNING *')
    .bind(id, body, updatedAt)
    .first<CommentRow>()
}

export async function deleteComment(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM comments WHERE id = ?1').bind(id).run()
  return result.meta.changes > 0
}
