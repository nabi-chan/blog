import { describe, expect, it } from 'vitest'
import { deLocalizeUrl, localizeUrl, strategy } from '~/paraglide/runtime'

// pnpm test 는 Paraglide CLI 로 런타임을 만든다. CLI 도 vite 플러그인과 같은 설정
// (project.inlang/paraglide.config.ts)을 읽어야 테스트·dev·빌드의 언어 판정이 같다
describe('컴파일된 Paraglide 런타임', () => {
  it('언어는 URL 로만 정한다', () => {
    expect(strategy).toEqual(['url', 'baseLocale'])
  })

  it('영어는 /en 접두사, 한국어는 접두사 없음', () => {
    expect(localizeUrl('https://nabichan.me/261020', { locale: 'en' }).pathname).toBe('/en/261020')
    expect(deLocalizeUrl('https://nabichan.me/en/261020').pathname).toBe('/261020')
  })
})
