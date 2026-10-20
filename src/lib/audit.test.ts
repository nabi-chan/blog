import { describe, expect, it } from 'vitest'
import { changedMigrations, formatResult, pendingMigrations, summarize, translationResults } from './audit'

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

  it('적용할 것이 없으면 빈 배열이다', () => {
    expect(pendingMigrations('✅ No migrations to apply!')).toEqual([])
  })
})
