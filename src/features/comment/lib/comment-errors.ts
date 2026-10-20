import type { ApiErrorCode } from '~/shared/api'
import { m } from '~/shared/i18n'

// API 는 오류 코드만 돌려준다. 화면 문구는 여기서 현재 언어로 고른다
export function commentErrorMessage(code: ApiErrorCode | 'network'): string {
  switch (code) {
    case 'invalid_input':
      return m.comment_error_invalid_input()
    case 'turnstile_failed':
      return m.comment_error_turnstile_failed()
    case 'wrong_password':
      return m.comment_error_wrong_password()
    case 'forbidden_origin':
      return m.comment_error_forbidden_origin()
    case 'reserved_name':
      return m.comment_error_reserved_name()
    case 'not_found':
      return m.comment_error_not_found()
    case 'too_many_attempts':
      return m.comment_error_too_many_attempts()
    case 'unavailable':
      return m.comment_error_unavailable()
    case 'network':
      return m.comment_error_network()
  }
}
