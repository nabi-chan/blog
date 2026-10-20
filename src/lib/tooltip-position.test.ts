import { describe, expect, it } from 'vitest'
import { computeTooltipPosition } from './tooltip-position'

const tooltip = { width: 200, height: 50 }
const viewport = { width: 1000, height: 800 }

describe('computeTooltipPosition', () => {
  it('기본은 대상 아래 가운데', () => {
    expect(computeTooltipPosition({ top: 100, bottom: 120, left: 400, width: 100 }, tooltip, viewport)).toEqual({
      top: 128,
      left: 350,
      placement: 'bottom',
    })
  })

  it('아래 공간이 모자라면 위로 올린다', () => {
    expect(computeTooltipPosition({ top: 760, bottom: 780, left: 400, width: 100 }, tooltip, viewport)).toEqual({
      top: 702,
      left: 350,
      placement: 'top',
    })
  })

  it('화면 좌우 8px 안으로 자른다', () => {
    expect(computeTooltipPosition({ top: 100, bottom: 120, left: 0, width: 20 }, tooltip, viewport).left).toBe(8)
    expect(computeTooltipPosition({ top: 100, bottom: 120, left: 990, width: 10 }, tooltip, viewport).left).toBe(792)
  })
})
