import { describe, expect, it } from 'vitest'
import { COMMENT_LIMITS, isReservedName, parseCommentDeletion, parseCommentEdit, parseNewComment } from './comment-input'

const valid = { author: '방문자', body: '좋은 글이에요', password: 'pass1234', turnstileToken: 'tok' }

describe('COMMENT_LIMITS', () => {
  it('스펙 4.7 의 길이 제한이다', () => {
    expect(COMMENT_LIMITS).toEqual({ author: { min: 1, max: 20 }, body: { min: 1, max: 1000 }, password: { min: 4, max: 64 } })
  })
})

describe('parseNewComment', () => {
  it('올바른 입력을 돌려준다', () => {
    expect(parseNewComment(valid, false)).toEqual(valid)
  })

  it('작성자명은 앞뒤 공백을 자르고 코드 포인트로 센다', () => {
    expect(parseNewComment({ ...valid, author: '  방문자  ' }, false)?.author).toBe('방문자')
    expect(parseNewComment({ ...valid, author: '😀'.repeat(20) }, false)?.author).toBe('😀'.repeat(20))
    expect(parseNewComment({ ...valid, author: 'a'.repeat(21) }, false)).toBeNull()
  })

  it('빈 이름, 제어 문자, 줄바꿈이 든 이름은 받지 않는다', () => {
    for (const author of ['', '   ', 'a\u0007b', 'a\nb']) expect(parseNewComment({ ...valid, author }, false)).toBeNull()
  })

  it('글자 방향을 바꾸는 제어 문자(bidi)가 든 이름은 받지 않는다', () => {
    for (const author of ['abc\u202Edef', 'abc\u2066def', 'abc\u200Fdef']) expect(parseNewComment({ ...valid, author }, false)).toBeNull()
    // 이모지 조합(ZWJ)은 이름에 쓸 수 있다
    expect(parseNewComment({ ...valid, author: '👩\u200D💻' }, false)?.author).toBe('👩\u200D💻')
  })

  it('본문은 줄바꿈을 \\n 으로 맞추고 앞뒤 공백을 자른다', () => {
    expect(parseNewComment({ ...valid, body: '  첫 줄\r\n\t둘째 줄  ' }, false)?.body).toBe('첫 줄\n\t둘째 줄')
  })

  it('본문 길이는 1~1000자다', () => {
    expect(parseNewComment({ ...valid, body: 'a'.repeat(1000) }, false)).not.toBeNull()
    expect(parseNewComment({ ...valid, body: 'a'.repeat(1001) }, false)).toBeNull()
    expect(parseNewComment({ ...valid, body: ' \n ' }, false)).toBeNull()
  })

  it('본문에 \\n, \\t 말고 제어 문자가 있으면 받지 않는다', () => {
    expect(parseNewComment({ ...valid, body: 'a\u0000b' }, false)).toBeNull()
  })

  it('비밀번호는 자르지 않고 4~64자만 받는다', () => {
    expect(parseNewComment({ ...valid, password: ' ab ' }, false)?.password).toBe(' ab ')
    expect(parseNewComment({ ...valid, password: 'abc' }, false)).toBeNull()
    expect(parseNewComment({ ...valid, password: 'a'.repeat(65) }, false)).toBeNull()
  })

  it('Turnstile 토큰이 비어 있으면 받지 않는다', () => {
    expect(parseNewComment({ ...valid, turnstileToken: '' }, false)).toBeNull()
  })

  it('객체가 아니거나 필드 타입이 틀리면 null', () => {
    for (const value of [null, 'x', 3, [], { ...valid, author: 3 }, { ...valid, body: undefined }]) {
      expect(parseNewComment(value, false)).toBeNull()
    }
  })

  it('은솔은 본문만 검사하고 나머지는 빈 문자열이다', () => {
    expect(parseNewComment({ body: '안녕' }, true)).toEqual({ author: '', body: '안녕', password: '', turnstileToken: '' })
    expect(parseNewComment({ body: '' }, true)).toBeNull()
  })
})

describe('parseCommentEdit', () => {
  const edit = { body: '고친 내용', password: 'pass1234', turnstileToken: 'tok' }

  it('본문·비밀번호·토큰을 검사한다', () => {
    expect(parseCommentEdit(edit, false)).toEqual(edit)
    expect(parseCommentEdit({ ...edit, password: 'abc' }, false)).toBeNull()
    expect(parseCommentEdit({ ...edit, turnstileToken: '' }, false)).toBeNull()
    expect(parseCommentEdit({ ...edit, body: '' }, false)).toBeNull()
  })

  it('은솔은 본문만 본다', () => {
    expect(parseCommentEdit({ body: '고침' }, true)).toEqual({ body: '고침', password: '', turnstileToken: '' })
  })
})

describe('parseCommentDeletion', () => {
  it('비밀번호와 토큰만 보고 본문은 보지 않는다', () => {
    expect(parseCommentDeletion({ password: 'pass1234', turnstileToken: 'tok' }, false)).toEqual({ password: 'pass1234', turnstileToken: 'tok' })
    expect(parseCommentDeletion({ password: 'abc', turnstileToken: 'tok' }, false)).toBeNull()
    expect(parseCommentDeletion({ password: 'pass1234' }, false)).toBeNull()
  })

  it('은솔은 아무것도 필요 없다', () => {
    expect(parseCommentDeletion({}, true)).toEqual({ password: '', turnstileToken: '' })
    expect(parseCommentDeletion(null, true)).toBeNull()
  })
})

describe('isReservedName', () => {
  it('은솔 이름은 대소문자·공백·전각을 가리지 않고 막는다', () => {
    for (const name of ['eunsol', ' E u n S o l ', 'ＥＵＮＳＯＬ', 'nabi', '은솔', '나 비', 'eunsol (Nabi)']) {
      expect(isReservedName(name)).toBe(true)
    }
  })

  it('보이지 않는 문자를 끼워도 막는다 (ZWSP, soft hyphen, word joiner, ZWJ)', () => {
    for (const name of ['eun\u200Bsol', 'eun\u00ADsol', 'eun\u2060sol', '은\u200D솔', '\uFEFFnabi']) {
      expect(isReservedName(name)).toBe(true)
    }
  })

  it('이름이 정확히 같을 때만 막는다', () => {
    for (const name of ['eunsol2', '김은솔', 'nabil']) expect(isReservedName(name)).toBe(false)
  })
})
