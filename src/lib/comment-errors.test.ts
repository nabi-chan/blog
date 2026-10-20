import { describe, expect, it } from 'vitest'
import { commentErrorMessage } from './comment-errors'

describe('commentErrorMessage', () => {
  it('API 오류 코드를 현재 언어 문구로 바꾼다', () => {
    expect(commentErrorMessage('wrong_password')).toBe('비밀번호가 맞지 않아요.')
    expect(commentErrorMessage('too_many_attempts')).toBe('시도가 너무 많아요. 10분 뒤에 다시 해 주세요.')
    expect(commentErrorMessage('network')).toBe('네트워크 연결을 확인해 주세요.')
  })

  it('모든 코드에 문구가 있다', () => {
    const codes = ['invalid_input', 'turnstile_failed', 'wrong_password', 'forbidden_origin', 'reserved_name', 'not_found', 'too_many_attempts', 'unavailable', 'network'] as const
    for (const code of codes) expect(commentErrorMessage(code)).toMatch(/\S/)
  })
})
