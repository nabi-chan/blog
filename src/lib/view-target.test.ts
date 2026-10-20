import { describe, expect, it } from 'vitest'
import { type MatchLike, viewKey, viewTarget } from './view-target'

const root: MatchLike = { routeId: '__root__', status: 'success', params: {} }

describe('viewTarget', () => {
  it('글이 아닌 페이지는 전체 조회수만 센다', () => {
    expect(viewTarget([root, { routeId: '/', status: 'success', params: {} }])).toEqual({})
  })

  it('글 페이지는 slug 도 센다', () => {
    expect(viewTarget([root, { routeId: '/$slug', status: 'success', params: { slug: '261020' } }])).toEqual({ slug: '261020' })
  })

  it('404 는 세지 않는다', () => {
    expect(viewTarget([root, { routeId: '/$slug', status: 'notFound', params: { slug: '261099' } }])).toBeNull()
    expect(viewTarget([{ ...root, globalNotFound: true }])).toBeNull()
    expect(viewTarget([])).toBeNull()
  })
})

describe('viewKey', () => {
  it('해시(목차 이동)는 무시하고 경로와 쿼리로만 화면을 구분한다', () => {
    const base = { pathname: '/261020', searchStr: '' }
    expect(viewKey({ ...base, hash: 'intro' })).toBe(viewKey(base))
    expect(viewKey({ pathname: '/posts', searchStr: '?tag=meta' })).not.toBe(viewKey({ pathname: '/posts', searchStr: '' }))
    expect(viewKey({ pathname: '/en/261020', searchStr: '' })).not.toBe(viewKey(base))
  })
})
