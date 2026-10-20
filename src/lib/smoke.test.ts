import { describe, expect, it } from 'vitest'
import { checkResponse } from './smoke'

const ok = { status: 200, location: null, body: '' }

describe('checkResponse', () => {
  it('기대한 상태 코드면 통과한다', () => {
    expect(checkResponse({ path: '/', status: 200 }, ok)).toEqual([])
  })

  it('상태 코드가 다르면 실패를 알린다', () => {
    expect(checkResponse({ path: '/', status: 200 }, { ...ok, status: 404 })).toEqual([
      '/: 상태 코드 200 기대, 실제 404',
    ])
  })

  it('있어야 할 문자열이 없으면 실패를 알린다', () => {
    expect(
      checkResponse({ path: '/', status: 200, contains: ['lang="ko"'] }, { ...ok, body: '<html lang="en">' }),
    ).toEqual(['/: "lang="ko"" 가 없습니다'])
  })

  it('없어야 할 문자열이 있으면 실패를 알린다', () => {
    expect(checkResponse({ path: '/', status: 200, notContains: ['secret'] }, { ...ok, body: 'secret' })).toEqual([
      '/: "secret" 가 있으면 안 됩니다',
    ])
  })

  it('3xx 끼리는 같은 리다이렉트로 보고 Location 끝부분을 비교한다', () => {
    expect(
      checkResponse({ path: '/en/', status: 307, location: '/en' }, { status: 308, location: 'http://x/en', body: '' }),
    ).toEqual([])
  })

  it('Location 이 다르면 실패를 알린다', () => {
    expect(
      checkResponse({ path: '/en/', status: 307, location: '/en' }, { status: 307, location: '/fr', body: '' }),
    ).toEqual(['/en/: Location 이 "/en" 으로 끝나야 합니다 (실제 /fr)'])
  })
})
