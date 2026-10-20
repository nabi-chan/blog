import { describe, expect, it } from 'vitest'
import { widgetNames } from '../config/names'
import { widgets } from './registry'

describe('widgets', () => {
  it('등록 목록과 이름 목록이 같다', () => {
    expect(Object.keys(widgets).sort()).toEqual([...widgetNames].sort())
  })

  it('모든 위젯이 컴포넌트를 불러온다', async () => {
    for (const load of Object.values(widgets)) expect(typeof (await load()).default).toBe('function')
  })
})
