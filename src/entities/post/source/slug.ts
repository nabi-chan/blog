import { SLUG_PATTERN } from '../../../shared/config'

const yymmdd = (dateIso: string) => `${dateIso.slice(2, 4)}${dateIso.slice(5, 7)}${dateIso.slice(8, 10)}`

// 글 폴더 이름(slug)은 YYMMDD(-kebab)? 이고, YYMMDD 는 frontmatter 날짜(KST)와 같아야 한다
export function validateSlug(slug: string, dateIso: string): void {
  const match = SLUG_PATTERN.exec(slug)
  if (!match) {
    throw new Error(`${slug}: 글 폴더 이름은 YYMMDD 또는 YYMMDD-kebab-case 여야 합니다 (예: 261020, 261020-hello)`)
  }
  if (match[1] !== yymmdd(dateIso)) {
    throw new Error(`${slug}: 폴더 이름의 날짜(${match[1]})가 frontmatter date(${dateIso.slice(0, 10)})와 다릅니다`)
  }
}

// 하루 한 편: 같은 YYMMDD 로 시작하는 다른 글 폴더
export function sameDayConflicts(slug: string, slugs: string[]): string[] {
  const day = slug.slice(0, 6)
  return slugs.filter((other) => other !== slug && other.slice(0, 6) === day)
}
