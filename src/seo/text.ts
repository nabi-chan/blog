// 메타 길이 상한을 넘으면 코드 포인트 기준으로 자르고 … 를 붙인다 (스펙 4.9)
export function truncateMeta(text: string, max: number): string {
  const chars = [...text.trim()]
  if (chars.length <= max) return chars.join('')
  return `${chars
    .slice(0, max - 1)
    .join('')
    .trimEnd()}…`
}

const XML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => XML_ENTITIES[char])
}
