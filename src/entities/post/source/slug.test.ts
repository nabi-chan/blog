import { describe, expect, it } from 'vitest'
import { sameDayConflicts, validateSlug } from './slug'

describe('validateSlug', () => {
  it('YYMMDD 와 선택적 kebab 접미사를 받는다', () => {
    expect(() => validateSlug('261020', '2026-10-20T12:00:00+09:00')).not.toThrow()
    expect(() => validateSlug('261020-how-this-blog-is-built', '2026-10-20T00:00:00+09:00')).not.toThrow()
  })

  it.each(['how-this-blog-is-built', '2610201', '261020-', '261020-Foo', '261020_omlx', '261020--a'])(
    '형식이 틀리면 던진다: %s',
    (slug) => {
      expect(() => validateSlug(slug, '2026-10-20T00:00:00+09:00')).toThrow(/YYMMDD/)
    },
  )

  it('YYMMDD 가 frontmatter 날짜(KST)와 다르면 던진다', () => {
    expect(() => validateSlug('261021', '2026-10-20T23:59:00+09:00')).toThrow(/2026-10-20/)
  })
})

describe('sameDayConflicts', () => {
  it('같은 날짜로 시작하는 다른 slug 를 돌려준다', () => {
    expect(sameDayConflicts('261020', ['261020', '261020-other', '261021'])).toEqual(['261020-other'])
    expect(sameDayConflicts('261021', ['261020', '261021'])).toEqual([])
  })
})
