import type { ApiErrorCode, CommentDto, MeDto, ViewCountsDto } from '~/api/types'

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ApiErrorCode | 'network' }

type Secret = { password?: string; turnstileToken?: string }

// 브라우저에서 Worker API 를 부른다. 실패를 예외 대신 결과 값으로 돌려줘서 화면이 상태를 고르기 쉽게 한다
export function createApiClient(fetchFn: typeof fetch = (...args) => fetch(...args)) {
  async function request<T>(path: string, method = 'GET', body?: unknown): Promise<ApiResult<T>> {
    let res: Response
    try {
      res = await fetchFn(path, {
        method,
        ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
      })
    } catch {
      return { ok: false, status: 0, error: 'network' }
    }
    if (res.status === 204) return { ok: true, data: null as T }
    if (res.ok) return { ok: true, data: (await res.json()) as T }
    // 프록시 오류 페이지처럼 JSON 이 아닌 본문은 장애로 본다
    const error = await res
      .json()
      .then((value: unknown) => (value as { error?: ApiErrorCode } | null)?.error ?? 'unavailable')
      .catch(() => 'unavailable' as const)
    return { ok: false, status: res.status, error }
  }

  const comments = (id: string) => `/api/comments/${encodeURIComponent(id)}`

  return {
    me: () => request<MeDto>('/api/me'),
    listComments: (slug: string) => request<{ comments: CommentDto[] }>(`/api/posts/${encodeURIComponent(slug)}/comments`),
    createComment: (slug: string, input: Secret & { author?: string; body: string }) =>
      request<{ comment: CommentDto }>(`/api/posts/${encodeURIComponent(slug)}/comments`, 'POST', input),
    editComment: (id: string, input: Secret & { body: string }) => request<{ comment: CommentDto }>(comments(id), 'PATCH', input),
    deleteComment: (id: string, input: Secret) => request<null>(comments(id), 'DELETE', input),
    recordView: (slug?: string) => request<ViewCountsDto>('/api/views', 'POST', slug === undefined ? {} : { slug }),
  }
}
