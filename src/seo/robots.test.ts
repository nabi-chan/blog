import { describe, expect, it } from 'vitest'
import { AI_CRAWLERS, buildRobots } from './robots'

describe('buildRobots', () => {
  const text = buildRobots()
  const groups = text.trim().split(/\n\s*\n/)

  it('AI 검색·사용자 요청·학습 크롤러를 이름으로 허용한다', () => {
    for (const name of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot']) {
      expect(AI_CRAWLERS).toContain(name)
      expect(text).toContain(`User-agent: ${name}\n`)
    }
  })

  it('* 그룹과 AI 그룹 모두 /api/ 와 /admin 을 막는다 (UA 를 지정한 그룹은 * 를 물려받지 않는다)', () => {
    const ruleGroups = groups.filter((group) => group.startsWith('User-agent:'))
    expect(ruleGroups).toHaveLength(2)
    for (const group of ruleGroups) {
      expect(group).toContain('Allow: /\n')
      expect(group).toContain('Disallow: /api/\n')
      expect(group).toContain('Disallow: /admin')
    }
  })

  it('마지막 줄은 sitemap 주소다', () => {
    expect(text.trimEnd().split('\n').at(-1)).toBe('Sitemap: https://nabichan.me/sitemap.xml')
  })
})
