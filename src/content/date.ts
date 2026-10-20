import type { Locale } from '~/i18n/runtime'

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/

const pad = (value: number) => String(value).padStart(2, '0')

// frontmatter 날짜는 KST 다. 빌드(로컬)와 Worker(UTC)가 같은 값으로 읽도록 오프셋을 박아 둔다
export function parseKstDate(input: string): string {
  const match = DATE_PATTERN.exec(input)
  if (!match) throw new Error(`날짜 형식이 틀렸습니다: ${input} (YYYY-MM-DD[ HH:mm[:ss]])`)
  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part ?? 0))
  // 2월 30일 같은 값은 Date.UTC 가 다음 달로 넘기므로 역검산으로 거른다
  const check = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute ||
    check.getUTCSeconds() !== second
  ) {
    throw new Error(`존재하지 않는 날짜입니다: ${input}`)
  }
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+09:00`
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    dateStyle: 'long',
    timeZone: 'Asia/Seoul',
  }).format(new Date(iso))
}

// parseKstDate 결과는 +09:00 오프셋을 가지므로 앞 네 자리가 곧 KST 연도다
export function kstYear(iso: string): number {
  return Number(iso.slice(0, 4))
}
