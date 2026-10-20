// 목차에서 하이라이트할 헤딩. 기준선(화면 위에서 threshold px) 위로 올라간 마지막 헤딩이다.
// 마지막 섹션이 짧아 기준선에 닿지 못해도 페이지 끝까지 내렸으면 마지막 헤딩으로 본다
export function pickActiveHeading(
  headings: Array<{ id: string; top: number }>,
  opts: { threshold: number; atBottom: boolean },
): string | null {
  if (headings.length === 0) return null
  if (opts.atBottom) return headings[headings.length - 1].id
  let active: string | null = null
  for (const heading of headings) {
    if (heading.top <= opts.threshold) active = heading.id
  }
  return active
}
