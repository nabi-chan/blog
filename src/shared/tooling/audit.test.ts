import { describe, expect, it } from 'vitest'
import {
  BUDGETS,
  type LiveInput,
  budgetResults,
  changedMigrations,
  formatResult,
  leakedPostText,
  liveResults,
  median,
  migrationCheck,
  pendingMigrations,
  securityHeaderGaps,
  summarize,
  translationResults,
} from './audit'
import { SECURITY_HEADERS } from '../lib/security-headers'

describe('summarize', () => {
  it('FAIL 이 하나라도 있으면 exitCode 1 이다', () => {
    expect(summarize([{ id: 'a', status: 'PASS', message: '' }, { id: 'b', status: 'FAIL', message: '' }])).toEqual({
      counts: { PASS: 1, WARN: 0, FAIL: 1, INFO: 0 },
      exitCode: 1,
    })
    expect(summarize([{ id: 'a', status: 'WARN', message: '' }, { id: 'b', status: 'INFO', message: '' }]).exitCode).toBe(0)
  })
})

describe('formatResult', () => {
  it('상태·메시지와 두 칸 들여 쓴 세부를 낸다', () => {
    expect(formatResult({ id: 'translation', status: 'FAIL', message: '번역: 261020 낡음', details: ['a', 'b'] })).toBe('[FAIL] 번역: 261020 낡음\n  - a\n  - b')
    expect(formatResult({ id: 'test', status: 'PASS', message: '테스트' })).toBe('[PASS] 테스트')
  })
})

describe('translationResults', () => {
  it('번역 상태마다 정해진 단계를 낸다', () => {
    const results = translationResults([
      { slug: 'a', en: 'missing', structure: [] },
      { slug: 'b', en: 'stale', structure: [] },
      { slug: 'c', en: 'machine', structure: [] },
      { slug: 'd', en: 'reviewed', structure: [] },
      { slug: 'e', en: 'reviewed', structure: ['헤딩 깊이가 다릅니다'] },
    ])
    expect(results.map((result) => [result.id, result.status])).toEqual([
      ['translation:a', 'INFO'],
      ['translation:b', 'FAIL'],
      ['translation:c', 'INFO'],
      ['translation:d', 'PASS'],
      ['translation:e', 'FAIL'],
    ])
    expect(results[4].details).toEqual(['헤딩 깊이가 다릅니다'])
  })
})

describe('changedMigrations', () => {
  it('이미 있던 마이그레이션의 수정·삭제·이름 변경만 낸다 (추가는 정상)', () => {
    const status = 'M\tmigrations/0001_a.sql\nA\tmigrations/0003_b.sql\nR100\tmigrations/0002_x.sql\tmigrations/0002_y.sql\nD\tmigrations/0004_c.sql\n'
    expect(changedMigrations(status)).toEqual(['migrations/0001_a.sql', 'migrations/0002_x.sql', 'migrations/0004_c.sql'])
    expect(changedMigrations('')).toEqual([])
  })
})

describe('pendingMigrations', () => {
  it('wrangler 표에서 미적용 파일 이름을 뽑는다', () => {
    const output = ['Migrations to be applied:', '┌─────────────────┐', '│ Name            │', '├─────────────────┤', '│ 0003_x.sql      │', '│ 0004_y.sql      │', '└─────────────────┘'].join('\n')
    expect(pendingMigrations(output)).toEqual(['0003_x.sql', '0004_y.sql'])
  })

  it('색 코드가 섞여도 읽고, 표가 있다는데 이름을 못 읽으면 통과로 두지 않는다', () => {
    const colored = 'Migrations to be applied:\n\u001b[2m│\u001b[22m 0003_x.sql \u001b[2m│\u001b[22m\n'
    expect(pendingMigrations(colored)).toEqual(['0003_x.sql'])
    expect(pendingMigrations('Migrations to be applied:\n(알 수 없는 형식)')).toEqual(['(목록을 읽지 못함 — wrangler 출력을 확인하세요)'])
  })

  it('적용할 것이 없으면 빈 배열이다', () => {
    expect(pendingMigrations('✅ No migrations to apply!')).toEqual([])
  })
})

describe('BUDGETS / budgetResults', () => {
  it('클라이언트 JS gzip 170KB, Worker 64 MiB 다', () => {
    expect(BUDGETS).toEqual({ clientJsGzipBytes: 170 * 1024, workerBytes: 64 * 1024 * 1024 })
  })

  it('예산 안이면 PASS, 넘으면 FAIL, Worker 가 절반을 넘으면 WARN', () => {
    const status = (input: { clientJsGzipBytes: number; workerBytes: number }) => budgetResults(input).map((result) => result.status)
    expect(status({ clientJsGzipBytes: 100 * 1024, workerBytes: 5 * 1024 * 1024 })).toEqual(['PASS', 'PASS'])
    expect(status({ clientJsGzipBytes: 171 * 1024, workerBytes: 33 * 1024 * 1024 })).toEqual(['FAIL', 'WARN'])
    expect(status({ clientJsGzipBytes: 1, workerBytes: 65 * 1024 * 1024 })).toEqual(['PASS', 'FAIL'])
  })
})

