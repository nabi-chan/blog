const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/;

export function parseSeoulDate(value: string): Date | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  const utc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - 9,
    Number(minute),
    Number(second),
  );
  const date = new Date(utc);

  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDisplayDate(dateTime: string): string {
  const date = parseSeoulDate(dateTime);
  if (!date) return dateTime;

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function compareEntryDate(
  a: { dateTime: string; slug: string },
  b: { dateTime: string; slug: string },
): number {
  const aDate = parseSeoulDate(a.dateTime)?.getTime() ?? 0;
  const bDate = parseSeoulDate(b.dateTime)?.getTime() ?? 0;

  if (aDate !== bDate) return aDate - bDate;
  return a.slug.localeCompare(b.slug);
}

export function toRssDate(dateTime: string): string {
  return parseSeoulDate(dateTime)?.toUTCString() ?? new Date(0).toUTCString();
}

export function toSitemapDate(dateTime: string): string {
  return parseSeoulDate(dateTime)?.toISOString() ?? new Date(0).toISOString();
}
