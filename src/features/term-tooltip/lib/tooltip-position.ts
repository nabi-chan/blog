const EDGE = 8

// 툴팁 위치(뷰포트 좌표). 기본은 대상 아래, 아래 공간이 모자라면 위. 가로는 화면 좌우 8px 안으로 자른다
export function computeTooltipPosition(
  target: { top: number; bottom: number; left: number; width: number },
  tooltip: { width: number; height: number },
  viewport: { width: number; height: number },
  gap = 8,
): { top: number; left: number; placement: 'top' | 'bottom' } {
  const centered = target.left + target.width / 2 - tooltip.width / 2
  const left = Math.min(Math.max(centered, EDGE), viewport.width - EDGE - tooltip.width)
  const below = target.bottom + gap
  if (below + tooltip.height <= viewport.height) return { top: below, left, placement: 'bottom' }
  return { top: target.top - gap - tooltip.height, left, placement: 'top' }
}