describe('leakedPostText', () => {
  it('클라이언트 에셋에 본문 문장이 실린 글을 낸다', () => {
    const posts = [
      { slug: '261020', marker: '이 블로그는 TanStack Start 로 만든 개인 블로그입니다' },
      { slug: '261021', marker: '다른 글의 긴 문장입니다' },
    ]
    expect(leakedPostText(['var a="이 블로그는 TanStack Start 로 만든 개인 블로그입니다"', 'console.log(1)'], posts)).toEqual(['261020'])
    expect(leakedPostText(['console.log(1)'], posts)).toEqual([])
  })
})

describe('median', () => {
  it('가운데 값을 낸다', () => {
    expect(median([30, 10, 20])).toBe(20)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe('securityHeaderGaps', () => {
  it('빠진 헤더와 값이 다른 헤더를 낸다', () => {
    expect(securityHeaderGaps(new Headers())).toEqual(['strict-transport-security', 'x-content-type-options', 'referrer-policy', 'content-security-policy'])
    expect(securityHeaderGaps(new Headers({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin' }))).toEqual([
      'strict-transport-security',
      'referrer-policy (값이 다름)',
      'content-security-policy',
    ])
    expect(securityHeaderGaps(new Headers({ ...SECURITY_HEADERS }))).toEqual([])
  })
})

describe('liveResults', () => {
  const healthy: LiveInput = {
    pages: [{ path: '/', status: 200, ttfbMs: [40, 20, 30, 50, 10], cache: 'HIT' }],
    headers: [
      {
        path: '/',
        headers: new Headers({ ...SECURITY_HEADERS }),
      },
    ],
    sitemapUrls: ['https://nabichan.me/261020'],
    draftSlugs: ['261021'],
    untranslated: [{ slug: '261019', status: 404 }],
    metaUrlStatuses: [{ url: 'https://nabichan.me/261020', status: 200 }],
    apiStatus: 200,
    redirect: { status: 301, location: 'https://nabichan.me/' },
    httpRedirect: { status: 301, location: 'https://nabichan.me/' },
  }
  const fails = (input: LiveInput) => liveResults(input).filter((result) => result.status === 'FAIL').map((result) => result.id)

  it('모두 정상이면 FAIL 이 없고, TTFB 중앙값과 캐시 상태를 INFO 로 남긴다', () => {
    const results = liveResults(healthy)
    expect(fails(healthy)).toEqual([])
    expect(results.find((result) => result.id === 'live:ttfb')).toMatchObject({ status: 'INFO', details: ['/ 30ms (cf-cache-status HIT)'] })
  })

  it('문제마다 FAIL 을 낸다', () => {
    expect(fails({ ...healthy, pages: [{ path: '/', status: 500, ttfbMs: [1], cache: null }] })).toEqual(['live:pages'])
    expect(fails({ ...healthy, sitemapUrls: ['https://nabichan.me/261021'] })).toEqual(['live:draft'])
    expect(fails({ ...healthy, untranslated: [{ slug: '261019', status: 200 }] })).toEqual(['live:untranslated'])
    expect(fails({ ...healthy, metaUrlStatuses: [{ url: 'x', status: 307 }] })).toEqual(['live:meta-urls'])
    expect(fails({ ...healthy, apiStatus: 503 })).toEqual(['live:api'])
    expect(fails({ ...healthy, redirect: { status: 302, location: 'https://nabichan.me/' } })).toEqual(['live:redirect'])
  })

  it('보안 헤더는 응답마다 보고, 빠진 헤더를 경로와 함께 FAIL 로 낸다', () => {
    const results = liveResults({ ...healthy, headers: [...healthy.headers, { path: '/api/me', headers: new Headers({ 'x-content-type-options': 'nosniff' }) }] })
    expect(results.find((result) => result.id === 'live:headers')).toMatchObject({
      status: 'FAIL',
      details: ['/api/me: strict-transport-security', '/api/me: referrer-policy', '/api/me: content-security-policy'],
    })
  })

  it('http 로 온 요청은 https 로 301 이어야 하고, 검사를 안 하면 INFO 다', () => {
    expect(fails({ ...healthy, httpRedirect: { status: 200, location: null } })).toEqual(['live:https'])
    expect(fails({ ...healthy, httpRedirect: { status: 301, location: 'http://nabichan.me/' } })).toEqual(['live:https'])
    expect(liveResults({ ...healthy, httpRedirect: undefined }).find((result) => result.id === 'live:https')?.status).toBe('INFO')
  })

  it('nabi.kim 검사를 안 하면 INFO 다', () => {
    const results = liveResults({ ...healthy, redirect: undefined })
    expect(results.find((result) => result.id === 'live:redirect')?.status).toBe('INFO')
  })
})

describe('migrationCheck', () => {
  it('작업 트리나 전체 이력에서 커밋된 마이그레이션을 고친 적이 있으면 FAIL', () => {
    expect(migrationCheck({ working: '', history: 'M\tmigrations/0001_a.sql\n\nD\tmigrations/0003_c.sql\n' })).toMatchObject({
      status: 'FAIL',
      details: ['migrations/0001_a.sql', 'migrations/0003_c.sql'],
    })
    expect(migrationCheck({ working: 'M\tmigrations/0002_b.sql\n', history: '' })).toMatchObject({ status: 'FAIL', details: ['migrations/0002_b.sql'] })
  })

  it('고친 적이 없으면 PASS, 이력을 못 읽으면(얕은 clone 등) INFO', () => {
    expect(migrationCheck({ working: '', history: '' })).toMatchObject({ status: 'PASS' })
    expect(migrationCheck({ working: '', history: null })).toMatchObject({ status: 'INFO' })
  })
})
