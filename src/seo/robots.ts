import { site } from '~/site'
import { absoluteUrl } from './url'

// AI 검색·사용자 요청·학습 크롤러. 막지 않는다는 뜻을 이름으로 분명히 남긴다 (스펙 4.9)
export const AI_CRAWLERS: readonly string[] = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
]

const RULES = [`Content-Signal: ${site.contentSignal}`, 'Allow: /', 'Disallow: /api/', 'Disallow: /admin']

// UA 를 지정한 그룹은 * 그룹 규칙을 물려받지 않으므로 같은 규칙을 다시 적는다
export function buildRobots(): string {
  return [
    ['User-agent: *', ...RULES].join('\n'),
    [...AI_CRAWLERS.map((name) => `User-agent: ${name}`), ...RULES].join('\n'),
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
  ].join('\n\n') + '\n'
}
